import { useEffect, useRef, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { designFilesAPI } from '../services/api';

const FILES_AND_FOLDERS = [
  { id: 1, name: 'website-theme', type: 'folder', items: 12, lastModified: '2026-03-10' },
  { id: 2, name: 'email-templates', type: 'folder', items: 5, lastModified: '2026-02-28' },
  { id: 3, name: 'landing-page-v2', type: 'folder', items: 8, lastModified: '2026-03-12' },
  { id: 4, name: 'main.css', type: 'file', ext: 'css', size: '45 KB', lastModified: '2026-03-14' },
  { id: 5, name: 'header.js', type: 'file', ext: 'js', size: '12 KB', lastModified: '2026-03-15' },
  { id: 6, name: 'logo.png', type: 'file', ext: 'img', size: '250 KB', lastModified: '2026-01-20' },
];

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({
  ...(row?.data || {}),
  id: row?.data?.id || row?.localId || row?.id,
  apiId: row?.id || null,
});

export default function DesignManager() {
  const { showToast } = useCRM();
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [files, setFiles] = useState(() => [...FILES_AND_FOLDERS]);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [detailsTarget, setDetailsTarget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await designFilesAPI.list();
        const saved = toList(res).map(unwrapPayload);
        setFiles([...FILES_AND_FOLDERS, ...saved]);
      } catch (err) {
        console.warn('Failed to load design files from API:', err.message);
      }
    })();
  }, []);

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const getType = (name) => {
      const ext = String(name || '').split('.').pop().toLowerCase();
      if (['css'].includes(ext)) return 'css';
      if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return 'js';
      if (['html', 'htm'].includes(ext)) return 'html';
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
      return 'other';
    };

    const getSize = (bytes) => {
      if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${bytes} B`;
    };

    const newFiles = selected.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: getSize(file.size),
      type: getType(file.name),
      modified: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      folderId: null,
      lastModified: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
    }));

    try {
      const createdRows = [];
      for (const item of newFiles) {
        const created = await designFilesAPI.create({ localId: item.id, data: item });
        createdRows.push(unwrapPayload(created));
      }
      setFiles((prev) => [...prev, ...createdRows]);
    } catch (err) {
      console.warn('Failed to save design files to API:', err.message);
      setFiles((prev) => [...prev, ...newFiles]);
    }

    const msg = newFiles.length === 1
      ? `"${newFiles[0].name}" uploaded successfully!`
      : `${newFiles.length} files uploaded successfully!`;
    showToast(msg);

    e.target.value = '';
  };

  const filtered = files.filter(f => {
    return !search || f.name.toLowerCase().includes(search.toLowerCase());
  });

  const openRename = (item) => {
    setRenameTarget(item);
    setRenameValue(item.name || '');
  };

  const closeRename = () => {
    setRenameTarget(null);
    setRenameValue('');
  };

  const saveRename = async () => {
    if (!renameTarget) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      showToast('Name is required.', 'warning');
      return;
    }

    const updatedItem = { ...renameTarget, name: nextName };
    setFiles((prev) => prev.map((item) => (item.id === renameTarget.id ? updatedItem : item)));

    if (renameTarget.apiId) {
      try {
        await designFilesAPI.update(renameTarget.apiId, { localId: renameTarget.id, data: updatedItem });
      } catch (err) {
        console.warn('Failed to rename design file in API:', err.message);
      }
    }

    showToast(`Renamed to ${nextName}`);
    closeRename();
  };

  const getIcon = (item) => {
    if (item.type === 'folder') return 'fa-folder';
    if (item.type === 'css' || item.ext === 'css') return 'fa-file-code';
    if (item.type === 'js' || item.ext === 'js') return 'fa-file-code';
    if (item.type === 'html' || item.ext === 'html') return 'fa-file-code';
    if (item.type === 'image' || item.ext === 'img') return 'fa-file-image';
    return 'fa-file';
  };

  const getIconColor = (item) => {
    if (item.type === 'folder') return 'var(--warning)';
    if (item.type === 'css' || item.ext === 'css') return 'var(--info)';
    if (item.type === 'js' || item.ext === 'js') return 'var(--success)';
    if (item.type === 'html' || item.ext === 'html') return 'var(--success)';
    if (item.type === 'image' || item.ext === 'img') return 'var(--primary)';
    return 'var(--text-muted)';
  };

  return (
    <div className="page-fade design-manager-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Design Manager</h1>
          <p className="page-subtitle">Manage themes, templates, and assets</p>
        </div>
        <div className="design-manager-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => showToast('Creating a new folder...')}>
            <i className="fa fa-folder-plus"/> New Folder
          </button>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <i className="fa fa-file-plus"/> Create File
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".css,.js,.jsx,.ts,.tsx,.html,.htm,.png,.jpg,.jpeg,.gif,.svg,.webp,.pdf,.txt"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      <div className="design-manager-layout">
        
        {/* Sidebar */}
        <div className="card design-manager-sidebar">
          <h3 className="design-manager-sidebar-title">File Browser</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div className="design-manager-root-node">
              <i className="fa fa-folder-open" style={{ color: 'var(--warning)' }}></i> Root
            </div>
            
            <div className="design-manager-tree">
              {files.filter(f => f.type === 'folder').map(folder => (
                <div key={folder.id} className="design-manager-tree-node">
                  <i className="fa fa-folder" style={{ color: 'var(--warning)' }}></i> {folder.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="card design-manager-main">
          <div className="card-toolbar design-manager-toolbar" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
            <div className="search-box">
              <i className="fa fa-search"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files…"/>
            </div>
            <div className="design-manager-view-toggle">
              <button 
                className={`btn-icon ${view === 'list' ? 'active' : ''}`} 
                onClick={() => setView('list')}
                style={{ background: view === 'list' ? 'var(--bg-hover)' : 'transparent' }}
              >
                <i className="fa fa-list"></i>
              </button>
              <button 
                className={`btn-icon ${view === 'grid' ? 'active' : ''}`} 
                onClick={() => setView('grid')}
                style={{ background: view === 'grid' ? 'var(--bg-hover)' : 'transparent' }}
              >
                <i className="fa fa-th-large"></i>
              </button>
            </div>
          </div>

          <div className="design-manager-content">
            {view === 'list' ? (
              <div className="table-container">
<table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size/Items</th>
                    <th>Last Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(f => (
                    <tr key={f.id} style={{ cursor: 'pointer' }} className="hover-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <i className={`fa ${getIcon(f)}`} style={{ color: getIconColor(f), fontSize: '18px' }}></i>
                          <span className="fw-500">{f.name}</span>
                        </div>
                      </td>
                      <td className="txt-muted">{f.type === 'folder' ? `${f.items} items` : f.size}</td>
                      <td className="txt-sm txt-muted">{f.lastModified}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => openRename(f)}><i className="fa fa-pencil"/></button>
                          <button className="btn-icon" onClick={() => setDetailsTarget(f)}><i className="fa fa-ellipsis-v"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            ) : (
              <div className="design-manager-grid">
                {filtered.map(f => (
                  <div key={f.id} className="design-manager-grid-item hover-card">
                    <i className={`fa ${getIcon(f)}`} style={{ color: getIconColor(f), fontSize: '48px', marginBottom: '15px' }}></i>
                    <div className="fw-500" style={{ wordBreak: 'break-all' }}>{f.name}</div>
                    <div className="txt-sm txt-muted" style={{ marginTop: '5px' }}>
                      {f.type === 'folder' ? `${f.items} items` : f.size}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!filtered.length && (
              <div className="empty-state" style={{ marginTop: '40px' }}>
                <i className="fa fa-folder-open"/><br/>No files or folders found
              </div>
            )}
          </div>
        </div>
      </div>

      {renameTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeRename(); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename {renameTarget.type === 'folder' ? 'Folder' : 'File'}</h3>
              <button className="modal-close" onClick={closeRename}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Enter a name"
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={closeRename}>Cancel</button>
              <button className="btn-primary" onClick={saveRename}>
                <i className="fa fa-save"></i> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsTarget && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setDetailsTarget(null); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{detailsTarget.name}</h3>
              <button className="modal-close" onClick={() => setDetailsTarget(null)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div className="txt-sm txt-muted">Type</div>
                  <div className="fw-500">{detailsTarget.type === 'folder' ? 'Folder' : detailsTarget.type || detailsTarget.ext || 'File'}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div className="txt-sm txt-muted">{detailsTarget.type === 'folder' ? 'Items' : 'Size'}</div>
                  <div className="fw-500">{detailsTarget.type === 'folder' ? `${detailsTarget.items || 0} items` : detailsTarget.size || 'N/A'}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div className="txt-sm txt-muted">Last Modified</div>
                  <div className="fw-500">{detailsTarget.lastModified || 'N/A'}</div>
                </div>
                <div className="card" style={{ padding: 12 }}>
                  <div className="txt-sm txt-muted">Source</div>
                  <div className="fw-500">{detailsTarget.apiId ? 'Saved to API' : 'Local workspace'}</div>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDetailsTarget(null)}>Close</button>
              <button className="btn-primary" onClick={() => { setDetailsTarget(null); openRename(detailsTarget); }}>
                <i className="fa fa-pen"></i> Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
