import base64
import json
from datetime import timedelta
from email.mime.text import MIMEText
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

from django.conf import settings
from django.core import signing
from django.utils import timezone

from .models import EmailMessageRecord, UserEmailAccount


class EmailOAuthError(RuntimeError):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code


PROVIDER_CONFIG = {
    'gmail': {
        'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'scopes': [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
        ],
    },
    'outlook': {
        'authorize_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        'scopes': [
            'offline_access',
            'Mail.Send',
            'Mail.Read',
            'User.Read',
        ],
    },
}


def _json_request(url, *, method='GET', payload=None, headers=None, form_encoded=False):
    hdrs = {'Accept': 'application/json'}
    if headers:
        hdrs.update(headers)
    body = None
    if payload is not None:
        if form_encoded:
            body = urlparse.urlencode(payload).encode('utf-8')
            hdrs['Content-Type'] = 'application/x-www-form-urlencoded'
        else:
            body = json.dumps(payload).encode('utf-8')
            hdrs['Content-Type'] = 'application/json'

    req = urlrequest.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urlrequest.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode('utf-8') or '{}'
            return json.loads(raw), resp.status
    except urlerror.HTTPError as exc:
        raw = exc.read().decode('utf-8') if exc.fp else ''
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {'error': raw or str(exc)}
        raise EmailOAuthError(parsed.get('error_description') or parsed.get('error') or str(parsed), status_code=exc.code)
    except urlerror.URLError as exc:
        raise EmailOAuthError(f'Network error while contacting provider API: {exc.reason}', status_code=503) from exc


def _redirect_uri(provider, request=None):
    if provider == 'gmail':
        configured = getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI', '')
        if configured:
            return configured
        if request is None:
            raise EmailOAuthError('Google OAuth redirect URI is not configured.', status_code=500)
        return request.build_absolute_uri('/api/email/oauth/gmail/callback/')
    if provider == 'outlook':
        configured = getattr(settings, 'MICROSOFT_OAUTH_REDIRECT_URI', '')
        if configured:
            return configured
        if request is None:
            raise EmailOAuthError('Microsoft OAuth redirect URI is not configured.', status_code=500)
        return request.build_absolute_uri('/api/email/oauth/outlook/callback/')
    raise EmailOAuthError('Unsupported provider.', status_code=400)


def _provider_client(provider):
    if provider == 'gmail':
        return (
            getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', ''),
            getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', ''),
        )
    if provider == 'outlook':
        return (
            getattr(settings, 'MICROSOFT_OAUTH_CLIENT_ID', ''),
            getattr(settings, 'MICROSOFT_OAUTH_CLIENT_SECRET', ''),
        )
    raise EmailOAuthError('Unsupported provider.', status_code=400)


def _require_provider(provider):
    cfg = PROVIDER_CONFIG.get(provider)
    if not cfg:
        raise EmailOAuthError(f'Unsupported provider "{provider}".', status_code=400)
    client_id, client_secret = _provider_client(provider)
    if not client_id or not client_secret:
        raise EmailOAuthError(
            f'{provider} OAuth is not configured. Set client id/secret in backend environment.',
            status_code=500,
        )
    return cfg, client_id, client_secret


def generate_connect_url(provider, user, request=None):
    cfg, client_id, _client_secret = _require_provider(provider)
    state_payload = {
        'provider': provider,
        'user_id': user.id,
        'nonce': timezone.now().timestamp(),
    }
    state = signing.dumps(state_payload, salt='email-oauth-state')
    redirect_uri = _redirect_uri(provider, request=request)
    scope = ' '.join(cfg['scopes'])
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': scope,
        'state': state,
    }
    if provider == 'gmail':
        params['access_type'] = 'offline'
        params['prompt'] = 'consent'
        params['include_granted_scopes'] = 'true'
    connect_url = f"{cfg['authorize_url']}?{urlparse.urlencode(params)}"
    return connect_url, state


