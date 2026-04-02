import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { usersAPI } from '../services/api';

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  user: 'User',
};

const normalizeUser = (user) => ({
  ...user,
  teamId: user?.teamId ?? user?.team_id ?? null,
  email: user?.email ?? '',
  mobileNumber: user?.mobileNumber ?? user?.mobile_number ?? user?.phone ?? '',
  department: user?.department ?? '',
  company: user?.company ?? '',
  timezone: user?.timezone ?? '',
});

const normalizeUserList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export default function UserManagement() {
  const { currentUser, showToast } = useCRM();
  const navigate = useNavigate();
  const role = currentUser?.role;
  const [apiUsers, setApiUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'user',
    department: '',
    company: '',
    timezone: '',
    teamId: '',
  });

  const loadUsers = useCallback(async () => {
    if (!['admin', 'manager'].includes(role)) {
      setApiUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);
    try {
      const data = await usersAPI.list();
      const normalizedUsers = normalizeUserList(data).map(normalizeUser);
      setApiUsers(normalizedUsers);
    } catch (err) {
      setApiUsers([]);
      showToast(err.message || 'Unable to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [role, showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const visibleUsers = useMemo(() => {
    if (role === 'admin') return apiUsers;
    if (role === 'manager') {
      return apiUsers.filter((user) => user.teamId === currentUser?.teamId);
    }
    return [];
  }, [apiUsers, currentUser?.teamId, role]);

  const openEditModal = (user) => {
    setEditTarget(user);
    setEditForm({
      name: user.name || '',
      role: user.role || 'user',
      department: user.department || '',
      company: user.company || '',
      timezone: user.timezone || '',
      teamId: user.teamId || '',
    });
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditForm({
      name: '',
      role: 'user',
      department: '',
      company: '',
      timezone: '',
      teamId: '',
    });
  };

  const handleDeleteUser = async (user) => {
    try {
      await usersAPI.delete(user.id);
      await loadUsers();
      if (viewTarget?.id === user.id) setViewTarget(null);
      if (editTarget?.id === user.id) closeEditModal();
      showToast('User deleted');
    } catch (err) {
      showToast(err.message || 'Unable to delete user', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      await usersAPI.update(editTarget.id, {
        name: editForm.name.trim(),
        role: editForm.role,
        department: editForm.department.trim(),
        company: editForm.company.trim(),
        timezone: editForm.timezone.trim(),
        team_id: editForm.role === 'admin' ? null : (editForm.teamId || null),
      });
      await loadUsers();
      showToast('User updated');
      closeEditModal();
    } catch (err) {
      showToast(err.message || 'Unable to update user', 'error');
    }
  };

  if (role === 'user') {
    return (
      <div className="page-fade">
        <div className="card" style={{ padding: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 8 }}>Profile Only Access</h3>
          <p className="txt-muted">Users can view only their own profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade">
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {role === 'admin' ? 'View and manage all users' : 'View and manage your team users'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {role === 'admin' && (
            <button className="btn-secondary" onClick={() => navigate('/user')}>
              <i className="fa fa-user-shield" /> Add Admin
            </button>
          )}
          {role === 'admin' && (
            <button className="btn-secondary" onClick={() => navigate('/manager')}>
              <i className="fa fa-user-tie" /> Add Manager
            </button>
          )}
          {['admin', 'manager'].includes(role) && (
            <button className="btn-primary" onClick={() => navigate('/user')}>
              <i className="fa fa-user-plus" /> Add User
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr>
              <th style={cellStyles.head}>Name</th>
              <th style={cellStyles.head}>Email</th>
              <th style={cellStyles.head}>Contact</th>
              <th style={cellStyles.head}>Role</th>
              <th style={cellStyles.head}>Team</th>
              <th style={cellStyles.head}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading && (
              <tr>
                <td colSpan={6} style={{ ...cellStyles.value, textAlign: 'center', padding: 24 }}>
                  Loading users...
                </td>
              </tr>
            )}
            {!usersLoading && visibleUsers.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={cellStyles.value}>{user.name}</td>
                <td style={cellStyles.value}>{user.email || '-'}</td>
                <td style={cellStyles.value}>{user.mobileNumber || '-'}</td>
                <td style={cellStyles.value}>{ROLE_LABELS[user.role] || user.role}</td>
                <td style={cellStyles.value}>{user.teamId || '-'}</td>
                <td style={cellStyles.value}>
                  {role === 'admin' && (
                    <div className="action-btns">
                      <button className="btn-icon" title="View" onClick={() => setViewTarget(user)}>
                        <i className="fa fa-eye" />
                      </button>
                      <button className="btn-icon" title="Update" onClick={() => openEditModal(user)}>
                        <i className="fa fa-pen" />
                      </button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDeleteUser(user)}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  )}
                  {role === 'manager' && user.role === 'user' && (
                    <div className="action-btns">
                      <button className="btn-icon" title="View" onClick={() => setViewTarget(user)}>
                        <i className="fa fa-eye" />
                      </button>
                    </div>
                  )}
                  {role === 'manager' && user.role !== 'user' && <span className="txt-muted">-</span>}
                </td>
              </tr>
            ))}
            {!usersLoading && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...cellStyles.value, textAlign: 'center', padding: 24 }}>
                  No users available for this role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setViewTarget(null); }}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="modal-close" onClick={() => setViewTarget(null)} aria-label="Close">&times;</button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={viewTarget.name || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-control" value={ROLE_LABELS[viewTarget.role] || viewTarget.role || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" value={viewTarget.email || '-'} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input className="form-control" value={viewTarget.mobileNumber || '-'} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Team</label>
                <input className="form-control" value={viewTarget.teamId || '-'} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" value={viewTarget.department || '-'} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input className="form-control" value={viewTarget.company || '-'} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <input className="form-control" value={viewTarget.timezone || '-'} readOnly />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => setViewTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {role === 'admin' && editTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeEditModal(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update User</h3>
              <button className="modal-close" onClick={closeEditModal} aria-label="Close">&times;</button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-control"
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  className="form-control"
                  value={editForm.department}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. Sales"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input
                  className="form-control"
                  value={editForm.company}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. LegalEdge India"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <input
                  className="form-control"
                  value={editForm.timezone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  placeholder="e.g. Asia/Kolkata"
                />
              </div>
              {editForm.role !== 'admin' && (
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <input
                    className="form-control"
                    value={editForm.teamId}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, teamId: e.target.value }))}
                    placeholder="e.g. team_01"
                  />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateUser}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cellStyles = {
  head: {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    background: 'transparent',
  },
  value: {
    padding: '12px 14px',
    fontSize: 13,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
  },
};
