import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { OWNERS } from '../data/store';
import DeleteConfirm from '../components/DeleteConfirm';
import { filterByRole } from '../utils/permissions';

const EMPTY_FORM = {
  title: '', type: 'Call', priority: 'High', dueDate: '',
  status: 'Pending', related: '', owner: OWNERS[0], notes: '',
};

const PRIORITY_BADGE = {
  High: { bg: '#fee2e2', color: '#b91c1c' },
  Medium: { bg: '#fef9c3', color: '#854d0e' },
  Low: { bg: '#f3f4f6', color: '#374151' },
};

const STATUS_BADGE = {
  Pending: { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#dbeafe', color: '#1d4ed8' },
  Completed: { bg: '#dcfce7', color: '#15803d' },
};

const badgeStyle = (palette) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  background: palette.bg,
  color: palette.color,
});

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Tasks() {
  const { store, addTask, updateRecord, deleteRecord, showToast, currentUser } = useCRM();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const today = new Date().toISOString().split('T')[0];
  const scopedTasks = filterByRole(store.tasks || [], currentUser);

  const rows = scopedTasks.filter((t) => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q);
    const matchF = filter === 'All' || t.status === filter || t.priority === filter || (filter === 'Overdue' && t.dueDate < today && t.status !== 'Completed');
    return matchQ && matchF;
  });

  const markDone = (t) => {
    updateRecord('tasks', { ...t, status: 'Completed' });
    showToast('Task marked as completed!');
  };

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const handleCreate = async () => {
    const e = {};
    if (!form.title) e.title = true;
    if (!form.dueDate) e.dueDate = true;
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    await addTask({
      ...form,
      teamId: currentUser?.teamId ?? null,
      assignedTo: currentUser?.id ?? null,
    });
    showToast('Task created successfully!');
    handleClose();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRecord('tasks', deleteTarget.id);
    showToast('Task deleted');
    setDeleteTarget(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const openEdit = (t) => {
    setEditTarget(t);
    setEditForm({
      title: t.title || '', type: t.type || 'Call', priority: t.priority || 'High',
      dueDate: t.dueDate || '', status: t.status || 'Pending',
      related: t.related || '', owner: t.owner || OWNERS[0], notes: t.notes || '',
    });
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    if (!editForm.title) { showToast('Title is required', 'error'); return; }
    await updateRecord('tasks', { ...editTarget, ...editForm });
    showToast('Task updated!');
    setEditTarget(null);
  };

  return (
    <div className="page-fade">
      <style>{`
        .tasks-scroll {
          display: block;
          width: 100%;
          overflow-x: scroll;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
          box-sizing: border-box;
        }
        .tasks-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .tasks-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 99px;
          margin: 0 4px;
        }
        .tasks-scroll::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 99px;
        }
        .tasks-scroll::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .tasks-scroll {
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #f1f5f9;
        }
        .tasks-table-shell {
          width: 100%;
          overflow: hidden;
        }
        .tasks-table-scroll {
          display: block;
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
          scrollbar-width: thin;
          scrollbar-color: #94a3b8 #e2e8f0;
        }
        .tasks-table-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .tasks-table-scroll::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 999px;
        }
        .tasks-table-scroll::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 999px;
        }
        .tasks-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        .task-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 4px;
          width: fit-content;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
          box-shadow: 0 8px 20px rgba(15, 36, 64, 0.06);
          margin-left: auto;
          margin-right: auto;
        }
        .task-actions-cell {
          width: 1%;
          white-space: nowrap;
        }
        .task-action-btn,
        .task-action-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 50%;
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .task-action-btn:hover,
        .task-action-icon:hover {
          transform: translateY(-1px);
          background: rgba(226, 232, 240, 0.72);
        }
        .task-action-btn.view:hover,
        .task-action-icon.view:hover {
          color: var(--info);
          border-color: var(--info);
          background: rgba(59, 130, 246, 0.08);
        }
        .task-action-btn.update:hover,
        .task-action-icon.update:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: rgba(26, 60, 107, 0.08);
        }
        .task-action-btn.delete:hover,
        .task-action-icon.delete:hover {
          color: var(--danger);
          border-color: var(--danger);
          background: rgba(239, 68, 68, 0.08);
        }
        .task-action-btn.complete:hover,
        .task-action-icon.complete:hover {
          color: #15803d;
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }
        .task-action-btn i,
        .task-action-icon i {
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .card-toolbar {
            align-items: stretch;
          }
          .search-box {
            width: 100%;
          }
          .filter-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .task-actions {
            gap: 4px;
            padding: 3px;
          }
          .task-action-btn,
          .task-action-icon {
            width: 30px;
            height: 30px;
            min-width: 30px;
          }
          .task-action-btn i,
          .task-action-icon i {
            font-size: 13px;
          }
        }
        @media (max-width: 560px) {
          .task-actions-cell {
            min-width: 148px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {scopedTasks.filter((t) => t.status === 'Pending').length} pending |&nbsp;
            {scopedTasks.filter((t) => t.dueDate < today && t.status !== 'Completed').length} overdue
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <i className="fa fa-plus" /> Add Task
        </button>
      </div>

      <div className="card" style={{ overflow: 'visible' }}>
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." />
          </div>
          <div className="filter-tabs">
            {['All', 'Pending', 'In Progress', 'Completed', 'Overdue', 'High', 'Medium', 'Low'].map((f) => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="tasks-table-shell">
          <div className="tasks-table-scroll">
            <table className="data-table" style={{ width: '100%', minWidth: '1120px' }}>

              <thead>
                <tr>
                  <th>Task</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Related</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((t) => {
                  const isOverdue = t.dueDate < today && t.status !== 'Completed';
                  return (
                    <tr key={t.id} style={{ background: isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}>
                      <td>
                        <div className="fw-600" style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                          {isOverdue && <i className="fa fa-exclamation-circle" style={{ color: 'var(--danger)', fontSize: 12, flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                        </div>
                        {t.notes && (
                          <div className="txt-muted txt-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.notes}
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-info">{t.type}</span></td>
                      <td><span style={badgeStyle(PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.Low)}>{t.priority}</span></td>
                      <td style={{ color: isOverdue ? 'var(--danger)' : undefined, fontWeight: isOverdue ? 700 : undefined, whiteSpace: 'nowrap' }}>
                        {formatDate(t.dueDate)}
                        {isOverdue && <span className="txt-xs" style={{ marginLeft: 4, color: 'var(--danger)' }}>Overdue</span>}
                      </td>
                      <td className="txt-muted txt-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.related}
                      </td>
                      <td className="txt-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.owner}
                      </td>
                      <td><span style={badgeStyle(STATUS_BADGE[t.status] || STATUS_BADGE.Pending)}>{t.status}</span></td>
                      <td className="task-actions-cell">
                        <div className="task-actions">
                          <button className="task-action-btn view" title="View task" aria-label={`View ${t.title}`} onClick={() => setViewTarget(t)}>
                            <i className="fa fa-eye" />
                          </button>
                          <button className="task-action-btn update" title="Update task" aria-label={`Update ${t.title}`} onClick={() => openEdit(t)}>
                            <i className="fa fa-pen" />
                          </button>
                          <button className="task-action-btn delete" title="Delete task" aria-label={`Delete ${t.title}`} onClick={() => setDeleteTarget(t)}>
                            <i className="fa fa-trash" />
                          </button>
                          {t.status !== 'Completed' && (
                            <button className="task-action-icon complete" title="Mark done" aria-label={`Mark ${t.title} as done`} onClick={() => markDone(t)}>
                              <i className="fa fa-check" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      <i className="fa fa-tasks" /><br />No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) handleClose(); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn-icon" onClick={handleClose} title="Back"><i className="fa fa-arrow-left" /></button>
                <h3>Create Task</h3>
              </div>
              <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
            </div>

            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Task Title <span className="required">*</span></label>
                <input className={`form-control${errors.title ? ' is-err' : ''}`} value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Task Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => set('type', e.target.value)}>
                    {['Call', 'Email', 'Meeting', 'Document', 'Follow-up', 'Other'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                    {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date <span className="required">*</span></label>
                  <input className={`form-control${errors.dueDate ? ' is-err' : ''}`} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {['Pending', 'In Progress', 'Completed'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Related To</label>
                <input className="form-control" value={form.related} onChange={(e) => set('related', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Owner</label>
                <select className="form-control" value={form.owner} onChange={(e) => set('owner', e.target.value)}>
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>
                <i className="fa fa-check" /> Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm
          title="Delete Task"
          message={`Are you sure you want to delete ${deleteTarget.title}? This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* View Modal */}
      {viewTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setViewTarget(null); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Task Details</h3>
              <button className="modal-close" onClick={() => setViewTarget(null)} aria-label="Close">&times;</button>
            </div>
            <div className="form-body">
              {[
                { label: 'Title',    value: viewTarget.title },
                { label: 'Type',     value: viewTarget.type },
                { label: 'Priority', value: viewTarget.priority },
                { label: 'Status',   value: viewTarget.status },
                { label: 'Due Date', value: formatDate(viewTarget.dueDate) },
                { label: 'Related',  value: viewTarget.related || '—' },
                { label: 'Owner',    value: viewTarget.owner || '—' },
                { label: 'Notes',    value: viewTarget.notes || '—' },
              ].map(({ label, value }) => (
                <div className="form-group" key={label}>
                  <label className="form-label">{label}</label>
                  <input className="form-control" value={value} readOnly />
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => setViewTarget(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setEditTarget(null); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button className="modal-close" onClick={() => setEditTarget(null)} aria-label="Close">&times;</button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Task Title <span className="required">*</span></label>
                <input className="form-control" value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Task Type</label>
                  <select className="form-control" value={editForm.type} onChange={(e) => setEditForm(p => ({ ...p, type: e.target.value }))}>
                    {['Call', 'Email', 'Meeting', 'Document', 'Follow-up', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={editForm.priority} onChange={(e) => setEditForm(p => ({ ...p, priority: e.target.value }))}>
                    {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-control" type="date" value={editForm.dueDate} onChange={(e) => setEditForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editForm.status} onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))}>
                    {['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Related To</label>
                <input className="form-control" value={editForm.related} onChange={(e) => setEditForm(p => ({ ...p, related: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner</label>
                <select className="form-control" value={editForm.owner} onChange={(e) => setEditForm(p => ({ ...p, owner: e.target.value }))}>
                  {OWNERS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3} value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdate}>
                <i className="fa fa-check" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
