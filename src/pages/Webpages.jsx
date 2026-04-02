import { useMemo, useState } from 'react';
import { useCRM } from '../context/CRMContext';

const INITIAL_PAGES = [
  { id: 1, title: 'Home Page', url: '/', status: 'Published', views: 45200, lastUpdated: '2026-03-10', description: 'Main landing experience' },
  { id: 2, title: 'About Us', url: '/about', status: 'Published', views: 12500, lastUpdated: '2026-02-15', description: 'Company story and mission' },
  { id: 3, title: 'Pricing', url: '/pricing', status: 'Published', views: 32100, lastUpdated: '2026-03-01', description: 'Plans and pricing overview' },
  { id: 4, title: 'New Product Features', url: '/features-q1', status: 'Draft', views: 0, lastUpdated: '2026-03-15', description: 'Upcoming feature launch page' },
  { id: 5, title: 'Contact Us', url: '/contact', status: 'Published', views: 8900, lastUpdated: '2026-01-20', description: 'Contact and support options' },
];

const EMPTY_PAGE = {
  id: null,
  title: '',
  url: '',
  status: 'Draft',
  views: 0,
  description: '',
};

const DEFAULT_SETTINGS = {
  domain: 'www.legaledge.in',
  enableIndexing: true,
  enableAnalytics: true,
};

const buildPreviewUrl = (path) => {
  const cleanPath = String(path || '/').trim() || '/';
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${window.location.origin}${normalized}`;
};

export default function Webpages() {
  const { showToast } = useCRM();
  const [pages, setPages] = useState(INITIAL_PAGES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [analyticsTarget, setAnalyticsTarget] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [form, setForm] = useState(EMPTY_PAGE);

  const rows = useMemo(() => pages.filter((page) => {
    const q = search.toLowerCase();
    const matchQ = !q || page.title.toLowerCase().includes(q) || page.url.toLowerCase().includes(q);
    const matchF = filter === 'All' || page.status === filter;
    return matchQ && matchF;
  }), [filter, pages, search]);

  const openCreate = () => {
    setForm(EMPTY_PAGE);
    setEditorOpen(true);
  };

  const openEdit = (page) => {
    setForm(page);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setForm(EMPTY_PAGE);
  };

  const savePage = () => {
    if (!form.title.trim() || !form.url.trim()) {
      showToast('Page title and URL are required.', 'error');
      return;
    }

    const payload = {
      ...form,
      url: form.url.startsWith('/') ? form.url : `/${form.url}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (payload.id) {
      setPages((prev) => prev.map((page) => (page.id === payload.id ? payload : page)));
      showToast(`${payload.title} updated successfully.`);
    } else {
      const created = { ...payload, id: Date.now(), views: 0 };
      setPages((prev) => [created, ...prev]);
      showToast(`${created.title} created successfully.`);
    }

    closeEditor();
  };

  const openPreview = (page) => {
    window.open(buildPreviewUrl(page.url), '_blank', 'noopener,noreferrer');
  };

  const saveSettings = () => {
    setSettingsOpen(false);
    showToast('Website page settings saved successfully.');
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Website Pages</h1>
          <p className="page-subtitle">Manage and track your website pages</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => setSettingsOpen(true)}>
            <i className="fa fa-cog" /> Settings
          </button>
          <button className="btn-primary" onClick={openCreate}>
            <i className="fa fa-plus" /> Create Page
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ minWidth: 'min(100%, 260px)', flex: '1 1 260px' }}>
            <i className="fa fa-search" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." />
          </div>
          <div className="filter-tabs" style={{ flexWrap: 'wrap' }}>
            {['All', 'Published', 'Draft', 'Archived'].map((label) => (
              <button key={label} className={`filter-tab${filter === label ? ' active' : ''}`} onClick={() => setFilter(label)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Page Title</th>
                  <th>URL Slug</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <div className="fw-600 color-primary">{page.title}</div>
                      <div className="txt-muted txt-sm">{page.description}</div>
                    </td>
                    <td className="txt-muted">{page.url}</td>
                    <td>
                      <span className={`badge badge-${page.status === 'Published' ? 'success' : page.status === 'Draft' ? 'warning' : 'secondary'}`}>
                        {page.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fa fa-eye txt-muted" />
                        <span className="fw-500">{page.views.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="txt-sm txt-muted">{page.lastUpdated}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(page)}><i className="fa-solid fa-pencil" /></button>
                        <button className="btn-icon" title="Preview" onClick={() => openPreview(page)}><i className="fa-solid fa-external-link-alt" /></button>
                        <button className="btn-icon" title="Analytics" onClick={() => setAnalyticsTarget(page)}><i className="fa-solid fa-chart-line" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={6} className="empty-state">
                    <i className="fa fa-globe" /><br />No pages found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setSettingsOpen(false); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Website Settings</h3>
              <button className="modal-close" onClick={() => setSettingsOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Primary Domain</label>
                <input className="form-control" value={settings.domain} onChange={(e) => setSettings((prev) => ({ ...prev, domain: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={settings.enableIndexing} onChange={(e) => setSettings((prev) => ({ ...prev, enableIndexing: e.target.checked }))} />
                  Enable search indexing
                </label>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={settings.enableAnalytics} onChange={(e) => setSettings((prev) => ({ ...prev, enableAnalytics: e.target.checked }))} />
                  Enable page analytics
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSettings}>
                <i className="fa fa-save" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeEditor(); }}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Page' : 'Create Page'}</h3>
              <button className="modal-close" onClick={closeEditor}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Page Title</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">URL Slug</label>
                <input className="form-control" value={form.url} onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="/new-page" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                    {['Draft', 'Published', 'Archived'].map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Views</label>
                  <input className="form-control" type="number" min="0" value={form.views} onChange={(e) => setForm((prev) => ({ ...prev, views: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeEditor}>Cancel</button>
              <button className="btn-primary" onClick={savePage}>
                <i className="fa fa-check" /> {form.id ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {analyticsTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setAnalyticsTarget(null); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{analyticsTarget.title} Analytics</h3>
              <button className="modal-close" onClick={() => setAnalyticsTarget(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div className="txt-muted txt-sm">Total Views</div>
                <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{analyticsTarget.views.toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div className="txt-muted txt-sm">Status</div>
                <span className={`badge badge-${analyticsTarget.status === 'Published' ? 'success' : analyticsTarget.status === 'Draft' ? 'warning' : 'secondary'}`}>
                  {analyticsTarget.status}
                </span>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div className="txt-muted txt-sm">Last Updated</div>
                <div className="fw-600" style={{ marginTop: 6 }}>{analyticsTarget.lastUpdated}</div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setAnalyticsTarget(null)}>Close</button>
              <button className="btn-primary" onClick={() => openPreview(analyticsTarget)}>
                <i className="fa fa-external-link-alt" /> Preview Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
