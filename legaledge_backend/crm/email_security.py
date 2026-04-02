import base64
import hashlib

from django.conf import settings


class EmailSecurityError(RuntimeError):
    pass


def _build_fernet_key():
    raw = getattr(settings, 'EMAIL_TOKEN_ENCRYPTION_KEY', '') or settings.SECRET_KEY
    digest = hashlib.sha256(str(raw).encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet():
    try:
        from cryptography.fernet import Fernet
    except ImportError as exc:
        raise EmailSecurityError(
            'cryptography package is required for token encryption. Install "cryptography" to use OAuth email accounts.'
        ) from exc
    return Fernet(_build_fernet_key())


def encrypt_token(raw):
    if not raw:
        return ''
    token = str(raw).strip()
    if not token:
        return ''
    return _fernet().encrypt(token.encode('utf-8')).decode('utf-8')


def decrypt_token(encrypted):
    if not encrypted:
        return ''
    try:
        return _fernet().decrypt(str(encrypted).encode('utf-8')).decode('utf-8')
    except Exception as exc:
        raise EmailSecurityError('Unable to decrypt stored email token.') from exc

