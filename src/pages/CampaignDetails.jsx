import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketing } from '../../context/MarketingContext';

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCampaign, deleteCampaign } = useMarketing();
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const data = getCampaign(id);
    if (data) {
      setCampaign(data);
    } else {
      navigate('/marketing/campaigns');
    }
  }, [id, getCampaign, navigate]);

  if (!campaign) return null;

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

  const handleDelete = () => {
    if(window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
      navigate('/marketing/campaigns');
    }
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-icon" onClick={() => navigate('/marketing/campaigns')} title="Back to List" style={{ padding: '6px' }}>
              <i className="fa fa-arrow-left"></i>
            </button>
            {campaign.name}
          </div>
          <div className="page-subtitle">Campaign Details</div>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={handleDelete} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            <i className="fa fa-trash"></i> Delete
          </button>
          <button className="btn-primary" onClick={() => navigate('/marketing/campaigns')}>
            <i className="fa fa-check"></i> Done
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)' }}>
        {/* Left Column - Metadata */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Overview</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Status</label>
                <span className={`badge-status badge-${campaign.status?.toLowerCase().replace(' ', '-') || 'draft'}`}>{campaign.status || 'Draft'}</span>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Type</label>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontWeight: '500' }}>
                   <i className={`fa ${getIcon(campaign.type)}`} style={{ color: 'var(--primary)' }}/>
                   <span>{getLabel(campaign.type)}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Created On</label>
                <div style={{ fontWeight: '500' }}>{campaign.createdDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Description & Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Description</div>
            </div>
            <div className="card-body">
              {campaign.description ? (
                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{campaign.description}</p>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided for this campaign.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><i className="fa fa-chart-line" style={{ color: 'var(--accent)' }}></i> Performance Snapshot</div>
            </div>
            <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              Data collection for this campaign is pending. Check back once the campaign has been active.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
