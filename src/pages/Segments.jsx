import { useState } from 'react';

const INITIAL_SEGMENTS = [
  { id: 1, name: 'All Customers', size: 1250, type: 'Active', object: 'Contact', updated: 'Mar 9, 2026', creator: 'Shailesh Bhange' },
  { id: 2, name: 'Unsubscribed', size: 35, type: 'Active', object: 'Contact', updated: 'Mar 9, 2026', creator: 'Shailesh Bhange' },
  { id: 3, name: 'Newsletter Subscribers', size: 580, type: 'Active', object: 'Contact', updated: 'Mar 9, 2026', creator: 'Shailesh Bhange' },
];

export default function Segments() {
  const [data, setData] = useState(INITIAL_SEGMENTS);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const rows = data.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Segments</h1>
          <p className="page-subtitle">{data.length} segments</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setForm({ name: '', type: 'Active', object: 'Contact' });
          setErr({});
          setModalOpen(true);
        }}>
          <i className="fa fa-plus" /> Create Segment
        </button>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search segments…" />
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Object</th>
                <th>Last Updated</th>
                <th>Creator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}>
                  <td><div className="fw-600" style={{ color: 'var(--primary)' }}>{s.name}</div></td>
                  <td className="fw-500">{s.size.toLocaleString()}</td>
                  <td><span className="badge badge-success">{s.type}</span></td>
                  <td>{s.object}</td>
                  <td className="txt-sm txt-muted">{s.updated}</td>
                  <td className="txt-sm">{s.creator}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Edit" onClick={() => { setForm(s); setErr({}); setModalOpen(true); }}>
                        <i className="fa fa-edit" />
                      </button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => {
                        if (window.confirm('Delete segment?')) setData(data.filter(d => d.id !== s.id));
                      }}>
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty-state"><i className="fa fa-object-group" /><br />No segments found</td></tr>}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Segment' : 'Create Segment'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Segment Name <span className="required">*</span></label>
                <input className={`form-control${err.name ? ' is-err' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Active</option><option>Static</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Object</label>
                  <select className="form-control" value={form.object} onChange={e => setForm({ ...form, object: e.target.value })}>
                    <option>Contact</option><option>Company</option><option>Deal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                const e = {};
                if (!form.name.trim()) e.name = true;
                if (Object.keys(e).length) return setErr(e);
                if (form.id) setData(data.map(d => d.id === form.id ? { ...form, updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } : d));
                else setData([...data, { ...form, id: Date.now(), size: 0, updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), creator: 'Admin' }]);
                setModalOpen(false);
              }}><i className="fa fa-save" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
