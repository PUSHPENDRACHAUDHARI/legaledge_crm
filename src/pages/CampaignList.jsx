import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketing } from '../../context/MarketingContext';

export default function CampaignList() {
  const navigate = useNavigate();
  const { campaigns } = useMarketing();

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

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">All Campaigns</div>
          <div className="page-subtitle">Track and manage your marketing activities</div>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={() => navigate('/marketing')}>
            <i className="fa fa-arrow-left"></i> Back to Dashboard
          </button>
          <button className="btn-primary" onClick={() => navigate('/marketing/create')}>
            <i className="fa fa-plus"></i> Create Campaign
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {campaigns.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', color: 'var(--border-color)', marginBottom: '16px' }}>
                <i className="fa fa-bullhorn"></i>
              </div>
              <h3 style={{ marginBottom: '8px' }}>No campaigns found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                You haven't created any campaigns yet. Click the button above to get started.
              </p>
              <button className="btn-primary" onClick={() => navigate('/marketing/create')}>
                <i className="fa fa-plus"></i> Create Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Description</th>
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
                      <td><span style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{camp.description || 'No description provided.'}</span></td>
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
