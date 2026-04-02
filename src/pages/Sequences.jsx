import { useState } from 'react';

const DUMMY_SEQUENCES = [
  { id: 1, name: 'New Lead Welcome Series', steps: 4, enrolled: 128, replyRate: '15%', status: 'Active', lastUpdated: '2026-03-10' },
  { id: 2, name: 'Cold Outreach - Tech CEOs', steps: 5, enrolled: 45, replyRate: '8%', status: 'Active', lastUpdated: '2026-02-28' },
  { id: 3, name: 'Q1 Enterprise Renewal', steps: 3, enrolled: 12, replyRate: '42%', status: 'Paused', lastUpdated: '2026-01-15' },
  { id: 4, name: 'Webinar Follow-up', steps: 2, enrolled: 350, replyRate: '22%', status: 'Draft', lastUpdated: '2026-03-15' },
];

export default function Sequences() {
  const [data, setData] = useState(DUMMY_SEQUENCES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const rows = data.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q);
    const matchF = filter === 'All' || s.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sequences</h1>
          <p className="page-subtitle">Automate your sales outreach and follow-ups</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-primary" onClick={() => {
            setForm({ name: '', steps: '', status: 'Draft' });
            setErr({});
            setModalOpen(true);
          }}>
            <i className="fa fa-plus"/> Create Sequence
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sequences…"/>
          </div>
          <div className="filter-tabs">
            {['All', 'Active', 'Paused', 'Draft'].map(f=>(
              <button key={f} className={`filter-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Sequence Name</th>
                <th>Steps</th>
                <th>Total Enrolled</th>
                <th>Reply Rate</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s=>(
                <tr key={s.id}>
                  <td>
                    <div className="fw-600">{s.name}</div>
                  </td>
                  <td>{s.steps} steps</td>
                  <td><span className="fw-500">{s.enrolled}</span> contacts</td>
                  <td><span className="txt-success fw-500">{s.replyRate}</span></td>
                  <td>
                    <span className={`badge badge-${s.status==='Active'?'success':s.status==='Paused'?'warning':'secondary'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="txt-sm txt-muted">{s.lastUpdated}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Edit" onClick={() => { setForm(s); setErr({}); setModalOpen(true); }}><i className="fa-solid fa-pencil"/></button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => {
                        if(window.confirm('Delete sequence?')) setData(data.filter(x => x.id !== s.id));
                      }}><i className="fa-solid fa-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} className="empty-state">
                  <i className="fa fa-list-ol"/><br/>No sequences found
                </td></tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Sequence' : 'Create Sequence'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Sequence Name <span className="required">*</span></label>
                <input className={`form-control${err.name ? ' is-err' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Steps <span className="required">*</span></label>
                  <input type="number" min="1" className={`form-control${err.steps ? ' is-err' : ''}`} value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option>Draft</option><option>Active</option><option>Paused</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                let e = {};
                if (!form.name.trim()) e.name = true;
                if (!form.steps) e.steps = true;
                if (Object.keys(e).length) return setErr(e);
                
                if (form.id) setData(data.map(d => d.id === form.id ? {...form, steps: Number(form.steps)} : d));
                else setData([...data, {...form, id: Date.now(), steps: Number(form.steps), enrolled: 0, replyRate: '0%', lastUpdated: new Date().toISOString().split('T')[0]}]);
                setModalOpen(false);
              }}><i className="fa fa-save"></i> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
