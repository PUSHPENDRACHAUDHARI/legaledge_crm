import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

const COACHING_DATA = [
  { id: 1, name: 'New Sales Rep Onboarding', assignee: 'Nainika Pounikar', progress: 85, status: 'In Progress', totalLessons: 8, completed: 7, dueDate: '2026-03-20' },
  { id: 2, name: 'Advanced Negotiation Skills', assignee: 'Gaurav Dotonde', progress: 60, status: 'In Progress', totalLessons: 5, completed: 3, dueDate: '2026-03-28' },
  { id: 3, name: 'Product Knowledge Deep Dive', assignee: 'Bali Dondkar', progress: 100, status: 'Completed', totalLessons: 12, completed: 12, dueDate: '2026-03-10' },
  { id: 4, name: 'Cold Calling Masterclass', assignee: 'Nikhil Lade', progress: 20, status: 'Not Started', totalLessons: 6, completed: 1, dueDate: '2026-04-05' },
  { id: 5, name: 'Email Writing Excellence', assignee: 'Styajit Galande', progress: 40, status: 'In Progress', totalLessons: 10, completed: 4, dueDate: '2026-03-30' },
  { id: 6, name: 'CRM Platform Training', assignee: 'Subodh Badole', progress: 100, status: 'Completed', totalLessons: 15, completed: 15, dueDate: '2026-03-01' },
];

export default function Coaching() {
  const { showToast } = useCRM();
  const [filter, setFilter] = useState('All');

  const rows = COACHING_DATA.filter(c => {
    return filter === 'All' || c.status === filter;
  });

  const statusColor = (status) => {
    if (status === 'Completed') return 'var(--success)';
    if (status === 'In Progress') return 'var(--primary)';
    return 'var(--text-muted)';
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Coaching</h1>
          <p className="page-subtitle">Track team learning progress and coaching assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => showToast('New playlist created!')}>
            <i className="fa fa-plus" /> New Playlist
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{COACHING_DATA.length}</div>
          <div className="txt-muted txt-sm">Total Programs</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>
            {COACHING_DATA.filter(c => c.status === 'Completed').length}
          </div>
          <div className="txt-muted txt-sm">Completed</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)' }}>
            {COACHING_DATA.filter(c => c.status === 'In Progress').length}
          </div>
          <div className="txt-muted txt-sm">In Progress</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--info)' }}>
            {Math.round(COACHING_DATA.reduce((acc, c) => acc + c.progress, 0) / COACHING_DATA.length)}%
          </div>
          <div className="txt-muted txt-sm">Avg. Completion</div>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <h3 style={{ margin: 0, fontSize: 16 }}>Coaching Programs</h3>
          <div className="filter-tabs">
            {['All', 'In Progress', 'Completed', 'Not Started'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginTop: 20 }}>
          {rows.map(c => (
            <div key={c.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="fw-600" style={{ fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                  <div className="txt-sm txt-muted">
                    <i className="fa fa-user" style={{ marginRight: 6 }}></i>{c.assignee}
                  </div>
                </div>
                <span className={`badge badge-${c.status === 'Completed' ? 'success' : c.status === 'In Progress' ? 'primary' : 'secondary'}`}>
                  {c.status}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="txt-sm txt-muted">{c.completed}/{c.totalLessons} lessons</span>
                  <span className="txt-sm fw-600" style={{ color: statusColor(c.status) }}>{c.progress}%</span>
                </div>
                <div style={{ background: 'var(--bg-hover)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: statusColor(c.status), width: `${c.progress}%`, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                <span className="txt-sm txt-muted"><i className="fa fa-calendar" style={{ marginRight: 6 }}></i>Due: {c.dueDate}</span>
                <div className="action-btns">
                  <button className="btn-icon" title="View" onClick={() => showToast('Opening playlist...')}><i className="fa fa-play" /></button>
                  <button className="btn-secondary btn-sm" onClick={() => showToast('Assigned!')}>Assign</button>
                </div>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <i className="fa fa-play-circle" /><br />No coaching programs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
