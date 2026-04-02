import { useEffect, useMemo, useState } from 'react';
import { authAPI, clearTokens } from '../services/api';
import { decodeToken } from '../utils/auth';

function getTokenSnapshot() {
  const localAccess = localStorage.getItem('crm_token');
  const sessionAccess = sessionStorage.getItem('crm_token');
  const localRefresh = localStorage.getItem('crm_refresh');
  const sessionRefresh = sessionStorage.getItem('crm_refresh');
  const localUser = localStorage.getItem('crm_user');
  const sessionUser = sessionStorage.getItem('crm_user');

  const access = localAccess || sessionAccess;
  const payload = decodeToken(access);
  const expAt = payload?.exp ? new Date(payload.exp * 1000) : null;
  const now = new Date();

  return {
    source: localAccess ? 'localStorage' : sessionAccess ? 'sessionStorage' : 'none',
    accessPresent: !!access,
    refreshPresent: !!(localRefresh || sessionRefresh),
    userPresent: !!(localUser || sessionUser),
    expAt,
    expired: !!(expAt && expAt <= now),
    claims: payload,
  };
}

export default function AuthDebugPanel() {
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(() => getTokenSnapshot());
  const [meStatus, setMeStatus] = useState({ state: 'idle', detail: '' });
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

  const claimSummary = useMemo(() => {
    if (!snapshot.claims) return 'None';
    const userId = snapshot.claims.user_id ?? snapshot.claims.sub ?? '-';
    const tokenType = snapshot.claims.token_type ?? 'access';
    return `${tokenType} | user_id: ${userId}`;
  }, [snapshot.claims]);

  const refreshSnapshot = () => {
    setSnapshot(getTokenSnapshot());
  };

  const runAuthMeCheck = async () => {
    if (!snapshot.accessPresent) {
      setMeStatus({ state: 'error', detail: 'No access token in storage. Login first.' });
      return;
    }

    setMeStatus({ state: 'loading', detail: 'Checking /auth/me...' });
    try {
      const me = await authAPI.me();
      setMeStatus({
        state: 'ok',
        detail: `OK (${me?.email || me?.name || 'user'})`,
      });
    } catch (err) {
      const code = err?.status ? `${err.status}` : '';
      const message = err?.message || 'Unknown auth error';
      setMeStatus({
        state: 'error',
        detail: `${code ? `${code} ` : ''}${message}`,
      });
    }
  };

  useEffect(() => {
    refreshSnapshot();
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 12000,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            border: '1px solid #2d3748',
            background: '#111827',
            color: '#e5e7eb',
            borderRadius: 8,
            fontSize: 12,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
        >
          Auth Debug
        </button>
      ) : (
        <div
          style={{
            width: 340,
            border: '1px solid #1f2937',
            background: '#0b1220',
            color: '#e5e7eb',
            borderRadius: 10,
            boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
            padding: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 12 }}>Auth Debug (DEV)</strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 0, color: '#9ca3af', cursor: 'pointer' }}
            >
              close
            </button>
          </div>

          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            <div>API Base: {baseUrl}</div>
            <div>Token Source: {snapshot.source}</div>
            <div>Access Token: {snapshot.accessPresent ? 'yes' : 'no'}</div>
            <div>Refresh Token: {snapshot.refreshPresent ? 'yes' : 'no'}</div>
            <div>User Object: {snapshot.userPresent ? 'yes' : 'no'}</div>
            <div>Claims: {claimSummary}</div>
            <div>
              Expires:{' '}
              {snapshot.expAt ? snapshot.expAt.toLocaleString() : 'Unknown'}
              {snapshot.expired ? ' (expired)' : ''}
            </div>
            <div>
              /auth/me:{' '}
              {meStatus.state === 'idle' ? 'not checked' : meStatus.detail}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={refreshSnapshot}
              style={{
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              Refresh Snapshot
            </button>
            <button
              type="button"
              onClick={runAuthMeCheck}
              disabled={!snapshot.accessPresent}
              style={{
                background: snapshot.accessPresent ? '#1d4ed8' : '#334155',
                color: '#f8fafc',
                border: snapshot.accessPresent ? '1px solid #3b82f6' : '1px solid #475569',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 8px',
                cursor: snapshot.accessPresent ? 'pointer' : 'not-allowed',
                opacity: snapshot.accessPresent ? 1 : 0.8,
              }}
            >
              Check /auth/me
            </button>
            <button
              type="button"
              onClick={() => {
                clearTokens();
                refreshSnapshot();
                setMeStatus({ state: 'idle', detail: '' });
              }}
              style={{
                background: '#7f1d1d',
                color: '#fee2e2',
                border: '1px solid #b91c1c',
                borderRadius: 6,
                fontSize: 11,
                padding: '6px 8px',
                cursor: 'pointer',
              }}
            >
              Clear Tokens
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
