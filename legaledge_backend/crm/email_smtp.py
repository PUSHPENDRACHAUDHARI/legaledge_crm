from uuid import uuid4
import logging

from django.conf import settings
from django.core.mail import EmailMessage, get_connection

logger = logging.getLogger(__name__)


class EmailSMTPError(RuntimeError):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code


def _looks_like_placeholder(value):
    raw = str(value or '').strip().lower()
    return (
        not raw
        or 'your_' in raw
        or 'example' in raw
        or raw.endswith('@example.com')
    )


def smtp_is_configured():
    host_user = getattr(settings, 'EMAIL_HOST_USER', '')
    host_password = getattr(settings, 'EMAIL_HOST_PASSWORD', '')
    return bool(
        getattr(settings, 'EMAIL_HOST', '')
        and getattr(settings, 'EMAIL_PORT', 0)
        and host_user
        and host_password
        and not _looks_like_placeholder(host_user)
        and not _looks_like_placeholder(host_password)
    )


def infer_smtp_provider(requested_provider=''):
    provider = str(requested_provider or '').strip().lower()
    if provider in {'gmail', 'outlook'}:
        return provider

    host = str(getattr(settings, 'EMAIL_HOST', '') or '').lower()
    if any(marker in host for marker in ('office365', 'outlook', 'hotmail', 'live.com')):
        return 'outlook'
    return 'gmail'


def send_email_via_smtp(*, to_list, cc_list, subject, body, provider='', thread_id=''):
    if not smtp_is_configured():
        raise EmailSMTPError(
            'SMTP is not configured. Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD (Gmail app password) in backend .env.',
            status_code=500,
        )

    from_email = str(getattr(settings, 'EMAIL_HOST_USER', '')).strip()
    if not from_email:
        raise EmailSMTPError(
            'SMTP is not configured. Set EMAIL_HOST_USER in backend .env.',
            status_code=500,
        )

    connection = get_connection(
        fail_silently=False,
        timeout=getattr(settings, 'EMAIL_TIMEOUT', 20),
    )
    message = EmailMessage(
        subject=subject or '',
        body=body or '',
        from_email=from_email,
        to=list(to_list or []),
        cc=list(cc_list or []),
        connection=connection,
    )

    try:
        sent_count = message.send(fail_silently=False)
        logger.info('SMTP email sent successfully.')
    except Exception as exc:
        logger.exception('SMTP send failed.')
        raise EmailSMTPError(f'SMTP send failed: {exc}', status_code=502) from exc

    if sent_count <= 0:
        raise EmailSMTPError(
            'SMTP send failed: no recipients were accepted by the mail server.',
            status_code=502,
        )

    return {
        'provider': infer_smtp_provider(provider),
        'from_email': from_email,
        'thread_id': str(thread_id or '').strip() or f'smtp-{uuid4().hex}',
    }
