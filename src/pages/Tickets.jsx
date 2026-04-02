import { useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { createPortal } from 'react-dom';
import { OWNERS } from '../data/store';
import { ticketsAPI } from '../services/api';

const CATEGORIES = ['Technical','Billing','Feature Request','General'];
const PRIORITIES = ['Low','Medium','High'];

const EMPTY_FORM = {
  title:'', contact:'', company:'', category:'Technical',
  priority:'Medium', status:'Open', owner: OWNERS[0],
};

const categoryColor = c => ({
  Technical:        '#8b5cf6',
  Billing:          '#f59e0b',
  'Feature Request':'#3b82f6',
  General:          '#64748b',
  Account:          '#0d9488',
  Other:            '#94a3b8',
}[c] || '#64748b');

const priorityBadge = p => ({ High:'danger', Critical:'danger', Medium:'warning', Low:'success' }[p] || 'secondary');
const statusBadge   = s => ({ Open:'info', 'In Progress':'warning', Closed:'success' }[s] || 'secondary');

export default function Tickets() {
  const { store, showToast } = useCRM();
  const [items, setItems] = useState([]);
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [sortBy,    setSortBy]    = useState('-created');
  const [loading,   setLoading]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState({});
  const PAGE_SIZE = 20;

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await ticketsAPI.getAll({
          search,
          page,
          ordering: sortBy,
          page_size: PAGE_SIZE,
        });
        const payload = res?.data;
        const results = Array.isArray(payload?.results) ? payload.results : (Array.isArray(payload) ? payload : []);
        const count = Number(payload?.count ?? results.length ?? 0);
        setItems(results);
        setTotal(count);
        showToast('Tickets loaded.');
      } catch {
        showToast('Failed to load data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, page, sortBy, showToast]);

  const tickets  = items.length ? items : (store.tickets || []);
  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || String(t?.title || '').toLowerCase().includes(q)
      || String(t?.contact || '').toLowerCase().includes(q)
      || String(t?.company || '').toLowerCase().includes(q);
    const matchF = filter === 'All' || t.status === filter;
    return matchQ && matchF;
  });

  const counts = {
    All:           tickets.length,
    Open:          tickets.filter(t => t.status === 'Open').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Closed:        tickets.filter(t => t.status === 'Closed').length,
  };

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const handleCreate = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const res = await ticketsAPI.create({ ...form, created: new Date().toISOString().slice(0, 10) });
      const created = res?.data || { ...form, created: new Date().toISOString().slice(0, 10), id: Date.now() };
      setItems(prev => [created, ...prev]);
      setTotal(prev => prev + 1);
      showToast('Created successfully.');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (error) {
      showToast(error?.message || 'Failed to create.', 'error');
      setModalOpen(false);
    }
  };

  const handleClose = () => { setModalOpen(false); setForm(EMPTY_FORM); setErrors({}); };

  const handleSort = (field) => {
    setSortBy(prev => (prev === field ? `-${field}` : field));
  };

  const handleDeleteTicket = async (id) => {
    try {
      await ticketsAPI.delete(id);
      setItems(prev => prev.filter(t => t.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      showToast('Deleted successfully.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const handleMarkClosed = async (ticket) => {
    try {
      const res = await ticketsAPI.update(ticket.id, { ...ticket, status: 'Closed' });
      const updated = res?.data || { ...ticket, status: 'Closed' };
      setItems(prev => prev.map(t => t.id === ticket.id ? updated : t));
      showToast('Updated successfully.');
    } catch {
      showToast('Failed to update.', 'error');
    }
  };

  return (
    <div className="page-fade">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">{counts.Open} open Â· {tickets.length} total</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <i className="fa fa-plus" /> Create Ticket
        </button>
      </div>

      {/* â”€â”€ Card with search + tabs + table â”€â”€ */}
      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search tickets..." />
          </div>
          <div className="filter-tabs">
            {Object.entries(counts).map(([k, v]) => (
              <button key={k} className={`filter-tab${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>
                {k} <span className="filter-badge">{v}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>#</th><th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Title</th><th onClick={() => handleSort('contact')} style={{ cursor: 'pointer' }}>Contact</th><th onClick={() => handleSort('company')} style={{ cursor: 'pointer' }}>Company</th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Category</th><th onClick={() => handleSort('priority')} style={{ cursor: 'pointer' }}>Priority</th><th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status</th>
                <th onClick={() => handleSort('owner')} style={{ cursor: 'pointer' }}>Owner</th><th onClick={() => handleSort('created')} style={{ cursor: 'pointer' }}>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="empty-state"><i className="fa fa-spinner fa-spin" /><br />Loading tickets...</td></tr>
              )}
              {filtered.map(t => (
                <tr key={t.id}>
                  <td><span style={{ fontFamily:'monospace', fontSize:'12px', color:'var(--text-muted)' }}>#{String(t.id).padStart(4,'0')}</span></td>
                  <td><span className="fw-600">{t.title}</span></td>
                  <td>{t.contact}</td>
                  <td>{t.company}</td>
                  <td>
                    <span className="badge" style={{ background: categoryColor(t.category)+'18', color: categoryColor(t.category) }}>
                      {t.category}
                    </span>
                  </td>
                  <td><span className={`badge badge-${priorityBadge(t.priority)}`}>{t.priority}</span></td>
                  <td><span className={`badge badge-${statusBadge(t.status)}`}>{t.status}</span></td>
                  <td className="txt-sm">{t.owner}</td>
                  <td className="txt-sm txt-muted">{t.created}</td>
                  <td>
                    <div className="action-btns">
                      {t.status !== 'Closed' && (
                        <button className="btn-icon" title="Mark Closed" style={{ color:'var(--success)' }}
                          onClick={() => { void handleMarkClosed(t); }}>
                          <i className="fa fa-check" />
                        </button>
                      )}
                      <button className="btn-icon btn-icon-danger" title="Delete"
                        onClick={() => { void handleDeleteTicket(t.id); }}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={10} className="empty-state"><i className="fa fa-ticket-alt" /><br />No tickets found</td></tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>

      <div className="pagination" style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
        <button className="btn-secondary" disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>

      {/* â•â• Create Ticket Modal â•â• */}
      {modalOpen && createPortal(
        <div className="modal-overlay show" style={{ zIndex: 10000 }} onClick={handleClose}>
          <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <button className="btn-icon" onClick={handleClose} title="Back">
                  <i className="fa fa-arrow-left" />
                </button>
                <h3>Create Ticket</h3>
              </div>
              <button className="modal-close" onClick={handleClose}>&times;</button>
            </div>

            <div className="form-body">

              <div className="form-group">
                <label className="form-label">TICKET TITLE <span className="required">*</span></label>
                <input
                  className={`form-control${errors.title ? ' error' : ''}`}
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                />
                {errors.title && <div className="form-error show">{errors.title}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CONTACT</label>
                  <input className="form-control" value={form.contact} onChange={e => {
                    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                    set('contact', onlyNums);
                  }} />
                </div>
                <div className="form-group">
                  <label className="form-label">COMPANY</label>
                  <input className="form-control" value={form.company} onChange={e => set('company', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">PRIORITY</label>
                  <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <select className="form-control" value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>
                <i className="fa fa-check" /> Save Ticket
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

