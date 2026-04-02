import React, { useState, useEffect } from 'react';
import { marketingFormsAPI } from '../services/api';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

export default function FormsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const EMPTY_FORM = { 
    name: '', 
    type: 'Lead Capture', 
    status: 'Active',
    linkedCampaign: '— None —',
    targetAudience: '— Select —',
    afterSubmission: 'Show Thank-You Message',
    owner: '',
    notes: '',
    gdprConsent: true,
    recaptcha: false,
    emailNotif: true
  };
  
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingFormsAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load forms from API:', err.message);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    const newItem = {
      ...formData,
      id: Date.now().toString(),
      createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    try {
      const created = await marketingFormsAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save form to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    setFormData(EMPTY_FORM);
    setShowForm(false);
  };

  const setF = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Forms</div>
          <div className="page-subtitle">Create and manage forms to capture leads, customer data, and inquiries across your platform.</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <i className="fa fa-plus"></i> Create Form
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay show" style={{ zIndex: 10000 }}>
          <div className="modal detailed-compose-modal" style={{ maxWidth: '650px' }}>
            <div className="modal-header" style={{ padding: '20px 24px', border: 'none', background: 'transparent' }}>
              <h3 style={{ fontSize: '20px', color: '#1e293b' }}>Create New Form</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            
            <div className="detailed-compose-body" style={{ padding: '0 24px 20px', overflowY: 'auto', maxHeight: '75vh' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>FORM NAME *</label>
                <input 
                  className="form-control" 
                  value={formData.name} 
                  onChange={e => setF('name', e.target.value)} 
                  placeholder="e.g. Demo Request" 
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>FORM TYPE</label>
                  <select className="form-control" value={formData.type} onChange={e => setF('type', e.target.value)}>
                    <option>Lead Capture</option>
                    <option>Contact Us</option>
                    <option>Registration</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>STATUS</label>
                  <select className="form-control" value={formData.status} onChange={e => setF('status', e.target.value)}>
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>LINKED CAMPAIGN</label>
                  <select className="form-control" value={formData.linkedCampaign} onChange={e => setF('linkedCampaign', e.target.value)}>
                    <option>— None —</option>
                    <option>Q1 Campaign</option>
                    <option>Growth Drive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>TARGET AUDIENCE</label>
                  <select className="form-control" value={formData.targetAudience} onChange={e => setF('targetAudience', e.target.value)}>
                    <option>— Select —</option>
                    <option>B2B</option>
                    <option>B2C</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>AFTER SUBMISSION</label>
                  <select className="form-control" value={formData.afterSubmission} onChange={e => setF('afterSubmission', e.target.value)}>
                    <option>Show Thank-You Message</option>
                    <option>Redirect to URL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#475569', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>FORM OWNER</label>
                  <input 
                    className="form-control" 
                    value={formData.owner} 
                    onChange={e => setF('owner', e.target.value)} 
                    placeholder="Assigned team member"
                  />
                </div>
              </div>

            </div>

            <div className="form-actions" style={{ border: 'none', padding: '0 24px 24px', background: 'transparent' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)} style={{ borderRadius: '6px', padding: '10px 24px', fontSize: '14px' }}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleSave} 
                style={{ background: '#0f172a', color: '#fff', borderRadius: '6px', padding: '10px 24px', fontSize: '14px', border: 'none' }}
                disabled={!formData.name}
              >
                <i className="fa fa-check" style={{ fontSize: '12px', marginRight: '8px' }} /> Save Form
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm && (
            <div className="card" style={{ padding: '40px 20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '30px', justifyContent: 'center' }}>
                <div style={{ flex: '1 1 450px', maxWidth: '600px' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', marginBottom: '24px', lineHeight: '1.2' }}>
                    Capture even more quality leads with high-converting, smart forms
                  </h1>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ fontSize: '18px', color: '#94a3b8', marginTop: '2px' }}><i className="fa fa-arrow-right"></i></div>
                      <div>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                          <strong style={{ color: '#1e293b' }}>Drive engagement</strong> by designing forms your visitors want to fill out. Create multi-step forms in minutes using the drag-and-drop builder, then add your brand kits for styling.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ fontSize: '18px', color: '#94a3b8', marginTop: '2px' }}><i className="fa fa-arrow-right"></i></div>
                      <div>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                          <strong style={{ color: '#1e293b' }}>Qualify more leads faster</strong> by asking the right questions. Personalize your form with conditional logic and show, hide or skip questions based on your visitor's answers.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ fontSize: '18px', color: '#94a3b8', marginTop: '2px' }}><i className="fa fa-arrow-right"></i></div>
                      <div>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
                          <strong style={{ color: '#1e293b' }}>Boost conversion</strong> by streamlining form completion. Form shortening AI gives the data for you through enrichment - no need to ask your visitors for it!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: '0 1 300px', display: 'flex', justifyContent: 'center', minWidth: '280px' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '280px', padding: '20px 0' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '50%', width: '190px', height: '190px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}></div>
                    <div style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '12px', borderRadius: '10px', boxShadow: '0 15px 35px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                      <div style={{ marginBottom: '10px', borderBottom: '2px solid #ff7a59', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#ff7a59', borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', width: '40px', background: '#cbd5e1', borderRadius: '2px' }}></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ height: '26px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                          <div style={{ height: '3px', width: '40px', background: '#e2e8f0', borderRadius: '1.5px' }}></div>
                        </div>
                        <div style={{ height: '26px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                          <div style={{ height: '3px', width: '60px', background: '#e2e8f0', borderRadius: '1.5px' }}></div>
                        </div>
                        <div style={{ height: '26px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                          <div style={{ height: '3px', width: '30px', background: '#e2e8f0', borderRadius: '1.5px' }}></div>
                        </div>
                        <div style={{ height: '34px', background: '#ff7a59', borderRadius: '4px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <div style={{ height: '4px', width: '40px', background: '#fff', opacity: 0.5, borderRadius: '2px' }}></div>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '28px', height: '28px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)' }}>
                        <i className="fa fa-check"></i>
                      </div>
                      <i className="fa fa-mouse-pointer" style={{ position: 'absolute', top: '70%', right: '20%', fontSize: '18px', color: '#1e293b', textShadow: '0 2px 5px rgba(0,0,0,0.2)' }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Form Name</th>
                    <th>Form Type</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.type}</td>
                      <td><span className={`badge-status badge-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                      <td>{item.owner || '-'}</td>
                      <td>{item.createdDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
