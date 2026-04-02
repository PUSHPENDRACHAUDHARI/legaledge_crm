import React from 'react';
import { useCRM } from '../context/CRMContext';

/**
 * DataModal – reusable import/export modal
 *
 * Props:
 *   isOpen      {boolean}  – controls visibility
 *   onClose     {function} – called when modal is dismissed
 *   title       {string}   – modal title (e.g. "Import Contacts")
 *   children    {node}     – custom body content; if omitted a default UI is shown
 *   type        {string}   – 'Import' | 'Export' (used for default body)
 *   recordType  {string}   – e.g. 'Contacts' (used for default body labels)
 */
export default function DataModal({
  isOpen,
  onClose,
  title,
  children,
  type = 'Import',
  recordType = 'Records',
}) {
  const { showToast } = useCRM();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay show"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: 16,
      }}
    >
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17 }}>
            {title || `${type} ${recordType}`}
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            style={{ fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          ><i className="fa fa-times" /></button>
        </div>

        {/* Body */}
        <div className="form-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {children ? children : (
            type === 'Import' ? (
              <>
                {/* Drop zone */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '32px 20px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: 8,
                    marginBottom: 20,
                    background: 'var(--bg-hover)',
                  }}
                >
                  <i
                    className="fa fa-cloud-upload-alt"
                    style={{ fontSize: 48, color: 'var(--primary)', marginBottom: 12, display: 'block' }}
                  />
                  <h4 style={{ margin: '0 0 8px' }}>Drag &amp; drop your file here</h4>
                  <p className="txt-muted txt-sm" style={{ margin: '0 0 16px' }}>
                    Supports .csv, .xls, .xlsx – max 10 MB
                  </p>
                  <button className="btn-secondary" onClick={() => showToast(`Select a ${recordType.toLowerCase()} file to continue.`, 'info')}>Browse Files</button>
                </div>

                <div className="form-group">
                  <label className="form-label">Encoding Format</label>
                  <select className="form-control">
                    <option>Detect Automatically</option>
                    <option>UTF-8</option>
                    <option>ISO-8859-1</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="updateExisting" />
                  <label htmlFor="updateExisting" className="form-label" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                    Update existing {recordType.toLowerCase()} using email / ID match
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Export Format</label>
                  <select className="form-control">
                    <option>CSV (Comma-separated values)</option>
                    <option>XLSX (Excel)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Properties to Export</label>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
                      <input type="radio" name="props" defaultChecked /> All properties
                    </label>
                    <label style={{ display: 'flex', gap: 10, cursor: 'pointer' }}>
                      <input type="radio" name="props" /> Only visible table columns
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Records to Export</label>
                  <p className="txt-muted txt-sm">All {recordType.toLowerCase()} matching your current filters.</p>
                </div>
              </>
            )
          )}
        </div>

        {/* Footer */}
        <div
          className="form-actions"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>
            {type === 'Import' ? 'Next: Map Columns' : 'Download File'}
          </button>
        </div>
      </div>
    </div>
  );
}
