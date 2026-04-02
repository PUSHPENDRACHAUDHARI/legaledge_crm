import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Pending: { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  Completed: { bg: '#dcfce7', color: '#15803d' },
};

const FALLBACK_USER = {
  id: 2,
  name: 'Arjun Mehta',
  email: 'arjun@legaledge.in',
  role: 'manager',
  teamId: 'team_01',
  avatar: 'AM',
};

const PIPELINE_LABELS = [
  ['Inquiry', 'New Lead'],
  ['Consultation', 'Contacted'],
  ['Retainer', 'Proposal'],
  ['Active', 'Negotiation'],
  ['Closed Won', 'Closed Won'],
];

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

function statusDot(status) {
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: 8,
    background: status === 'Active' ? 'var(--success)' : 'var(--warning)',
  };
}

const normalizeTeamId = (row) => row?.teamId ?? row?.team_id ?? null;
const normalizeAssignedTo = (row) => {
  const raw = row?.assignedTo ?? row?.assigned_to ?? row?.assignedToId ?? row?.assigned_to_id ?? null;
  if (raw && typeof raw === 'object') return raw.id ?? raw.pk ?? null;
  return raw;
};
const normalizeDueDate = (task) => task?.dueDate ?? task?.due_date ?? task?.created ?? '';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { currentUser, showToast, store, updateRecord, refreshEntity, authChecked, storeLoading } = useCRM();
  const user = currentUser || FALLBACK_USER;
  const role = user?.role;
  const teamId = user?.teamId ?? user?.team_id ?? null;

  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);

  const loadDashboard = useCallback(async (withToast = false) => {
    if (!['manager', 'admin'].includes(role)) return;
    try {
      await Promise.allSettled([
        refreshEntity('leads'),
        refreshEntity('deals'),
        refreshEntity('tasks'),
        refreshEntity('activities'),
      ]);
      const data = await dashboardAPI.manager();
      setApiData(data || null);
      if (withToast) showToast('Manager dashboard refreshed successfully!');
    } catch {
      if (withToast) showToast('Failed to refresh manager dashboard.', 'error');
      setApiData(null);
    }
  }, [refreshEntity, role, showToast]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!['manager', 'admin'].includes(role)) return undefined;

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

  const teamLeads = useMemo(
    () => (store.leads || []).filter((lead) => normalizeTeamId(lead) === teamId),
    [store.leads, teamId]
  );
  const teamTasks = useMemo(
    () => (store.tasks || []).filter((task) => normalizeTeamId(task) === teamId),
    [store.tasks, teamId]
  );
  const teamDeals = useMemo(
    () => (store.deals || []).filter((deal) => normalizeTeamId(deal) === teamId),
    [store.deals, teamId]
  );
  const teamActivities = useMemo(
    () => (store.activities || []).filter((activity) => normalizeTeamId(activity) === teamId),
    [store.activities, teamId]
  );
  const liveStoreReady = authChecked && !storeLoading;

  const teamMembers = useMemo(() => {
    const memberMap = new Map(
      (Array.isArray(apiData?.teamMembers) ? apiData.teamMembers : []).map((member) => [
        member.id,
        {
          ...member,
          leads: 0,
          tasksDue: 0,
          deals: 0,
          status: member.status || 'Active',
        },
      ])
    );
    if (!memberMap.has(user.id)) {
      memberMap.set(user.id, {
        id: user.id,
        name: user.name,
        role: user.role,
        status: 'Active',
        leads: 0,
        tasksDue: 0,
        deals: 0,
      });
    }

    teamLeads.forEach((lead) => {
      const assignedId = normalizeAssignedTo(lead) ?? `owner:${lead.owner || 'Unassigned'}`;
      const assignedName = lead.owner || memberMap.get(assignedId)?.name || 'Unassigned';
      if (!memberMap.has(assignedId)) {
        memberMap.set(assignedId, {
          id: assignedId,
          name: assignedName,
          role: assignedId === user.id ? user.role : 'team member',
          status: 'Active',
          leads: 0,
          tasksDue: 0,
          deals: 0,
        });
      }
      memberMap.get(assignedId).leads += 1;
    });

    teamTasks.forEach((task) => {
      const assignedId = normalizeAssignedTo(task) ?? `owner:${task.owner || 'Unassigned'}`;
      const assignedName = task.owner || memberMap.get(assignedId)?.name || 'Unassigned';
      if (!memberMap.has(assignedId)) {
        memberMap.set(assignedId, {
          id: assignedId,
          name: assignedName,
          role: assignedId === user.id ? user.role : 'team member',
          status: 'Active',
          leads: 0,
          tasksDue: 0,
          deals: 0,
        });
      }
      if (String(task.status || '').toLowerCase() !== 'completed') {
        memberMap.get(assignedId).tasksDue += 1;
      }
    });

    teamDeals.forEach((deal) => {
      const assignedId = normalizeAssignedTo(deal) ?? `owner:${deal.owner || 'Unassigned'}`;
      const assignedName = deal.owner || memberMap.get(assignedId)?.name || 'Unassigned';
      if (!memberMap.has(assignedId)) {
        memberMap.set(assignedId, {
          id: assignedId,
          name: assignedName,
          role: assignedId === user.id ? user.role : 'team member',
          status: 'Active',
          leads: 0,
          tasksDue: 0,
          deals: 0,
        });
      }
      memberMap.get(assignedId).deals += 1;
    });

    return Array.from(memberMap.values()).sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name));
  }, [apiData?.teamMembers, teamDeals, teamLeads, teamTasks, user.id, user.name, user.role]);

  const visibleTasks = useMemo(() => {
    const liveTasks = teamTasks
      .slice()
      .sort((a, b) => new Date(normalizeDueDate(a) || 0) - new Date(normalizeDueDate(b) || 0))
      .slice(0, 5);
    if (liveTasks.length || liveStoreReady) {
      return liveTasks;
    }
    return Array.isArray(apiData?.todayTasks) ? apiData.todayTasks : [];
  }, [apiData?.todayTasks, liveStoreReady, teamTasks]);

  const visibleLeads = useMemo(() => {
    const memberNameById = new Map(teamMembers.map((member) => [member.id, member.name]));
    const liveLeads = teamLeads
      .slice()
      .sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0))
      .slice(0, 5)
      .map((lead) => ({
        ...lead,
        assignedName:
          lead.owner ||
          memberNameById.get(normalizeAssignedTo(lead)) ||
          'Unassigned',
        displayDate: lead.created || lead.date || '-',
      }));
    if (liveLeads.length || liveStoreReady) {
      return liveLeads;
    }
    if (Array.isArray(apiData?.recentLeads) && apiData.recentLeads.length) {
      return apiData.recentLeads.map((lead) => ({
        ...lead,
        assignedName: lead.owner || 'Unassigned',
        displayDate: lead.created || lead.date || '-',
      }));
    }
    return [];
  }, [apiData?.recentLeads, liveStoreReady, teamLeads, teamMembers]);

  const visiblePipeline = useMemo(() => {
    const livePipeline = PIPELINE_LABELS.map(([label, stage]) => {
      const rows = teamDeals.filter((deal) => deal.stage === stage);
      return {
        stage: label,
        count: rows.length,
        value: rows.reduce((sum, deal) => sum + Number(deal.value || 0), 0),
      };
    });
    const liveHasData = livePipeline.some((item) => item.count > 0 || item.value > 0);
    if (liveHasData || liveStoreReady) {
      return livePipeline;
    }
    return Array.isArray(apiData?.pipeline) ? apiData.pipeline : livePipeline;
  }, [apiData?.pipeline, liveStoreReady, teamDeals]);

  const liveOpenDealsCount = teamDeals.filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage)).length;
  const liveOpenDealsValue = teamDeals
    .filter((deal) => !['Closed Won', 'Closed Lost'].includes(deal.stage))
    .reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const liveOverdueCount = teamTasks
    .filter((task) => String(task.priority || '').toLowerCase() === 'high' && String(task.status || '').toLowerCase() !== 'completed')
    .length;
  const liveTeamLeadCount = teamLeads.length;
  const liveConversion = liveTeamLeadCount
    ? Math.round((teamLeads.filter((lead) => ['Won', 'Converted'].includes(String(lead.status || ''))).length / liveTeamLeadCount) * 100)
    : 0;
  const teamLeadCount = liveStoreReady ? liveTeamLeadCount : (liveTeamLeadCount || apiData?.kpi?.teamLeadCount || 0);
  const openDealsCount = liveStoreReady ? liveOpenDealsCount : (liveOpenDealsCount || apiData?.kpi?.openDealsCount || 0);
  const openDealsValue = liveStoreReady ? liveOpenDealsValue : (liveOpenDealsValue || apiData?.kpi?.openDealsValue || 0);
  const overdueCount = liveStoreReady ? liveOverdueCount : (liveOverdueCount || apiData?.kpi?.overdueCount || 0);
  const conversion = liveStoreReady ? liveConversion : (liveConversion || apiData?.kpi?.conversionRate || 0);
  const maxPipeline = Math.max(1, ...visiblePipeline.map((p) => p.value));

  const toggleTask = async (task) => {
    setLoading(true);
    try {
      const currentStatus = String(task.status || '').toLowerCase();
      const nextStatus = currentStatus === 'completed' ? 'Pending' : 'Completed';
      await updateRecord('tasks', { ...task, status: nextStatus });
      showToast('Task status updated successfully!');
    } catch {
      showToast('Unable to update task', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!['manager', 'user'].includes(role)) {
    return (
      <div className="page-fade">
        <div className="card" style={{ padding: 24 }}>
          <h3 className="card-title">Access Restricted</h3>
          <p className="txt-muted">You do not have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade manager-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manager Dashboard</h1>
          <p className="page-subtitle">Team performance overview and daily priorities</p>
        </div>
        <div className="page-actions manager-dashboard-actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          {role === 'manager' && (
            <>
              <button className="btn-secondary" disabled={loading} onClick={() => navigate('/leads')}>
                <i className="fa-solid fa-eye" /> View Team Leads
              </button>
              <button className="btn-secondary" disabled={loading} onClick={() => navigate('/tasks')}>
                <i className="fa-solid fa-pen" /> Manage Tasks
              </button>
            </>
          )}
          <button className="btn-secondary" disabled={loading} onClick={() => void loadDashboard(true)}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/leads')}>
          <div className="txt-muted txt-sm">Team Leads</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{teamLeadCount}</div>
          <div className="txt-success txt-sm"><i className="fa-solid fa-arrow-up" /> Live team-scoped total</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/deals')}>
          <div className="txt-muted txt-sm">Open Deals</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{inrShort(openDealsValue)}</div>
          <div className="txt-success txt-sm">{openDealsCount} active opportunities</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
          <div className="txt-muted txt-sm">Tasks Overdue</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{overdueCount}</div>
          <div className="txt-danger txt-sm"><i className="fa-solid fa-triangle-exclamation" /> Needs attention</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/deals')}>
          <div className="txt-muted txt-sm">Conversion Rate</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{conversion}%</div>
          <div className="txt-success txt-sm">Based on team-owned deals</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="page-header" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <h3 className="card-title">My Team</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/user-management')}>
              Team Access
            </button>
          </div>
          {!teamMembers.length ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <i className="fa-solid fa-users" style={{ fontSize: 34, color: 'var(--text-light)' }} />
              <p className="txt-muted" style={{ marginTop: 10 }}>No team members available</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Leads</th>
                    <th>Tasks Due</th>
                    <th>Deals</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="fw-600">{member.name}</div>
                        <div className="txt-muted txt-sm">{member.role}</div>
                      </td>
                      <td>{member.leads}</td>
                      <td>{member.tasksDue}</td>
                      <td>{member.deals}</td>
                      <td><span style={statusDot(member.status)} />{member.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3 className="card-title">Today's Priorities</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/tasks')}>
              View All
            </button>
          </div>

          {!visibleTasks.length ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <i className="fa-solid fa-list-check" style={{ fontSize: 34, color: 'var(--text-light)' }} />
              <p className="txt-muted" style={{ marginTop: 10 }}>No tasks assigned for today</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleTasks.map((task) => {
                const isDone = String(task.status || '').toLowerCase() === 'completed';
                const dueValue = normalizeDueDate(task);
                const overdue = !!dueValue && !isDone && new Date(dueValue) < new Date();
                return (
                  <div
                    key={task.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderLeft: overdue ? '4px solid var(--danger)' : '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      background: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
                      <input type="checkbox" checked={isDone} onChange={() => void toggleTask(task)} disabled={loading} />
                      <span style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</span>
                    </label>
                    <span style={badge(task.priority || 'Medium')}>{task.priority || 'Medium'}</span>
                    <span className="txt-muted txt-sm">{dueValue || '-'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="page-header" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <h3 className="card-title">Recent Team Leads</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/leads')}>
              Open Leads
            </button>
          </div>
          {!visibleLeads.length ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
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
                    <th>Assigned</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>{lead.name}</td>
                      <td>{lead.phone || '-'}</td>
                      <td><span style={badge(lead.status)}>{lead.status}</span></td>
                      <td>{lead.assignedName}</td>
                      <td>{lead.displayDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3 className="card-title">Pipeline Overview</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/deals')}>
              Open Pipeline
            </button>
          </div>

          {!visiblePipeline.length ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <i className="fa-solid fa-chart-simple" style={{ fontSize: 34, color: 'var(--text-light)' }} />
              <p className="txt-muted" style={{ marginTop: 10 }}>No pipeline data available</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {visiblePipeline.map((item, index) => {
                const width = Math.max(8, Math.round((item.value / maxPipeline) * 100));
                const opacity = Math.max(0.35, 1 - index * 0.12);
                return (
                  <div key={item.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="fw-600">{item.stage}</span>
                      <span className="txt-muted txt-sm">{item.count} · {inrShort(item.value)}</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${width}%`,
                          height: '100%',
                          background: `rgba(15, 36, 64, ${opacity})`,
                          borderRadius: 20,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!!teamActivities.length && (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <div className="page-header" style={{ marginBottom: 8 }}>
            <h3 className="card-title">Recent Team Activity</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/activity-feed')}>
              Open Activity Feed
            </button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {teamActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <div className="fw-600 txt-sm">{activity.detail || activity.action}</div>
                <div className="txt-muted txt-sm">{activity.owner || 'System'} · {new Date(activity.at || Date.now()).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
