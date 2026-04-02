import { useState } from 'react';

const CATEGORIES = ['Getting Started', 'Account & Billing', 'Features & Tools', 'Integrations', 'Troubleshooting'];

const ARTICLES = [
  { id: 1, title: 'How to import contacts from CSV', category: 'Getting Started', views: 1245, status: 'Published' },
  { id: 2, title: 'Setting up 2FA for your account', category: 'Account & Billing', views: 890, status: 'Published' },
  { id: 3, title: 'Connecting Slack integration', category: 'Integrations', views: 340, status: 'Draft' },
  { id: 4, title: 'Creating custom reports', category: 'Features & Tools', views: 2100, status: 'Published' },
  { id: 5, title: 'Sync issues with calendar', category: 'Troubleshooting', views: 567, status: 'Published' },
];

export default function KnowledgeBase() {
  const [data, setData] = useState(ARTICLES);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q);
    const matchC = activeCat === 'All' || a.category === activeCat;
    return matchQ && matchC;
  });

  const openCreate = () => { setForm({ title: '', category: 'Getting Started', status: 'Draft' }); setErr({}); setModalOpen(true); };
  const openEdit = (a) => { setForm(a); setErr({}); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  const handleSave = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (Object.keys(e).length) return setErr(e);
    if (form.id) setData(data.map(d => d.id === form.id ? form : d));
    else setData([...data, { ...form, id: Date.now(), views: 0 }]);
    closeModal();
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-subtitle">Manage help articles and documentation</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <i className="fa fa-plus" /> New Article
        </button>
      </div>

      <div className="kb-layout">
        <div className="card" style={{ padding: '15px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['All', ...CATEGORIES].map(c => (
              <button key={c}
                style={{ textAlign: 'left', padding: '10px 15px', background: activeCat === c ? 'var(--primary-light)' : 'transparent', color: activeCat === c ? 'var(--primary)' : 'inherit', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: activeCat === c ? '600' : '400' }}
                onClick={() => setActiveCat(c)}>
                <i className={`fa fa-folder${c === 'All' ? '-open' : ''}`} style={{ marginRight: '10px', width: '16px' }} /> {c === 'All' ? 'All Articles' : c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="search-box" style={{ maxWidth: '100%', width: '100%' }}>
              <i className="fa fa-search" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…" />
            </div>
          </div>

          <div className="cards-grid" style={{ gridTemplateColumns: '1fr', gap: '15px' }}>
            {filtered.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <i className="fa fa-file-alt" />
                  </div>
                  <div>
                    <div className="fw-600" style={{ fontSize: '16px', color: 'var(--primary)' }}>{a.title}</div>
                    <div className="txt-sm txt-muted" style={{ marginTop: '4px' }}>
                      <span className="badge badge-secondary" style={{ marginRight: '10px' }}>{a.category}</span>
                      <i className="fa fa-eye" style={{ marginRight: '4px' }} /> {a.views} views
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge badge-${a.status === 'Published' ? 'success' : 'warning'}`}>{a.status}</span>
                  <button className="btn-icon" title="Edit" onClick={() => openEdit(a)}><i className="fa fa-pencil" /></button>
                  <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => { if (window.confirm('Delete article?')) setData(data.filter(x => x.id !== a.id)); }}>
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="card empty-state">
                <i className="fa fa-file-alt" /><br />No articles found
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) closeModal(); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Article' : 'New Article'}</h3>
              <button className="modal-close" onClick={closeModal}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Article Title <span className="required">*</span></label>
                <input className={`form-control${err.title ? ' is-err' : ''}`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-save" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
