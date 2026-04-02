export const canAdd = (role) => role === 'admin';

export const canEdit = (role) => ['admin', 'manager'].includes(role);

export const canDelete = (role) => role === 'admin';

export const canView = () => true;
