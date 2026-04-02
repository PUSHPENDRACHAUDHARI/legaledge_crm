import { useState } from 'react';
import VideoModal from '../components/VideoModal';

const DEFAULT_VIDEO_ID = 'MDQVBE4T6lk';
const DEFAULT_EMBED_URL = `https://www.youtube.com/embed/${DEFAULT_VIDEO_ID}`;

const INITIAL_VIDEOS = [
  { id: 1, title: 'CRM Platform Overview', duration: '2:45', views: 1250, plays: 890, folder: 'Product Demos', date: '2026-03-10', youtubeId: DEFAULT_VIDEO_ID, embedUrl: DEFAULT_EMBED_URL },
  { id: 2, title: 'How to use Email Sequences', duration: '5:20', views: 560, plays: 420, folder: 'Tutorials', date: '2026-02-28' },
  { id: 3, title: 'Q4 All Hands Meeting', duration: '45:00', views: 120, plays: 115, folder: 'Internal', date: '2026-01-15' },
  { id: 4, title: 'Customer Success Story: Acme', duration: '3:10', views: 3400, plays: 2100, folder: 'Case Studies', date: '2026-03-01' },
];

export default function Videos() {
  const [data, setData] = useState(INITIAL_VIDEOS);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [playerVideo, setPlayerVideo] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  function getEmbedUrl(video) {
    return video.embedUrl || `https://www.youtube.com/embed/${video.youtubeId || DEFAULT_VIDEO_ID}`;
  }

  function getEmbedCode(video) {
    return `<iframe width="100%" height="400" src="${getEmbedUrl(video)}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  function openPlayer(video) {
    setPlayerVideo({ ...video, embedUrl: getEmbedUrl(video) });
  }

  function copyEmbedCode(video) {
    navigator.clipboard.writeText(getEmbedCode(video));
    alert('Embed code copied!');
  }

  const rows = data.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.title.toLowerCase().includes(q);
    const matchF = filter === 'All' || v.folder === filter;
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Library</h1>
          <p className="page-subtitle">Host, manage, and track your video content</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ title: '', folder: 'Tutorials', duration: '' }); setErr({}); setModalOpen(true); }}>
          <i className="fa fa-upload" /> Upload Video
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-box">
            <i className="fa fa-search" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" />
          </div>
          <div className="filter-tabs">
            {['All', 'Product Demos', 'Tutorials', 'Case Studies', 'Internal'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {rows.map(v => (
          <div key={v.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              role="button"
              tabIndex={0}
              title="Play video"
              onClick={() => openPlayer(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPlayer(v);
                }
              }}
              style={{ height: '160px', background: '#2c3e50', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <i className="fa fa-play-circle" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.7)' }} />
              <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                {v.duration}
              </span>
            </div>
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{v.title}</h3>
              <div className="txt-sm" style={{ color: 'var(--primary)', marginBottom: '10px' }}><i className="fa fa-folder" /> {v.folder}</div>

              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <span><i className="fa fa-eye" /> {v.views.toLocaleString()}</span>
                <span><i className="fa fa-play" /> {v.plays.toLocaleString()}</span>
                <span><i className="fa fa-calendar-alt" /> {v.date}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <button className="btn-secondary btn-sm" onClick={() => copyEmbedCode(v)}>Copy Embed Code</button>
                <div className="action-btns">
                  <button className="btn-icon" title="Edit" onClick={() => { setForm(v); setErr({}); setModalOpen(true); }}><i className="fa fa-edit" /></button>
                  <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => { if (window.confirm('Delete video?')) setData(data.filter(d => d.id !== v.id)); }}>
                    <i className="fa fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!rows.length && <div className="card empty-state" style={{ gridColumn: '1 / -1' }}><i className="fa fa-video" /><br />No videos found</div>}
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Video' : 'Upload Video'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Video Title <span className="required">*</span></label>
                <input className={`form-control${err.title ? ' is-err' : ''}`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Folder</label>
                  <select className="form-control" value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })}>
                    <option>Product Demos</option><option>Tutorials</option><option>Case Studies</option><option>Internal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input className="form-control" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3:45" />
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
                else setData([...data, { ...form, id: Date.now(), views: 0, plays: 0, date: new Date().toISOString().split('T')[0] }]);
                setModalOpen(false);
              }}><i className="fa fa-save" /> Save</button>
            </div>
          </div>
        </div>
      )}

      <VideoModal open={Boolean(playerVideo)} video={playerVideo} onClose={() => setPlayerVideo(null)} />
    </div>
  );
}
