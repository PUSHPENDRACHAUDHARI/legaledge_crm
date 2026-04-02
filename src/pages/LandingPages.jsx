import { useState } from 'react';

const INITIAL_PAGES = [
  { id: 1, title: 'Q1 Product Launch Webinar', url: '/lp/q1-webinar', status: 'Published', views: 1250, submissions: 340, convRate: '27%' },
  { id: 2, title: 'Enterprise E-book Download', url: '/lp/enterprise-guide', status: 'Published', views: 890, submissions: 112, convRate: '12%' },
  { id: 3, title: 'Summer Promo 2026', url: '/lp/summer-promo', status: 'Draft', views: 0, submissions: 0, convRate: '0%' },
  { id: 4, title: 'Partner Program Sign-up', url: '/lp/partners', status: 'Archived', views: 5600, submissions: 450, convRate: '8%' },
];

export default function LandingPages() {
  const [data, setData] = useState(INITIAL_PAGES);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const rows = data.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q);
    const matchF = filter === 'All' || p.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Landing Pages</h1>
          <p className="page-subtitle">Build and manage your lead capture pages</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => { setForm({ title: '', url: '', status: 'Draft' }); setErr({}); setModalOpen(true); }}>
            <i className="fa fa-plus" /> Create Landing Page
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search landing pages…" />
          </div>
          <div className="filter-tabs">
            {['All', 'Published', 'Draft', 'Archived'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {rows.map(p => (
          <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: '150px', background: 'linear-gradient(135deg, var(--primary-light), var(--bg-hover))', borderBottom: '1px solid var(--border-color)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa fa-flag" style={{ fontSize: '36px', color: 'var(--primary)', opacity: 0.3 }} />
              <span className={`badge badge-${p.status === 'Published' ? 'success' : p.status === 'Draft' ? 'warning' : 'secondary'}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                {p.status}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{p.title}</h3>
              <div className="txt-sm txt-muted" style={{ marginBottom: '15px' }}>{p.url}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '10px 0', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="fw-600">{p.views.toLocaleString()}</div>
                  <div className="txt-sm txt-muted">Views</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="fw-600">{p.submissions.toLocaleString()}</div>
                  <div className="txt-sm txt-muted">Submissions</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div className="fw-600" style={{ color: 'var(--success)' }}>{p.convRate}</div>
                  <div className="txt-sm txt-muted">Conv. Rate</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-secondary btn-sm" onClick={() => { setForm(p); setErr({}); setModalOpen(true); }}>Edit</button>
                <div className="action-btns">
                  <button className="btn-icon" title="Clone" onClick={() => {
                    setData([...data, { ...p, id: Date.now(), title: p.title + ' (Copy)', status: 'Draft', views: 0, submissions: 0 }]);
                  }}><i className="fa fa-copy" /></button>
                  <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => { if (window.confirm('Delete page?')) setData(data.filter(d => d.id !== p.id)); }}>
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <i className="fa fa-flag" /><br />No landing pages found
          </div>
        )}
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Landing Page' : 'Create Landing Page'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Page Title <span className="required">*</span></label>
                <input className={`form-control${err.title ? ' is-err' : ''}`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">URL Slug</label>
                  <input className="form-control" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Draft</option><option>Published</option><option>Archived</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                const e = {};
                if (!form.title.trim()) e.title = true;
                if (Object.keys(e).length) return setErr(e);
                if (form.id) setData(data.map(d => d.id === form.id ? form : d));
                else setData([...data, { ...form, id: Date.now(), views: 0, submissions: 0, convRate: '0%' }]);
                setModalOpen(false);
              }}><i className="fa fa-save" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
