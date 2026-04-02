import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const emptyBlogForm = {
  title: '',
  author: '',
  category: '',
  status: 'Draft',
  date: '',
  views: 0,
};

// ══════════════════════════════════════════════════════════
//  BLOGS
// ══════════════════════════════════════════════════════════
function Blogs() {
  const { store, addRecord, updateRecord, deleteRecord, showToast } = useCRM();
  const [blogEditorOpen, setBlogEditorOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogForm, setBlogForm] = useState(emptyBlogForm);

  const openNewPost = () => {
    setEditingBlogId(null);
    setBlogForm({
      ...emptyBlogForm,
      author: store.blogs[0]?.author || '',
      category: store.blogs[0]?.category || '',
      date: new Date().toISOString().split('T')[0],
    });
    setBlogEditorOpen(true);
  };

  const openEditPost = (blog) => {
    setEditingBlogId(blog.id);
    setBlogForm({
      title: blog.title || '',
      author: blog.author || '',
      category: blog.category || '',
      status: blog.status || 'Draft',
      date: blog.date || new Date().toISOString().split('T')[0],
      views: Number(blog.views || 0),
    });
    setBlogEditorOpen(true);
  };

  const closeBlogEditor = () => {
    setBlogEditorOpen(false);
    setEditingBlogId(null);
    setBlogForm(emptyBlogForm);
  };

  const saveBlog = async () => {
    if (!blogForm.title.trim()) {
      showToast('Blog title is required.', 'warning');
      return;
    }

    const payload = {
      ...(editingBlogId ? { id: editingBlogId } : {}),
      title: blogForm.title.trim(),
      author: blogForm.author.trim() || 'LegalEdge Team',
      category: blogForm.category.trim() || 'General',
      status: blogForm.status || 'Draft',
      date: blogForm.date || new Date().toISOString().split('T')[0],
      views: Number(blogForm.views) || 0,
    };

    if (editingBlogId) {
      await updateRecord('blogs', payload);
      showToast('Blog updated successfully.');
    } else {
      await addRecord('blogs', { ...payload, id: Date.now() });
      showToast('Blog created successfully.');
    }

    closeBlogEditor();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-blog" style={{ color: 'var(--primary)' }}></i> Blog</div>
          <div className="page-subtitle">{store.blogs.length} posts</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openNewPost}><i className="fa fa-plus"></i> New Post</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Date</th><th>Views</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {store.blogs.map(b => (
              <tr key={b.id}>
                <td><b>{b.title}</b></td>
                <td>{b.author}</td>
                <td>{b.category}</td>
                <td>{fmtDate(b.date)}</td>
                <td><i className="fa fa-eye" style={{ color: 'var(--text-muted)', marginRight: 4 }}></i>{b.views.toLocaleString()}</td>
                <td>
                  <span className={`badge-status badge-${b.status === 'Published' ? 'active' : b.status === 'Draft' ? 'contacted' : 'new'}`}>{b.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon edit" onClick={() => openEditPost(b)}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon" onClick={() => setPreviewTarget(b)}><i className="fa fa-eye"></i></button>
                    <button className="btn-icon delete" onClick={() => { deleteRecord('blogs', b.id); showToast('Deleted', 'danger'); }}>
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {blogEditorOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeBlogEditor(); }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBlogId ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
              <button className="modal-close" onClick={closeBlogEditor}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-control"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter blog title"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <input
                    className="form-control"
                    value={blogForm.author}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-control"
                    value={blogForm.category}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Category"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={blogForm.status}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Publish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={blogForm.date}
                    onChange={(e) => setBlogForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Views</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={blogForm.views}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, views: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeBlogEditor}>Cancel</button>
              <button className="btn-primary" onClick={saveBlog}>
                <i className="fa fa-save"></i> Save Post
              </button>
            </div>
          </div>
        </div>
      )}

      {previewTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setPreviewTarget(null); }}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Blog Preview</h3>
              <button className="modal-close" onClick={() => setPreviewTarget(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span className={`badge-status badge-${previewTarget.status === 'Published' ? 'active' : previewTarget.status === 'Draft' ? 'contacted' : 'new'}`}>
                  {previewTarget.status}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(previewTarget.date)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{previewTarget.author}</span>
              </div>
              <h2 style={{ marginTop: 0, marginBottom: 12 }}>{previewTarget.title}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Category: {previewTarget.category} · Views: {Number(previewTarget.views || 0).toLocaleString()}
              </p>
              <div style={{ lineHeight: 1.7, color: 'var(--text)', fontSize: 14 }}>
                <p>{previewTarget.title} is ready to publish in the Content Hub.</p>
                <p>
                  This preview keeps the current layout unchanged while letting you verify the post metadata before publishing.
                </p>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setPreviewTarget(null)}>Close</button>
              <button className="btn-primary" onClick={() => { const target = previewTarget; setPreviewTarget(null); openEditPost(target); }}>
                <i className="fa fa-pen"></i> Edit Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SEO
// ══════════════════════════════════════════════════════════
const SEO_KEYWORDS = [
  ['legal crm software india', 2400, '#1', '↑ 2'],
  ['best crm for law firms', 1800, '#3', '↑ 5'],
  ['crm for legal professionals', 960, '#2', '→ 0'],
  ['law firm client management', 720, '#4', '↑ 1'],
  ['legal case management crm', 580, '#6', '↓ 1'],
];

function SEO() {
  const { showToast } = useCRM();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-magnifying-glass-chart" style={{ color: 'var(--primary)' }}></i> SEO</div>
          <div className="page-subtitle">Search engine optimization tools and analytics</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('Running SEO audit...')}><i className="fa fa-play"></i> Run Audit</button>
        </div>
      </div>

      <div className="stats-grid">
        {[
          ['Domain Authority', '52', 'blue', 'fa-globe', '↑ 3 pts'],
          ['Organic Traffic', '8,420', 'green', 'fa-chart-line', '↑ 18%'],
          ['Keywords Ranked', '124', 'gold', 'fa-key', '↑ 12 new'],
          ['Backlinks', '387', 'info', 'fa-link', '↑ 24'],
        ].map(([label, val, col, ic, change]) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${col}`}><i className={`fa ${ic}`}></i></div>
            <div className="stat-info">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-change up">{change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-2">
        <div className="card-header"><div className="card-title">Top Ranking Keywords</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
<table className="data-table">
            <thead><tr><th>Keyword</th><th>Monthly Searches</th><th>Position</th><th>Change</th></tr></thead>
            <tbody>
              {SEO_KEYWORDS.map(([kw, vol, pos, change]) => (
                <tr key={kw}>
                  <td><b>{kw}</b></td>
                  <td>{vol.toLocaleString()}</td>
                  <td><span className="badge-status badge-active">{pos}</span></td>
                  <td style={{ color: change.startsWith('↑') ? 'var(--success)' : change.startsWith('↓') ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>{change}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  BRAND
// ══════════════════════════════════════════════════════════
function Brand() {
  const { showToast } = useCRM();
  const colors = [
    ['Primary', '#1A3C6B'], ['Accent', '#D4A017'], ['Success', '#22C55E'],
    ['Danger', '#EF4444'], ['Info', '#3B82F6'], ['Warning', '#F59E0B'],
  ];
  const fonts = [
    ['Sora', 'Headings & Brand'], ['DM Sans', 'Body Text'],
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-star" style={{ color: 'var(--accent)' }}></i> Brand</div>
          <div className="page-subtitle">Manage your brand identity and visual guidelines</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('Brand settings saved!')}><i className="fa fa-save"></i> Save Changes</button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Logo */}
        <div className="card">
          <div className="card-header"><div className="card-title">Logo</div></div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: 16, display: 'inline-block' }}>
              <img src="/logo.jpg" alt="LegalEdge Logo" style={{ height: 64, objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>LegalEdge CRM<br />Primary Logo</p>
            <button className="btn-secondary" onClick={() => showToast('Upload logo')}><i className="fa fa-upload"></i> Change Logo</button>
          </div>
        </div>

        {/* Colour Palette */}
        <div className="card">
          <div className="card-header"><div className="card-title">Colour Palette</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {colors.map(([name, hex]) => (
                <div key={name} style={{ textAlign: 'center' }}>
                  <div style={{ width: '100%', height: 44, borderRadius: 8, background: hex, marginBottom: 6, border: '1px solid var(--border)' }}></div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{hex}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="card mt-2">
        <div className="card-header"><div className="card-title">Typography</div></div>
        <div className="card-body">
          {fonts.map(([font, use]) => (
            <div key={font} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: 20, fontWeight: 700 }}>{font}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{use}</div>
              </div>
              <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: 13, color: 'var(--text-muted)' }}>
                AaBbCcDd 1234567890
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CHAT FLOWS
// ══════════════════════════════════════════════════════════
const CHAT_FLOWS = [
  { name: 'Website Lead Capture', trigger: 'Page: Homepage', status: 'Active', leads: 42 },
  { name: 'Pricing Page Chat', trigger: 'Page: Pricing', status: 'Active', leads: 28 },
  { name: 'Support Bot', trigger: 'Page: All Pages', status: 'Active', leads: 0 },
  { name: 'Demo Request Bot', trigger: 'Page: Features', status: 'Paused', leads: 15 },
];

function ChatFlows() {
  const [flows, setFlows] = useState(CHAT_FLOWS);
  const { showToast } = useCRM();

  function toggle(name) {
    setFlows(prev => prev.map(f => f.name === name ? { ...f, status: f.status === 'Active' ? 'Paused' : 'Active' } : f));
    showToast('Chat flow updated!');
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title"><i className="fa fa-comments" style={{ color: 'var(--info)' }}></i> Chat Flows</div></div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('Create chat flow')}><i className="fa fa-plus"></i> Create Chat Flow</button>
        </div>
      </div>

      {flows.map(f => (
        <div key={f.name} className="chatflow-card">
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><i className="fa fa-bolt"></i> Trigger: {f.trigger}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}><i className="fa fa-user-plus"></i> {f.leads} leads captured</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge-status badge-${f.status === 'Active' ? 'active' : 'inactive'}`}>{f.status}</span>
            <button className="btn-icon edit" onClick={() => showToast('Edit chat flow')}><i className="fa fa-pen"></i></button>
            <button className="btn-icon" onClick={() => toggle(f.name)}><i className="fa fa-power-off"></i></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════
export default function ContentHub({ view }) {
  switch (view) {
    case 'blogs':      return <Blogs />;
    case 'seo':        return <SEO />;
    case 'brand':      return <Brand />;
    case 'chatflows':  return <ChatFlows />;
    default:           return <Blogs />;
  }
}
