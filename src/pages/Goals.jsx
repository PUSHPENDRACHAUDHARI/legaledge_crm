import { useState } from 'react';

const INITIAL_GOALS = [
  { id: 1, title: 'Q1 Revenue', target: 500000, current: 350000, type: 'currency', owner: 'Sales Team', deadline: '2026-03-31' },
  { id: 2, title: 'New Logos', target: 50, current: 42, type: 'number', owner: 'Nainika Pounikar', deadline: '2026-03-31' },
  { id: 3, title: 'Customer Retention Rate', target: 95, current: 92, type: 'percentage', owner: 'Success Team', deadline: '2026-06-30' },
  { id: 4, title: 'Marketing Qualified Leads', target: 1000, current: 850, type: 'number', owner: 'Marketing', deadline: '2026-03-31' },
];

export default function Goals() {
  const [data, setData] = useState(INITIAL_GOALS);
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const formatValue = (val, type) => {
    if (type === 'currency') return '$' + val.toLocaleString();
    if (type === 'percentage') return val + '%';
    return val.toLocaleString();
  };

  const openCreate = () => {
    setForm({ title: '', target: '', current: 0, type: 'number', owner: '', deadline: '' });
    setErr({});
    setModalOpen(true);
  };

  const openEdit = (g) => {
    setForm({ ...g });
    setErr({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (!form.target) e.target = true;
    if (!form.owner.trim()) e.owner = true;
    if (Object.keys(e).length) return setErr(e);
    const saved = { ...form, target: Number(form.target), current: Number(form.current || 0) };
    if (form.id) setData(data.map(d => d.id === form.id ? saved : d));
    else setData([...data, { ...saved, id: Date.now() }]);
    setModalOpen(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Goals</h1>
          <p className="page-subtitle">Track KPIs and team performance against targets</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <i className="fa fa-bullseye" /> Create Goal
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-toolbar">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Goal Overview</h3>
          <div className="filter-tabs">
            {['All', 'My Goals', 'Team Goals', 'Company Goals'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        {data.map(g => {
          const percentage = Math.round((g.current / g.target) * 100);
          const statusColor = percentage >= 90 ? 'var(--success)' : percentage >= 70 ? 'var(--warning)' : 'var(--danger)';

          return (
            <div key={g.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'var(--primary)' }}>{g.title}</h3>
                  <div className="txt-sm txt-muted"><i className="fa fa-user" style={{ marginRight: '5px' }} /> {g.owner}</div>
                </div>
                <div className="txt-sm txt-muted" style={{ background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>
                  <i className="fa fa-clock" style={{ marginRight: '4px' }} /> {g.deadline}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatValue(g.current, g.type)}</div>
                <div className="txt-muted txt-sm">Target: {formatValue(g.target, g.type)}</div>
              </div>

              <div style={{ background: 'var(--bg-hover)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ background: statusColor, width: `${Math.min(percentage, 100)}%`, height: '100%', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: statusColor, fontWeight: 'bold', fontSize: '14px' }}>{percentage}% Achieved</span>
                <span className="txt-sm txt-muted">{(g.target - g.current) > 0 ? `${formatValue(g.target - g.current, g.type)} remaining` : 'Goal Exceeded!'}</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-secondary btn-sm" onClick={() => openEdit(g)}>Update Progress</button>
                <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => {
                  if (window.confirm('Delete this goal?')) setData(data.filter(d => d.id !== g.id));
                }}><i className="fa fa-trash" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Update Goal' : 'Create Goal'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Goal Title <span className="required">*</span></label>
                <input className={`form-control${err.title ? ' is-err' : ''}`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Target <span className="required">*</span></label>
                  <input type="number" className={`form-control${err.target ? ' is-err' : ''}`} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Progress</label>
                  <input type="number" className="form-control" value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="number">Number</option>
                    <option value="currency">Currency</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-control" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Owner <span className="required">*</span></label>
                <input className={`form-control${err.owner ? ' is-err' : ''}`} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-save" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
