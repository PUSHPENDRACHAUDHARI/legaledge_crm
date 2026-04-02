import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TASKS = [
  { id: 1, title: 'Follow up with TechCorp', due: 'Today', priority: 'High', status: 'Pending' },
  { id: 2, title: 'Send proposal to Acme Inc', due: 'Tomorrow', priority: 'Medium', status: 'Pending' },
  { id: 3, title: 'Call new leads from webinar', due: 'Today', priority: 'High', status: 'Completed' }
];

const MEETINGS = [
  { id: 1, title: 'Product Demo - Global Systems', time: '10:00 AM', type: 'Video Call' },
  { id: 2, title: 'Pricing Review - Beta Ltd', time: '2:30 PM', type: 'Phone' }
];

export default function SalesWorkspace() {
  const navigate = useNavigate();
  const [logModal, setLogModal] = useState(false);
  const [logForm, setLogForm] = useState({ type: 'Call', note: '', contact: '' });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Workspace</h1>
          <p className="page-subtitle">Your daily sales overview and activities</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => { setLogForm({ type: 'Call', note: '', contact: '' }); setLogModal(true); }}>
            <i className="fa fa-plus" /> Log Activity
          </button>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3><i className="fa fa-bullseye" style={{ marginRight: '8px', color: 'var(--primary)' }} />Monthly Target</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ margin: 0 }}>$45,000</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>/ $50,000</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', height: '8px', borderRadius: '4px', marginTop: '15px' }}>
            <div style={{ background: 'var(--success)', width: '90%', height: '100%', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="card">
          <h3><i className="fa fa-handshake" style={{ marginRight: '8px', color: 'var(--info)' }} />Open Deals</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ margin: 0 }}>12</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>($124,500 pipeline)</span>
          </div>
        </div>
        <div className="card">
          <h3><i className="fa fa-phone" style={{ marginRight: '8px', color: 'var(--warning)' }} />Activities Today</h3>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ margin: 0 }}>8</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>calls / meetings</span>
          </div>
        </div>
      </div>

      <div
  className="cards-grid"
  style={{
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px'
  }}
>
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-toolbar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Upcoming Tasks</h3>
            <button className="btn-secondary btn-sm" onClick={() => navigate('/tasks')}>View All</button>
          </div>
          <div className="table-container">
<table className="data-table" style={{ marginTop: '10px' }}>
            <tbody>
              {TASKS.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="fw-500">{t.title}</div>
                    <div className="txt-sm txt-muted">{t.due}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${t.priority === 'High' ? 'danger' : t.status === 'Completed' ? 'success' : 'warning'}`}>
                      {t.status === 'Completed' ? 'Done' : t.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>

        <div className="card">
          <div className="card-toolbar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Today's Meetings</h3>
            <button className="btn-secondary btn-sm" onClick={() => navigate('/calls')}>Agenda</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            {MEETINGS.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap',   background: 'var(--bg-hover)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                  <i className={`fa fa-${m.type === 'Video Call' ? 'video' : 'phone'}`} />
                </div>
                <div>
                  <div className="fw-600">{m.title}</div>
                  <div className="txt-sm txt-muted">{m.time} · {m.type}</div>
                </div>
                <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={() => navigate('/calls')}>
                  <i className="fa fa-chevron-right" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log Activity Modal */}
      {logModal && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setLogModal(false); }}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-plus" /> Log Activity</h3>
              <button className="modal-close" onClick={() => setLogModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <select className="form-control" value={logForm.type} onChange={e => setLogForm({ ...logForm, type: e.target.value })}>
                  <option>Call</option><option>Email</option><option>Meeting</option><option>Note</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact / Company</label>
                <input className="form-control" value={logForm.contact} onChange={e => setLogForm({ ...logForm, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Note / Outcome</label>
                <textarea className="form-control" rows={3} value={logForm.note} onChange={e => setLogForm({ ...logForm, note: e.target.value })} />
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setLogModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setLogModal(false); alert('Activity logged successfully!'); }}>
                <i className="fa fa-check" /> Log Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
