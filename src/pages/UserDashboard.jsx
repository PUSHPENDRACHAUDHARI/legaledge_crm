import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { dashboardAPI } from '../services/api';

const STATUS_COLORS = {
  New: { bg: '#dbeafe', color: '#1d4ed8' },
  Contacted: { bg: '#fef9c3', color: '#854d0e' },
  Qualified: { bg: '#dcfce7', color: '#15803d' },
  Negotiation: { bg: '#ede9fe', color: '#6d28d9' },
  Converted: { bg: '#d1fae5', color: '#065f46' },
  Disqualified: { bg: '#fee2e2', color: '#b91c1c' },
  High: { bg: '#fee2e2', color: '#b91c1c' },
  Medium: { bg: '#fef9c3', color: '#854d0e' },
  Low: { bg: '#f3f4f6', color: '#374151' },
};

const FALLBACK_USER = {
  id: 3,
  name: 'Priya Sharma',
  email: 'priya@legaledge.in',
  role: 'user',
  teamId: 'team_01',
  avatar: 'PS',
};

function inrShort(n) {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  return `Rs ${Number(n || 0).toLocaleString('en-IN')}`;
}

function badge(status) {
  const c = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
  return {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: c.bg,
    color: c.color,
    whiteSpace: 'nowrap',
  };
}

function activityIcon(type) {
  const map = {
    updated: { icon: 'fa-pen', color: '#2563eb' },
    created: { icon: 'fa-plus', color: '#16a34a' },
    completed: { icon: 'fa-check', color: '#22c55e' },
    converted: { icon: 'fa-user-check', color: '#0ea5e9' },
    deleted: { icon: 'fa-trash', color: '#dc2626' },
  };
  return map[String(type || '').toLowerCase()] || { icon: 'fa-circle', color: '#64748b' };
}

const normalizeAssignedTo = (row) => {
  const raw = row?.assignedTo ?? row?.assigned_to ?? null;
  if (raw && typeof raw === 'object') return raw.id ?? raw.pk ?? null;
  return raw;
};

