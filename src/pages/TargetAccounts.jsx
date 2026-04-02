import { useState } from 'react';

const DUMMY_ACCOUNTS = [
  { id: 1, name: 'Stark Industries', industry: 'Defense', owner: 'Tony Stark', status: 'Target', score: 98, lastContact: '2 Days Ago' },
  { id: 2, name: 'Wayne Enterprises', industry: 'Conglomerate', owner: 'Bruce Wayne', status: 'Engaged', score: 85, lastContact: '1 Week Ago' },
  { id: 3, name: 'Daily Bugle', industry: 'Media', owner: 'J. Jonah Jameson', status: 'Not Contacted', score: 45, lastContact: 'Never' },
  { id: 4, name: 'Oscorp', industry: 'Technology', owner: 'Norman Osborn', status: 'Disqualified', score: 12, lastContact: '3 Months Ago' },
];

export default function TargetAccounts() {
  const [data, setData] = useState(DUMMY_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const rows = data.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q);
    const matchF = filter === 'All' || a.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Target Accounts</h1>
          <p className="page-subtitle">Prioritize and engage your tier 1 accounts</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-primary" onClick={() => {
            setForm({ name: '', industry: 'Technology', owner: 'Unassigned', status: 'Target', score: '' });
            setErr({});
            setModalOpen(true);
          }}>
            <i className="fa fa-crosshairs"/> Add Target Account
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <i className="fa fa-search"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search accounts…"/>
          </div>
          <div className="filter-tabs">
            {['All', 'Target', 'Engaged', 'Not Contacted', 'Disqualified'].map(f=>(
              <button key={f} className={`filter-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Industry</th>
                <th>Owner</th>
                <th>Account Score</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a=>(
                <tr key={a.id}>
                  <td>
                    <div className="fw-600">{a.name}</div>
                  </td>
                  <td>{a.industry}</td>
                  <td className="txt-sm">{a.owner}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'var(--bg-hover)', height: '6px', borderRadius: '3px' }}>
                        <div style={{ background: a.score > 80 ? 'var(--success)' : a.score > 50 ? 'var(--warning)' : 'var(--danger)', width: `${a.score}%`, height: '100%', borderRadius: '3px' }}></div>
                      </div>
                      <span className="txt-sm fw-500">{a.score}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${a.status==='Engaged'?'success':a.status==='Target'?'primary':a.status==='Disqualified'?'danger':'warning'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="txt-muted txt-sm">{a.lastContact}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Edit" onClick={() => { setForm(a); setErr({}); setModalOpen(true); }}><i className="fa-solid fa-edit"/></button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => {
                        if(window.confirm('Delete account?')) setData(data.filter(x => x.id !== a.id));
                      }}><i className="fa-solid fa-trash"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} className="empty-state">
                  <i className="fa fa-building"/><br/>No target accounts found
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
              <h3>{form.id ? 'Edit Account' : 'Add Target Account'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Company <span className="required">*</span></label>
                <input className={`form-control${err.name ? ' is-err' : ''}`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select className="form-control" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                    <option>Technology</option><option>Defense</option><option>Conglomerate</option><option>Media</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option>Target</option><option>Engaged</option><option>Not Contacted</option><option>Disqualified</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Account Score (0-100) <span className="required">*</span></label>
                <input type="number" min="0" max="100" className={`form-control${err.score ? ' is-err' : ''}`} value={form.score} onChange={e => setForm({...form, score: e.target.value})} />
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                let e = {};
                if (!form.name.trim()) e.name = true;
                if (!form.score) e.score = true;
                if (Object.keys(e).length) return setErr(e);
                
                if (form.id) setData(data.map(d => d.id === form.id ? {...form, score: Number(form.score)} : d));
                else setData([...data, {...form, id: Date.now(), score: Number(form.score), lastContact: 'Never'}]);
                setModalOpen(false);
              }}><i className="fa fa-save"></i> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