def _exchange_code(provider, code, *, redirect_uri):
    cfg, client_id, client_secret = _require_provider(provider)
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': client_id,
        'client_secret': client_secret,
    }
    data, _status = _json_request(cfg['token_url'], method='POST', payload=payload, form_encoded=True)
    if 'access_token' not in data:
        raise EmailOAuthError('OAuth token exchange failed: access_token missing.', status_code=400)
    return data


def _refresh_token(provider, refresh_token):
    cfg, client_id, client_secret = _require_provider(provider)
    payload = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': client_id,
        'client_secret': client_secret,
    }
    data, _status = _json_request(cfg['token_url'], method='POST', payload=payload, form_encoded=True)
    if 'access_token' not in data:
        raise EmailOAuthError('OAuth token refresh failed. Please reconnect your email.', status_code=401)
    return data


def _gmail_profile(access_token):
    data, _status = _json_request(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    email_address = data.get('emailAddress', '')
    if not email_address:
        raise EmailOAuthError('Unable to resolve Gmail account email address.', status_code=400)
    return email_address


def _outlook_profile(access_token):
    data, _status = _json_request(
        'https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    email_address = data.get('mail') or data.get('userPrincipalName')
    if not email_address:
        raise EmailOAuthError('Unable to resolve Outlook account email address.', status_code=400)
    return email_address, data.get('id', '')


def complete_oauth_connection(provider, *, code, state, request=None):
    try:
        state_data = signing.loads(state, salt='email-oauth-state', max_age=600)
    except signing.BadSignature as exc:
        raise EmailOAuthError('Invalid OAuth state. Please retry connecting your email.', status_code=400) from exc

    if state_data.get('provider') != provider:
        raise EmailOAuthError('OAuth provider mismatch in state payload.', status_code=400)

    user_id = state_data.get('user_id')
    if not user_id:
        raise EmailOAuthError('OAuth state is missing user identity.', status_code=400)

    redirect_uri = _redirect_uri(provider, request=request)
    token_data = _exchange_code(provider, code, redirect_uri=redirect_uri)
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in', 3600)
    scope = token_data.get('scope', '')

    if provider == 'gmail':
        email_address = _gmail_profile(access_token)
        external_id = ''
    else:
        email_address, external_id = _outlook_profile(access_token)

    account = UserEmailAccount.objects.filter(
        user_id=user_id, provider=provider, email_address=email_address
    ).first()
    if not account:
        account = UserEmailAccount(
            user_id=user_id,
            provider=provider,
            email_address=email_address,
        )

    account.scope = scope
    account.external_account_id = external_id or account.external_account_id
    account.is_active = True
    account.set_tokens(access_token=access_token, refresh_token=refresh_token, expires_in=expires_in)
    account.save()
    return account


def ensure_access_token(account):
    if not account.token_is_expired():
        return account.get_access_token()

    refresh_token = account.get_refresh_token()
    if not refresh_token:
        raise EmailOAuthError('Your email session expired. Please reconnect your email account.', status_code=401)

    refreshed = _refresh_token(account.provider, refresh_token)
    account.set_tokens(
        access_token=refreshed.get('access_token'),
        refresh_token=refreshed.get('refresh_token') or refresh_token,
        expires_in=refreshed.get('expires_in', 3600),
    )
    account.scope = refreshed.get('scope', account.scope)
    account.save(update_fields=['access_token', 'refresh_token', 'token_expiry', 'scope', 'updated_at'])
    return account.get_access_token()


def _gmail_send(account, access_token, *, to_list, cc_list, subject, body, thread_id=''):
    msg = MIMEText(body or '', 'plain', 'utf-8')
    msg['to'] = ', '.join(to_list)
    if cc_list:
        msg['cc'] = ', '.join(cc_list)
    msg['subject'] = subject or ''
    msg['from'] = account.email_address
    encoded = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
    payload = {'raw': encoded}
    if thread_id:
        payload['threadId'] = thread_id
    data, _status = _json_request(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method='POST',
        payload=payload,
        headers={'Authorization': f'Bearer {access_token}'},
    )
    return {'external_id': data.get('id', ''), 'thread_id': data.get('threadId', thread_id or '')}


def _outlook_send(account, access_token, *, to_list, cc_list, subject, body):
    payload = {
        'message': {
            'subject': subject or '',
            'body': {'contentType': 'Text', 'content': body or ''},
            'toRecipients': [{'emailAddress': {'address': address}} for address in to_list],
            'ccRecipients': [{'emailAddress': {'address': address}} for address in cc_list],
        },
        'saveToSentItems': True,
    }
    _data, _status = _json_request(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        method='POST',
        payload=payload,
        headers={'Authorization': f'Bearer {access_token}'},
    )
    return {'external_id': '', 'thread_id': ''}


def send_email(account, *, to_list, cc_list, subject, body, thread_id=''):
    access_token = ensure_access_token(account)
    if account.provider == 'gmail':
        provider_meta = _gmail_send(
            account,
            access_token,
            to_list=to_list,
            cc_list=cc_list,
            subject=subject,
            body=body,
            thread_id=thread_id,
        )
    elif account.provider == 'outlook':
        provider_meta = _outlook_send(
            account,
            access_token,
            to_list=to_list,
            cc_list=cc_list,
            subject=subject,
            body=body,
        )
    else:
        raise EmailOAuthError(f'Unsupported provider "{account.provider}".', status_code=400)

    now = timezone.now()
    created = []
    for recipient in to_list:
        row = EmailMessageRecord.objects.create(
            owner=account.user,
            account=account,
            folder='sent',
            direction='outbound',
            provider=account.provider,
            external_id=provider_meta.get('external_id', ''),
            thread_id=provider_meta.get('thread_id', thread_id or ''),
            from_email=account.email_address,
            to_email=recipient,
            cc=','.join(cc_list),
            subject=subject or '',
            snippet=(body or '')[:180],
            body=body or '',
            unread=False,
            received_at=now,
            synced_at=now,
        )
        created.append(row)
    return created


def _upsert_email_record(*, owner, account, folder, direction, provider, external_id, thread_id, from_email, to_email, cc, subject, body, unread, received_at):
    existing = None
    if external_id:
        existing = EmailMessageRecord.objects.filter(owner=owner, account=account, external_id=external_id).first()
    if existing:
        existing.folder = folder
        existing.direction = direction
        existing.provider = provider
        existing.thread_id = thread_id or existing.thread_id
        existing.from_email = from_email or existing.from_email
        existing.to_email = to_email or existing.to_email
        existing.cc = cc
        existing.subject = subject
        existing.body = body
        existing.snippet = (body or '')[:180]
        existing.unread = unread
        existing.received_at = received_at or existing.received_at
        existing.synced_at = timezone.now()
        existing.save()
        return existing, False

    return EmailMessageRecord.objects.create(
        owner=owner,
        account=account,
        folder=folder,
        direction=direction,
        provider=provider,
        external_id=external_id,
        thread_id=thread_id,
        from_email=from_email,
        to_email=to_email,
        cc=cc,
        subject=subject,
        snippet=(body or '')[:180],
        body=body,
        unread=unread,
        received_at=received_at,
        synced_at=timezone.now(),
    ), True


def _gmail_headers_map(payload):
    headers = payload.get('headers') or []
    result = {}
    for row in headers:
        key = str(row.get('name', '')).strip().lower()
        if key:
            result[key] = str(row.get('value', '')).strip()
    return result


def sync_gmail_inbox(account, max_results=25):
    token = ensure_access_token(account)
    list_url = f'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults={int(max_results)}'
    data, _status = _json_request(list_url, headers={'Authorization': f'Bearer {token}'})
    messages = data.get('messages') or []
    added = 0

    for row in messages:
        msg_id = row.get('id')
        if not msg_id:
            continue
        details, _ = _json_request(
            f'https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=full',
            headers={'Authorization': f'Bearer {token}'},
        )
        payload = details.get('payload') or {}
        headers = _gmail_headers_map(payload)
        from_email = headers.get('from', '')
        to_email = headers.get('to', account.email_address)
        cc = headers.get('cc', '')
        subject = headers.get('subject', '(No subject)')
        body = details.get('snippet', '')
        internal_date = details.get('internalDate')
        if internal_date:
            received_at = timezone.datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc)
        else:
            received_at = timezone.now()
        labels = details.get('labelIds') or []
        unread = 'UNREAD' in labels

        _obj, created = _upsert_email_record(
            owner=account.user,
            account=account,
            folder='inbox',
            direction='inbound',
            provider='gmail',
            external_id=msg_id,
            thread_id=details.get('threadId', ''),
            from_email=from_email,
            to_email=to_email,
            cc=cc,
            subject=subject,
            body=body,
            unread=unread,
            received_at=received_at,
        )
        if created:
            added += 1

    account.last_synced_at = timezone.now()
    account.save(update_fields=['last_synced_at', 'updated_at'])
    return added


def sync_outlook_inbox(account, max_results=25):
    token = ensure_access_token(account)
    top = max(1, min(int(max_results), 100))
    url = (
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages'
        f'?$top={top}&$orderby=receivedDateTime desc'
        '&$select=id,conversationId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead'
    )
    data, _status = _json_request(url, headers={'Authorization': f'Bearer {token}'})
    rows = data.get('value') or []
    added = 0
    for row in rows:
        sender = (((row.get('from') or {}).get('emailAddress') or {}).get('address') or '')
        to_first = ''
        to_recips = row.get('toRecipients') or []
        if to_recips:
            to_first = ((to_recips[0] or {}).get('emailAddress') or {}).get('address', '')
        cc_list = [
            ((item or {}).get('emailAddress') or {}).get('address', '')
            for item in (row.get('ccRecipients') or [])
            if ((item or {}).get('emailAddress') or {}).get('address')
        ]
        received = row.get('receivedDateTime')
        try:
            received_at = timezone.datetime.fromisoformat(received.replace('Z', '+00:00')) if received else timezone.now()
        except Exception:
            received_at = timezone.now()

        _obj, created = _upsert_email_record(
            owner=account.user,
            account=account,
            folder='inbox',
            direction='inbound',
            provider='outlook',
            external_id=row.get('id', ''),
            thread_id=row.get('conversationId', ''),
            from_email=sender,
            to_email=to_first or account.email_address,
            cc=','.join(cc_list),
            subject=row.get('subject') or '(No subject)',
            body=row.get('bodyPreview') or '',
            unread=not bool(row.get('isRead')),
            received_at=received_at,
        )
        if created:
            added += 1

    account.last_synced_at = timezone.now()
    account.save(update_fields=['last_synced_at', 'updated_at'])
    return added


def sync_account_inbox(account, max_results=25):
    if account.provider == 'gmail':
        return sync_gmail_inbox(account, max_results=max_results)
    if account.provider == 'outlook':
        return sync_outlook_inbox(account, max_results=max_results)
    raise EmailOAuthError(f'Unsupported provider "{account.provider}".', status_code=400)


def sync_all_active_accounts(user, max_results=25):
    total = 0
    accounts = UserEmailAccount.objects.filter(user=user, is_active=True).order_by('-updated_at')
    for account in accounts:
        total += sync_account_inbox(account, max_results=max_results)
    return total


def oauth_redirect_target(success=True, message=''):
    if success:
        base = getattr(settings, 'EMAIL_OAUTH_SUCCESS_REDIRECT', '').strip() or 'http://localhost:5173/settings'
        key = 'emailConnected'
    else:
        base = getattr(settings, 'EMAIL_OAUTH_ERROR_REDIRECT', '').strip() or 'http://localhost:5173/settings'
        key = 'emailError'
    if message:
        sep = '&' if '?' in base else '?'
        return f'{base}{sep}{key}={urlparse.quote_plus(message)}'
    return base

