import { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useNavigate } from 'react-router-dom';

export default function HelpDesk() {
  const { store, addRecord, deleteRecord, showToast } = useCRM();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const rows = store.tickets.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q) || t.company.toLowerCase().includes(q);
    const matchF = filter === 'All' || t.status === filter;
    return matchQ && matchF;
  });

  const openCreate = () => {
    setForm({ title: '', contact: '', company: '', category: 'Technical', priority: 'Medium', status: 'Open', owner: 'Unassigned' });
    setErr({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (!form.contact.trim()) e.contact = true;
    if (Object.keys(e).length) return setErr(e);
    addRecord('tickets', { ...form, created: new Date().toISOString().split('T')[0] });
    showToast('Ticket created!');
    setModalOpen(false);
  };

  const openInboxReply = (ticket) => {
    navigate('/inbox', {
      state: {
        compose: {
          subject: `Re: ${ticket.title || 'Support request'}`,
          body: ticket.contact ? `Hi ${ticket.contact},\n\n` : '',
        },
      },
    });
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Help Desk</h1>
          <p className="page-subtitle">Manage customer support tickets and requests</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={openCreate}>
            <i className="fa fa-plus" /> Create Ticket
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" />
          </div>
          <div className="filter-tabs">
            {['All', 'Open', 'In Progress', 'Closed'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Ticket Info</th>
                <th>Requester</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="fw-600">{t.title}</div>
                    <div className="txt-sm txt-muted">#{t.id} · Created: {t.created}</div>
                  </td>
                  <td>
                    <div className="fw-500">{t.contact}</div>
                    <div className="txt-sm txt-muted">{t.company}</div>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <span className={`badge badge-${t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'info'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="txt-sm">{t.owner}</td>
                  <td>
                    <span className={`badge badge-${t.status === 'Closed' ? 'success' : t.status === 'In Progress' ? 'primary' : 'warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Respond" onClick={() => openInboxReply(t)}>
                        <i className="fa fa-reply" />
                      </button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => { deleteRecord('tickets', t.id); showToast('Ticket deleted'); }}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} className="empty-state">
                  <i className="fa fa-life-ring" /><br />No tickets found
                </td></tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Ticket</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Issue Title <span className="required">*</span></label>
                <input className={`form-control${err.title ? ' is-err' : ''}`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Name <span className="required">*</span></label>
                  <input className={`form-control${err.contact ? ' is-err' : ''}`} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-control" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option>Technical</option><option>Billing</option><option>Feature Request</option><option>General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-save" /> Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
