import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketing } from '../../context/MarketingContext';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { campaigns, addCampaign } = useMarketing();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'campaigns', description: '', status: 'Active' });

  const getIcon = (type) => {
    switch(type) {
      case 'events': return 'fa-calendar-alt';
      case 'forms': return 'fa-file-alt';
      case 'ads': return 'fa-ad';
      case 'email': return 'fa-envelope-open-text';
      case 'social': return 'fa-share-alt';
      case 'lead-scoring': return 'fa-star';
      case 'buyer-intent': return 'fa-brain';
      default: return 'fa-bullhorn';
    }
  };

  const getLabel = (type) => {
     if(!type) return 'Campaign';
     return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    addCampaign(formData);

    setFormData({ name: '', type: 'campaigns', description: '', status: 'Active' });
    setShowForm(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Campaigns</div>
          <div className="page-subtitle">Plan and manage multi-channel marketing campaigns, track performance, and measure results.</div>
        </div>
        <div className="page-actions">
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <i className="fa fa-plus"></i> Create Campaign
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Create New Campaign</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Campaign Name <span className="required">*</span></label>
              <input 
                className="form-control" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Q4 Master Project" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Campaign Type</label>
                <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="campaigns">General Tracker</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                  <option value="ads">Paid Ads</option>
                  <option value="events">Event / Webinar</option>
                  <option value="forms">Lead Capture Form</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Paused</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Goal / Description</label>
              <textarea 
                className="form-control" 
                rows={3}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="What is the objective of this campaign?" 
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Save Campaign</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {campaigns.length === 0 ? (
          !showForm && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '32px', color: 'var(--border-color)', marginBottom: '16px' }}>
                  <i className="fa fa-bullhorn"></i>
                </div>
                <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No campaigns found</h3>
              </div>
            </div>
          )
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(camp => (
                    <tr key={camp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/marketing/campaigns/${camp.id}`)}>
                      <td><b>{camp.name}</b></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                           <i className={`fa ${getIcon(camp.type)}`} style={{ color: 'var(--primary)' }}/>
                           <span>{getLabel(camp.type)}</span>
                        </div>
                      </td>
                      <td><span className={`badge-status badge-${camp.status?.toLowerCase().replace(' ', '-') || 'draft'}`}>{camp.status || 'Draft'}</span></td>
                      <td>{camp.createdDate}</td>
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
