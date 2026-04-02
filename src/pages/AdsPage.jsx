import React, { useState, useEffect } from 'react';
import { marketingAdsAPI } from '../services/api';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

export default function AdsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', platform: 'Google Ads', budget: '', status: 'Paused' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingAdsAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load ads from API:', err.message);
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
      const created = await marketingAdsAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save ad campaign to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    setFormData({ name: '', platform: 'Google Ads', budget: '', status: 'Paused' });
    setShowForm(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Ads</div>
          <div className="page-subtitle">Manage and track advertising campaigns across platforms to generate leads and drive conversions.</div>
        </div>
        <div className="page-actions">
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <i className="fa fa-plus"></i> Create Ad Campaign
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Create New Ad Campaign</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Ad Name <span className="required">*</span></label>
              <input 
                className="form-control" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Q4 Remarketing" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select className="form-control" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                  <option>Google Ads</option>
                  <option>LinkedIn Ads</option>
                  <option>Facebook Ads</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input 
                className="form-control" 
                type="number"
                value={formData.budget} 
                onChange={e => setFormData({...formData, budget: e.target.value})} 
                placeholder="e.g. 5000" 
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Save Ad Object</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm && (
            <div className="card" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
              <div style={{ marginBottom: '20px', color: '#1e293b' }}>
                <i className="fa fa-exclamation-triangle" style={{ fontSize: '48px' }}></i>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                It looks like you're using an ad blocker
              </h1>
              <p style={{ fontSize: '15px', color: '#475569', maxWidth: '600px', lineHeight: '1.4', margin: '0 auto' }}>
                Legaledge ads may not work properly when you have an ad blocker. Please disable it and you'll be on your way.
              </p>
            </div>
          )
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ad Name</th>
                    <th>Platform</th>
                    <th>Budget</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.platform}</td>
                      <td>{item.budget ? `$${item.budget}` : '-'}</td>
                      <td><span className={`badge-status badge-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
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
