const AUTH_TOKEN_KEY = 'crm_token';
const AUTH_USER_KEY = 'crm_user';

const getClientStorages = () => {
  if (typeof window === 'undefined') return [];
  return [localStorage, sessionStorage];
};

const clearStorageAuth = (storage) => {
  storage.removeItem(AUTH_TOKEN_KEY);
  storage.removeItem('crm_refresh');
  storage.removeItem(AUTH_USER_KEY);
  storage.removeItem('crm_role');
};

const getUserFromStorage = (storage) => {
  const token = storage.getItem(AUTH_TOKEN_KEY);
  const user = storage.getItem(AUTH_USER_KEY);
  if (!token || !user) {
    console.log('[AUTH] ℹ No token/user in storage, skipping validation');
    return null;
  }

  if (isTokenExpired(token)) {
    console.warn('[AUTH] ⚠ Token expired, clearing storage');
    clearStorageAuth(storage);
    return null;
  }

  try {
    const parsed = JSON.parse(user);
    console.log(`[AUTH] ✅ Valid token + user found: ${parsed.name} (${parsed.role})`);
    return parsed;
  } catch (err) {
    console.warn('[AUTH] ❌ Failed to parse stored user:', err);
    clearStorageAuth(storage);
    return null;
  }
};

export function clearStoredAuth() {
  const storages = getClientStorages();
  storages.forEach(storage => {
    clearStorageAuth(storage);
  });
}

export function getStoredAuthUser() {
  const storages = getClientStorages();
  for (const storage of storages) {
    const user = getUserFromStorage(storage);
    if (user) return user;
  }
  return null;
}

const decodeBase64Url = (raw) => {
  if (!raw) return null;
  const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  return atob(padded);
};

export function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded) {
    console.warn('[AUTH] ⚠ Token decode failed - assuming expired');
    return true;
  }
  const isExpired = decoded.exp < Math.floor(Date.now() / 1000);
  if (isExpired) {
    console.warn(`[AUTH] ⚠ Token expired: ${new Date(decoded.exp * 1000).toLocaleString()} < now`);
  } else {
    console.log(`[AUTH] ✅ Token valid until: ${new Date(decoded.exp * 1000).toLocaleString()}`);
  }
  return isExpired;
}
