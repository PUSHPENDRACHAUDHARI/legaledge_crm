import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

const INITIAL_RULES = [
  { id: 1, name: 'New Lead Welcome Email', trigger: 'Lead Created', action: 'Send Email', status: 'Active', runs: 24 },
  { id: 2, name: 'Deal Stage Change Task', trigger: 'Deal Stage Updated', action: 'Create Task', status: 'Active', runs: 15 },
  { id: 3, name: 'High Priority Lead Alert', trigger: 'Lead Temperature = Hot', action: 'Notify Owner', status: 'Active', runs: 8 },
  { id: 4, name: 'Inactive Contact Follow-up', trigger: 'No Activity 30 Days', action: 'Create Task', status: 'Paused', runs: 0 },
];

export default function Automation() {
  const { showToast } = useCRM();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState({});

  function toggleRule(id) {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r));
    showToast('Workflow toggled!');
  }

  function deleteRule(id) {
    if (!window.confirm('Delete this workflow?')) return;
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('Workflow deleted');
  }

  const openCreate = () => {
    setForm({ name: '', trigger: 'Lead Created', action: 'Send Email', status: 'Active' });
    setErr({});
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setForm(r);
    setErr({});
    setModalOpen(true);
  };

  const handleSave = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (Object.keys(e).length) return setErr(e);
    if (form.id) {
      setRules(rules.map(r => r.id === form.id ? form : r));
      showToast('Workflow updated!');
    } else {
      setRules([...rules, { ...form, id: Date.now(), runs: 0 }]);
      showToast('Workflow created!');
    }
    setModalOpen(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="fa fa-gears" style={{ color: 'var(--primary)', marginRight: 8 }} />Automation</h1>
          <p className="page-subtitle">Automate repetitive tasks and workflows</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={openCreate}><i className="fa fa-plus" /> Create Workflow</button>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr><th>Workflow Name</th><th>Trigger</th><th>Action</th><th>Status</th><th>Times Run</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td><div className="fw-600">{r.name}</div></td>
                  <td>{r.trigger}</td>
                  <td>{r.action}</td>
                  <td><span className={`badge badge-${r.status === 'Active' ? 'success' : 'secondary'}`}>{r.status}</span></td>
                  <td className="fw-500">{r.runs}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(r)}><i className="fa fa-pen" /></button>
                      <button className="btn-icon" title={r.status === 'Active' ? 'Pause' : 'Activate'} onClick={() => toggleRule(r.id)}><i className="fa fa-power-off" /></button>
                      <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => deleteRule(r.id)}><i className="fa fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rules.length && <tr><td colSpan={6} className="empty-state"><i className="fa fa-gears" /><br />No workflows found</td></tr>}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {modalOpen && form && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Workflow' : 'Create Workflow'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Workflow Name <span className="required">*</span></label>
                <input className={`form-control${err.name ? ' is-err' : ''}`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Trigger</label>
                  <select className="form-control" value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}>
                    <option>Lead Created</option>
                    <option>Deal Stage Updated</option>
                    <option>Lead Temperature = Hot</option>
                    <option>No Activity 30 Days</option>
                    <option>Form Submitted</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Action</label>
                  <select className="form-control" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                    <option>Send Email</option>
                    <option>Create Task</option>
                    <option>Notify Owner</option>
                    <option>Update Record</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Paused</option>
                </select>
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
