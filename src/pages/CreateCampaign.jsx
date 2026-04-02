import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMarketing } from '../../context/MarketingContext';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addCampaign } = useMarketing();
  
  const [formData, setFormData] = useState({
    name: '',
    type: searchParams.get('type') || 'campaigns',
    description: '',
    status: 'Draft'
  });

  const [errors, setErrors] = useState({});

  const handleSave = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addCampaign(formData);
    navigate('/marketing/campaigns');
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Create Campaign</div>
          <div className="page-subtitle">Set up a new marketing initiative</div>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <i className="fa fa-check"></i> Save Campaign
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'block', maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="fa fa-bullhorn" style={{ color: 'var(--primary)' }}></i> Campaign Details</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Campaign Name <span className="required">*</span></label>
              <input 
                className={`form-control ${errors.name ? 'is-err' : ''}`} 
                value={formData.name} 
                onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  if(errors.name) setErrors({...errors, name: false});
                }} 
                placeholder="e.g. Q4 Holiday Promo" 
              />
              {errors.name && <small style={{ color: 'var(--danger)', marginTop: '4px', display: 'block' }}>Name is required</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Campaign Type</label>
                <select className="form-control" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="campaigns">General Campaign</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                  <option value="ads">Paid Ads</option>
                  <option value="events">Event / Webinar</option>
                  <option value="forms">Lead Capture Form</option>
                  <option value="lead-scoring">Lead Scoring Rule</option>
                  <option value="buyer-intent">Buyer Intent Signal</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Paused</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                rows={4} 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="What is the goal of this campaign?" 
              />
            </div>

            <div className="form-actions" style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Create Campaign</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
