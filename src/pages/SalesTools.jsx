import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

// ── Helper ──────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '–';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ══════════════════════════════════════════════════════════
//  PLAYBOOKS
// ══════════════════════════════════════════════════════════
function Playbooks() {
  const { store, addRecord, deleteRecord, showToast } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Sales', steps: '' });
  const [err, setErr] = useState({});

  function save() {
    if (!form.name.trim()) { setErr({ name: 'Required' }); return; }
    const steps = form.steps.split('\n').map(s => s.trim()).filter(Boolean);
    addRecord('playbooks', { id: Date.now(), name: form.name, category: form.category, steps, used: 0 });
    showToast('Playbook created!');
    setShowForm(false);
    setForm({ name: '', category: 'Sales', steps: '' });
    setErr({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-book-bookmark" style={{ color: 'var(--primary)' }}></i> Playbooks</div>
          <div className="page-subtitle">Sales and service conversation guides</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}><i className="fa fa-plus"></i> New Playbook</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header"><div className="card-title">Create Playbook</div></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Playbook Name <span className="required">*</span></label>
              <input className={`form-control${err.name ? ' error' : ''}`} placeholder="e.g. Cold Call Script"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {err.name && <div className="form-error">{err.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['Sales', 'Success', 'Support', 'Marketing'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Steps (one per line) <span className="required">*</span></label>
              <textarea className="form-control" rows={5} placeholder={"Step 1\nStep 2\nStep 3"}
                value={form.steps} onChange={e => setForm(p => ({ ...p, steps: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setErr({}); }}>Cancel</button>
              <button className="btn-primary" onClick={save}><i className="fa fa-save"></i> Save Playbook</button>
            </div>
          </div>
        </div>
      )}

      <div className="playbook-card-grid">
        {store.playbooks.map(p => (
          <div key={p.id} style={{ minWidth: 0 }}>
            <div className="card h-100 d-flex flex-column p-3 playbook-card">
              {/* Header Section: Title left, Actions right */}
              <div className="playbook-card-header d-flex justify-content-between align-items-start mb-3 gap-2">
                <h5 className="mb-0 text-wrap fw-bold" style={{ lineHeight: '1.2' }}>{p.name}</h5>
                <div className="playbook-card-actions d-flex gap-2 flex-shrink-0">
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => showToast('Edit playbook')} title="Edit">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => { deleteRecord('playbooks', p.id); showToast('Deleted', 'danger'); }} title="Delete">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Tag Row */}
              <div className="playbook-card-meta d-flex justify-content-between align-items-center mb-3">
                <span className={`badge ${p.category === 'Sales' ? 'bg-primary' : 'bg-success'}`}>{p.category}</span>
              </div>

              {/* Content Section: Bullets */}
              <ul className="list-unstyled mb-3 flex-grow-1 playbook-bullets">
                {p.steps.map((s, i) => (
                  <li key={i} className="d-flex align-items-start mb-2">
                    <span className="badge bg-secondary me-2 flex-shrink-0 mt-1" style={{ minWidth: '22px' }}>{i + 1}</span>
                    <span className="text-wrap">{s}</span>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="playbook-card-footer mt-auto text-muted small">
                <i className="fa-solid fa-chart-bar me-1"></i> Used {p.used} times
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MESSAGE TEMPLATES
// ══════════════════════════════════════════════════════════
function MessageTemplates() {
  const { store, addRecord, deleteRecord, showToast } = useCRM();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '', tags: '' });
  const [err, setErr] = useState({});

  const filtered = store.templates.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
  );

  function save() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.subject.trim()) e.subject = 'Required';
    if (Object.keys(e).length) { setErr(e); return; }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    addRecord('templates', { id: Date.now(), name: form.name, subject: form.subject, preview: form.body, tags: tags.length ? tags : ['General'], used: 0 });
    showToast('Template created!');
    setShowForm(false);
    setForm({ name: '', subject: '', body: '', tags: '' });
    setErr({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-envelope-open-text" style={{ color: 'var(--primary)' }}></i> Message Templates</div>
          <div className="page-subtitle">{store.templates.length} templates</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}><i className="fa fa-plus"></i> New Template</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header"><div className="card-title">Create Message Template</div></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Template Name <span className="required">*</span></label>
              <input className={`form-control${err.name ? ' error' : ''}`} placeholder="e.g. Demo Follow-up"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              {err.name && <div className="form-error">{err.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Subject Line <span className="required">*</span></label>
              <input className={`form-control${err.subject ? ' error' : ''}`} placeholder="e.g. Thank you for your time, {{first_name}}"
                value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
              {err.subject && <div className="form-error">{err.subject}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Body</label>
              <textarea className="form-control" rows={5} placeholder="Use {{first_name}}, {{company}}, {{deal_name}} as variables"
                value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-control" placeholder="e.g. Sales, Follow-up"
                value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setErr({}); }}>Cancel</button>
              <button className="btn-primary" onClick={save}><i className="fa fa-save"></i> Save Template</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-filters">
        <div className="filter-search"><i className="fa fa-search"></i>
          <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="template-grid">
        {filtered.map(t => (
          <div key={t.id} className="template-card">
            <h4>{t.name}</h4>
            <div className="subject">Subject: {t.subject}</div>
            <div className="preview">{t.preview}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div className="template-tags">
                {t.tags.map((tg, i) => <span key={i} className="template-tag">{tg}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-icon edit" onClick={() => showToast('Edit template')}><i className="fa fa-pen"></i></button>
                <button className="btn-icon" onClick={() => showToast('Template copied!')}><i className="fa fa-copy"></i></button>
                <button className="btn-icon delete" onClick={() => { deleteRecord('templates', t.id); showToast('Deleted', 'danger'); }}>
                  <i className="fa fa-trash"></i>
                </button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}><i className="fa fa-chart-bar"></i> Used {t.used} times</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SNIPPETS
// ══════════════════════════════════════════════════════════
function Snippets() {
  const { store, addRecord, deleteRecord, showToast } = useCRM();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', shortcut: '', text: '' });
  const [err, setErr] = useState({});

  function save() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.shortcut.trim()) e.shortcut = 'Required (start with #)';
    if (Object.keys(e).length) { setErr(e); return; }
    addRecord('snippets', { id: Date.now(), name: form.name, shortcut: form.shortcut, text: form.text });
    showToast('Snippet created!');
    setShowForm(false);
    setForm({ name: '', shortcut: '', text: '' });
    setErr({});
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-scissors" style={{ color: 'var(--primary)' }}></i> Snippets</div>
          <div className="page-subtitle">Short reusable text blocks triggered by shortcuts</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}><i className="fa fa-plus"></i> New Snippet</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-header"><div className="card-title">Create Snippet</div></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name <span className="required">*</span></label>
                <input className={`form-control${err.name ? ' error' : ''}`} placeholder="e.g. Pricing Info"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                {err.name && <div className="form-error">{err.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Shortcut <span className="required">*</span></label>
                <input className={`form-control${err.shortcut ? ' error' : ''}`} placeholder="#pricing"
                  value={form.shortcut} onChange={e => setForm(p => ({ ...p, shortcut: e.target.value }))} />
                {err.shortcut && <div className="form-error">{err.shortcut}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Text Content</label>
              <textarea className="form-control" rows={4} placeholder="Enter the text content of the snippet..."
                value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setErr({}); }}>Cancel</button>
              <button className="btn-primary" onClick={save}><i className="fa fa-save"></i> Save Snippet</button>
            </div>
          </div>
        </div>
      )}

      <div>
        {store.snippets.map(s => (
          <div key={s.id} className="snippet-card">
            <span className="snippet-shortcut">{s.shortcut}</span>
            <div className="snippet-body">
              <h4>{s.name}</h4>
              <p>{s.text}</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="btn-icon" onClick={() => showToast('Snippet copied!')}><i className="fa fa-copy"></i></button>
              <button className="btn-icon edit" onClick={() => showToast('Edit snippet')}><i className="fa fa-pen"></i></button>
              <button className="btn-icon delete" onClick={() => { deleteRecord('snippets', s.id); showToast('Deleted', 'danger'); }}>
                <i className="fa fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DOCUMENTS
// ══════════════════════════════════════════════════════════
function Documents() {
  const { store, updateRecord, deleteRecord, showToast } = useCRM();
  const iconMap = { PDF: 'fa-file-pdf', Word: 'fa-file-word', Excel: 'fa-file-excel' };
  const colMap  = { PDF: 'var(--danger)', Word: 'var(--info)', Excel: 'var(--success)' };
  const [editingDoc, setEditingDoc] = useState(null);
  const [docForm, setDocForm] = useState({ name: '', type: 'PDF', size: '', owner: '', created: '', views: 0 });

  const openDocEditor = (doc) => {
    setEditingDoc(doc);
    setDocForm({
      name: doc.name || '',
      type: doc.type || 'PDF',
      size: doc.size || '',
      owner: doc.owner || '',
      created: doc.created || '',
      views: Number(doc.views || 0),
    });
  };

  const closeDocEditor = () => {
    setEditingDoc(null);
    setDocForm({ name: '', type: 'PDF', size: '', owner: '', created: '', views: 0 });
  };

  const saveDoc = async () => {
    if (!editingDoc) return;
    if (!docForm.name.trim()) {
      showToast('Document name is required.', 'warning');
      return;
    }

    await updateRecord('documents', {
      ...editingDoc,
      name: docForm.name.trim(),
      type: docForm.type,
      size: docForm.size.trim() || editingDoc.size,
      owner: docForm.owner.trim() || editingDoc.owner,
      created: docForm.created || editingDoc.created,
      views: Number(docForm.views) || 0,
    });
    showToast('Document updated successfully.');
    closeDocEditor();
  };

  const shareDocument = async (doc) => {
    const shareText = `${doc.name} (${doc.type}) - owner: ${doc.owner}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        showToast('Document details copied.');
        return;
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }

    window.prompt('Copy document details', shareText);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-folder-open" style={{ color: 'var(--accent)' }}></i> Documents</div>
          <div className="page-subtitle">{store.documents.length} documents</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('Upload ready')}><i className="fa fa-upload"></i> Upload Document</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Views</th><th>Owner</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {store.documents.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className={`fa ${iconMap[d.type] || 'fa-file'}`} style={{ color: colMap[d.type] || 'var(--text-muted)', fontSize: 18 }}></i>
                    <b>{d.name}</b>
                  </div>
                </td>
                <td><span className="badge-status badge-contacted">{d.type}</span></td>
                <td>{d.size}</td>
                <td><i className="fa fa-eye" style={{ color: 'var(--text-muted)', marginRight: 4 }}></i>{d.views}</td>
                <td>{d.owner}</td>
                <td>{fmtDate(d.created)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" onClick={() => shareDocument(d)}><i className="fa fa-share"></i></button>
                    <button className="btn-icon edit" onClick={() => openDocEditor(d)}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon delete" onClick={() => { deleteRecord('documents', d.id); showToast('Deleted', 'danger'); }}>
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingDoc && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeDocEditor(); }}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Document</h3>
              <button className="modal-close" onClick={closeDocEditor}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Document Name</label>
                <input
                  className="form-control"
                  value={docForm.name}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-control"
                    value={docForm.type}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="PDF">PDF</option>
                    <option value="Word">Word</option>
                    <option value="Excel">Excel</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <input
                    className="form-control"
                    value={docForm.size}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, size: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Owner</label>
                  <input
                    className="form-control"
                    value={docForm.owner}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, owner: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Created</label>
                  <input
                    type="date"
                    className="form-control"
                    value={docForm.created}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, created: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Views</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={docForm.views}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, views: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeDocEditor}>Cancel</button>
              <button className="btn-primary" onClick={saveDoc}>
                <i className="fa fa-save"></i> Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  COACHING PLAYLISTS
// ══════════════════════════════════════════════════════════
function CoachingPlaylists() {
  const { store, showToast } = useCRM();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-circle-play" style={{ color: 'var(--primary)' }}></i> Coaching Playlists</div>
          <div className="page-subtitle">Sales training and enablement content</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('New playlist')}><i className="fa fa-plus"></i> New Playlist</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {store.coachingPlaylists.map(p => (
          <div key={p.id} className="playlist-card">
            <div className="playlist-thumb"><i className="fa fa-circle-play"></i></div>
            <div className="playlist-body">
              <h4>{p.name}</h4>
              <p>{p.category}</p>
              <div className="playlist-meta">
                <span><i className="fa fa-video"></i> {p.videos} videos</span>
                <span><i className="fa fa-clock"></i> {p.duration}</span>
                <span><i className="fa fa-users"></i> {p.assigned} assigned</span>
              </div>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <button className="btn-secondary" style={{ flex: 1, fontSize: 12, padding: 6 }} onClick={() => showToast('Playing playlist...')}><i className="fa fa-play"></i> Play</button>
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 10px' }} onClick={() => showToast('Playlist assigned!')}><i className="fa fa-paper-plane"></i> Assign</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ACTIVITY FEED
// ══════════════════════════════════════════════════════════
const ACTIVITIES = [
  { icon: 'fa-user-plus', color: 'rgba(26,60,107,0.1)', iconColor: 'var(--primary)', user: 'Nainika Pounikar', action: 'created a new lead', detail: 'Vijay Khanna from StartupX', time: '2 min ago' },
  { icon: 'fa-handshake', color: 'rgba(34,197,94,0.1)', iconColor: 'var(--success)', user: 'Subodh Badole', action: 'updated deal stage', detail: 'Full Platform Bundle → Negotiation', time: '15 min ago' },
  { icon: 'fa-envelope', color: 'rgba(59,130,246,0.1)', iconColor: 'var(--info)', user: 'Gaurav Dotonde', action: 'sent email', detail: 'Proposal to TechCorp India', time: '1 hr ago' },
  { icon: 'fa-phone', color: 'rgba(245,158,11,0.1)', iconColor: 'var(--warning)', user: 'Bali Dondkar', action: 'logged a call', detail: '30-min call with Amit Joshi', time: '2 hr ago' },
  { icon: 'fa-check-circle', color: 'rgba(34,197,94,0.1)', iconColor: 'var(--success)', user: 'Nikhil Lade', action: 'completed task', detail: 'Contract review – MediCare', time: '3 hr ago' },
  { icon: 'fa-ticket-alt', color: 'rgba(239,68,68,0.1)', iconColor: 'var(--danger)', user: 'Siddehesh Waske', action: 'opened a ticket', detail: 'Cannot login to CRM – TechCorp', time: '4 hr ago' },
  { icon: 'fa-file-invoice', color: 'rgba(212,160,23,0.12)', iconColor: 'var(--accent)', user: 'Shailesh Bhange', action: 'created invoice', detail: 'INV-2026-003 for FinPro Services', time: '5 hr ago' },
  { icon: 'fa-user-check', color: 'rgba(26,60,107,0.1)', iconColor: 'var(--primary)', user: 'Styajit Galande', action: 'converted lead', detail: 'Sachin Pawar converted to contact', time: 'Yesterday' },
];

function ActivityFeed() {
  const [filter, setFilter] = useState('All Activities');
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-rss" style={{ color: 'var(--primary)' }}></i> Activity Feed</div>
          <div className="page-subtitle">All team activities in real-time</div>
        </div>
        <div className="page-actions">
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            {['All Activities', 'My Activities', 'Calls', 'Emails', 'Deals'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '24px' }}>
          <div className="activity-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {/* Vertical line tracker */}
            <div style={{ position: 'absolute', left: '19px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>
            
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="feed-item" style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                <div className="feed-icon" style={{ background: a.color, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '4px solid var(--surface)' }}>
                  <i className={`fa ${a.icon}`} style={{ color: a.iconColor, fontSize: '14px' }}></i>
                </div>
                <div className="feed-body" style={{ flex: 1, minWidth: 0, paddingBottom: '12px', borderBottom: i === ACTIVITIES.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <b style={{ color: 'var(--text)' }}>{a.user}</b> <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{a.action}</span>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text)' }}>{a.detail}</p>
                    </div>
                    <div className="feed-time" style={{ fontSize: '12px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{a.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════
export default function SalesTools({ view }) {
  switch (view) {
    case 'playbooks':  return <Playbooks />;
    case 'templates':  return <MessageTemplates />;
    case 'snippets':   return <Snippets />;
    case 'documents':  return <Documents />;
    case 'coaching':   return <CoachingPlaylists />;
    case 'activity':   return <ActivityFeed />;
    default:           return <Playbooks />;
  }
}
