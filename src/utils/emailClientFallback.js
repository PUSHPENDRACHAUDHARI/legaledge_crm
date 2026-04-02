const SMTP_CONFIG_ERROR_PATTERNS = [
  'smtp is not configured',
  'smtp send failed',
  'email_host_user',
  'email_host_password',
  'gmail app password',
  'authentication failed',
  'connection refused',
  'unable to connect',
];

const toAddressString = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean).join(',');
  return String(raw || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(',');
};

export function isSmtpConfigError(err) {
  const message = String(err?.message || '').toLowerCase();
  return SMTP_CONFIG_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function buildComposeUrl(provider, payload) {
  const to = toAddressString(payload?.to);
  const cc = toAddressString(payload?.cc);
  const subject = String(payload?.subject || '');
  const body = String(payload?.body || '');

  if (provider === 'gmail') {
    const qs = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to,
      cc,
      su: subject,
      body,
    });
    return `https://mail.google.com/mail/?${qs.toString()}`;
  }

  if (provider === 'outlook') {
    const qs = new URLSearchParams({
      to,
      cc,
      subject,
      body,
    });
    return `https://outlook.office.com/mail/deeplink/compose?${qs.toString()}`;
  }

  const qs = new URLSearchParams({
    cc,
    subject,
    body,
  });
  return `mailto:${encodeURIComponent(to)}?${qs.toString()}`;
}

export function openProviderCompose(provider, payload) {
  if (typeof window === 'undefined') return false;
  const url = buildComposeUrl(provider, payload);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
