export default function DeleteConfirm({ title = 'Confirm Delete', message = 'Are you sure you want to delete this record? This action cannot be undone.', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay show" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa fa-exclamation-triangle"></i> {title}
          </h3>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ marginBottom: 24, color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={onCancel}><i className="fa fa-times"></i> Cancel</button>
            <button className="btn-danger" onClick={onConfirm}><i className="fa fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
