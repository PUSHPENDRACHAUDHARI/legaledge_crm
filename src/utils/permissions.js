// Central source of truth for role-based access in LegalEdge CRM

export const PERMISSIONS = {
  canPublish: ['admin', 'manager'],
  canCreateReport: ['admin', 'manager'],
  canManageUsers: ['admin'],
  canAccessBilling: ['admin'],
  canManageIntegrations: ['admin'],
  canViewAllData: ['admin'],
  canViewTeamData: ['admin', 'manager'],
  canUseAutomation: ['admin', 'manager'],
  canDeleteRecord: ['admin', 'manager'],
  canAssignRecord: ['admin', 'manager'],
  canEditTemplates: ['admin', 'manager'],
  canManageWorkflows: ['admin', 'manager'],
  canCreateRecord: ['admin', 'manager', 'user'],
  canEditRecord: ['admin', 'manager', 'user'],
};

// Backward-compatible basic action map
export const permissions = {
  admin: ['create', 'read', 'update', 'delete', 'view'],
  manager: ['view', 'edit'],
  user: ['view'],
};

export const modulePermissions = {
  admin: ['*'],
  manager: ['crm', 'marketing', 'sales', 'reports', 'automation', 'service', 'settings-personal'],
  user: ['crm', 'marketing-draft', 'sales-tools-view', 'reports-view', 'service', 'settings-personal'],
};

export const can = (role, action) => {
  return PERMISSIONS[action]?.includes(role) ?? false;
};

export const getPermissions = (role) => permissions[role] || ['view'];

export const hasPermission = (role, action) => getPermissions(role).includes(action);

export const getModulePermissions = (role) => modulePermissions[role] || [];

export const hasModuleAccess = (role, module) => {
  const modules = getModulePermissions(role);
  return modules.includes('*') || modules.includes(module);
};

export const filterByRole = (data, currentUser) => {
  if (!currentUser) return [];
  const role = currentUser?.role;

  if (role === 'admin') return data;

  if (role === 'manager') {
    // Team scope; fallback keeps legacy mock rows visible until all rows have teamId.
    return data.filter((d) => d?.teamId == null || d.teamId === currentUser.teamId);
  }

  if (role === 'user') {
    // Personal scope; fallback keeps legacy mock rows visible until all rows have assignedTo.
    return data.filter((d) => d?.assignedTo == null || d.assignedTo === currentUser.id);
  }

  return [];
};

export const getDataScopeLabel = (role) => {
  if (role === 'admin') return 'All Records';
  if (role === 'manager') return 'Team Records';
  if (role === 'user') return 'My Records';
  return '';
};

export const canAccessRoute = (role, pathname = '') => {
  const path = pathname.toLowerCase();
  if (role === 'admin') return true;

  if (role === 'manager') {
    if (path.startsWith('/admin')) return false;
    const blockedManagerExactPaths = new Set([
      '/settings',
      '/manager',
    ]);
    const blockedManagerPrefixPaths = [
      '/marketplace-apps',
      '/breeze-marketplace',
      '/connected-apps',
      '/added-agents',
      '/data-agent',
      '/data-model',
      '/data-enrichment',
    ];
    if (blockedManagerExactPaths.has(path)) return false;
    if (blockedManagerPrefixPaths.some((blockedPath) => path === blockedPath || path.startsWith(`${blockedPath}/`))) return false;
    return true;
  }

  if (role === 'user') {
    if (path.startsWith('/admin')) return false;
    if (path.startsWith('/manager')) return false;
    const blockedUserExactPaths = new Set([
      '/settings',
      '/user',
      '/manager',
      '/user-management',
    ]);
    const blockedUserPrefixPaths = [
      '/automation',
      '/forecast',
      '/reports',
      '/goals',
      '/sales-analytics',
      '/commerce-analytics',
      '/service-analytics',
      '/sales-workspace',
      '/target-accounts',
      '/knowledge-base',
      '/feedback',
      '/playbooks',
      '/message-templates',
      '/snippets',
      '/coaching-playlists',
      '/activity-feed',
      '/lead-scoring',
      '/data-agent',
      '/data-integration',
      '/data-quality',
      '/data-enrichment',
      '/data-model',
      '/marketplace-apps',
      '/breeze-marketplace',
      '/connected-apps',
      '/added-agents',
      '/breeze-studio',
      '/knowledge-vaults',
      '/prospecting-agent',
      '/customer-agent',
      '/buyer-intent',
    ];
    if (blockedUserExactPaths.has(path)) return false;
    if (blockedUserPrefixPaths.some((blockedPath) => path === blockedPath || path.startsWith(`${blockedPath}/`))) return false;
    return true;
  }

  return false;
};