const normalizeDueDate = (task) => task?.dueDate ?? task?.due_date ?? task?.created ?? '';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, showToast, store, updateRecord, refreshEntity, authChecked, storeLoading } = useCRM();
  const user = currentUser || FALLBACK_USER;
  const role = user?.role;

  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  const loadDashboard = useCallback(async (withToast = false) => {
    if (role !== 'user') return;
    try {
      await Promise.allSettled([
        refreshEntity('leads'),
        refreshEntity('deals'),
        refreshEntity('tasks'),
        refreshEntity('activities'),
      ]);
      const data = await dashboardAPI.user();
      setApiData(data || null);
      if (withToast) showToast('User dashboard refreshed successfully!');
    } catch {
      if (withToast) showToast('Failed to refresh user dashboard.', 'error');
      setApiData(null);
    }
  }, [refreshEntity, role, showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (role !== 'user') return undefined;

    const refreshDashboard = () => {
      void loadDashboard();
    };

    const intervalId = window.setInterval(refreshDashboard, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshDashboard();
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadDashboard, role]);

  const myLeads = useMemo(
    () => (store.leads || []).filter((lead) => normalizeAssignedTo(lead) === user.id),
    [store.leads, user.id]
  );
  const myTasks = useMemo(
    () => (store.tasks || []).filter((task) => normalizeAssignedTo(task) === user.id),
    [store.tasks, user.id]
  );
  const myDeals = useMemo(
    () => (store.deals || []).filter((deal) => normalizeAssignedTo(deal) === user.id),
    [store.deals, user.id]
  );
  const myActivity = useMemo(() => {
    const owned = (store.activities || []).filter((activity) => activity.owner === user.name);
    return owned.slice().sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).slice(0, 10);
  }, [store.activities, user.name]);
  const liveStoreReady = authChecked && !storeLoading;

  const visibleLeads = useMemo(() => {
    const liveLeads = myLeads.slice().sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0)).slice(0, 5);
    if (liveLeads.length || liveStoreReady) {
      return liveLeads;
    }
    return Array.isArray(apiData?.myLeads) ? apiData.myLeads : liveLeads;
  }, [apiData?.myLeads, liveStoreReady, myLeads]);
  const visibleTasks = useMemo(() => {
    const liveTasks = myTasks.slice().sort((a, b) => new Date(normalizeDueDate(a) || 0) - new Date(normalizeDueDate(b) || 0)).slice(0, 5);
    if (liveTasks.length || liveStoreReady) {
      return liveTasks;
    }
    return Array.isArray(apiData?.myTasks) ? apiData.myTasks : liveTasks;
  }, [apiData?.myTasks, liveStoreReady, myTasks]);
  const visibleActivity = useMemo(() => {
    if (myActivity.length || liveStoreReady) {
      return myActivity;
    }
    return Array.isArray(apiData?.activity) ? apiData.activity : [];
  }, [apiData?.activity, liveStoreReady, myActivity]);

  const liveDueToday = myTasks.filter((task) => String(task.status || '').toLowerCase() !== 'completed').length;
  const liveOverdue = myTasks.filter((task) => String(task.priority || '').toLowerCase() === 'high' && String(task.status || '').toLowerCase() !== 'completed').length;
  const liveOpenDealsValue = myDeals
    .filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const myLeadCount = liveStoreReady ? myLeads.length : (myLeads.length || apiData?.kpi?.myLeads || 0);
  const dueToday = liveStoreReady ? liveDueToday : (liveDueToday || apiData?.kpi?.dueToday || 0);
  const overdue = liveStoreReady ? liveOverdue : (liveOverdue || apiData?.kpi?.overdue || 0);
  const openDealsValue = liveStoreReady ? liveOpenDealsValue : (liveOpenDealsValue || apiData?.kpi?.openDealsValue || 0);

  const toggleTask = async (task) => {
    setLoading(true);
    try {
      const currentStatus = String(task.status || '').toLowerCase();
      const nextStatus = currentStatus === 'completed' ? 'Pending' : 'Completed';
      await updateRecord('tasks', { ...task, status: nextStatus });
      showToast('Task updated successfully!');
    } catch {
      showToast('Unable to update task', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'user') {
    return (
      <div className="page-fade">
        <div className="card" style={{ padding: 24 }}>
          <h3 className="card-title">Access Restricted</h3>
          <p className="txt-muted">This dashboard is available for user role only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Dashboard</h1>
          <p className="page-subtitle">Your leads, tasks, and recent activity at a glance</p>
        </div>
        <div className="page-actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" disabled={loading} onClick={() => navigate('/tasks')}>
            <i className="fa-solid fa-list-check" /> My Tasks
          </button>
          <button className="btn-secondary" disabled={loading} onClick={() => void loadDashboard(true)}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/leads')}>
          <div className="txt-muted txt-sm">My Leads</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{myLeadCount}</div>
          <div className="txt-success txt-sm">Role-based live lead count</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
          <div className="txt-muted txt-sm">Tasks Due Today</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{dueToday}</div>
          <div className="txt-danger txt-sm">{overdue} high priority pending</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/deals')}>
          <div className="txt-muted txt-sm">My Open Deals</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{inrShort(openDealsValue)}</div>
          <div className="txt-success txt-sm">{myDeals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length} active opportunities</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3 className="card-title">My Tasks Today</h3>
          </div>

          {!visibleTasks.length ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <i className="fa-solid fa-list-check" style={{ fontSize: 34, color: 'var(--text-light)' }} />
              <p className="txt-muted" style={{ marginTop: 10 }}>No tasks assigned today</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleTasks.map((task) => {
                const isDone = String(task.status || '').toLowerCase() === 'completed';
                return (
                  <div key={task.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <input type="checkbox" checked={isDone} onChange={() => void toggleTask(task)} disabled={loading} />
                        <span style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</span>
                      </label>
                      <span style={badge(task.priority || 'Medium')}>{task.priority || 'Medium'}</span>
                    </div>
                    <div className="txt-muted txt-sm" style={{ marginTop: 6 }}>{normalizeDueDate(task) || '-'} · {task.related || task.owner || 'Assigned task'}</div>
                  </div>
                );
              })}
              <Link to="/tasks" className="txt-muted" style={{ fontWeight: 600, textDecoration: 'none' }}>View All Tasks {'->'}</Link>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="page-header" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <h3 className="card-title">My Recent Leads</h3>
          </div>

          {!visibleLeads.length ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <i className="fa-solid fa-address-book" style={{ fontSize: 34, color: 'var(--text-light)' }} />
              <p className="txt-muted" style={{ marginTop: 10 }}>No leads available</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.phone || '-'}</td>
                      <td><span style={badge(lead.status)}>{lead.status}</span></td>
                      <td>{lead.created || lead.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 16px' }}>
                <Link to="/leads" className="txt-muted" style={{ fontWeight: 600, textDecoration: 'none' }}>View All Leads {'->'}</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="page-header" style={{ marginBottom: 8 }}>
          <h3 className="card-title">My Activity This Week</h3>
        </div>

        {!visibleActivity.length ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 34, color: 'var(--text-light)' }} />
            <p className="txt-muted" style={{ marginTop: 10 }}>No activity found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {visibleActivity.map((activity) => {
              const icon = activityIcon(activity.action || activity.type);
              return (
                <div key={activity.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${icon.color}22`, color: icon.color }}>
                    <i className={`fa-solid ${icon.icon}`} style={{ fontSize: 12 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>{activity.detail || activity.text || activity.action}</div>
                  <div className="txt-muted txt-sm">{activity.time || new Date(activity.at || Date.now()).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
