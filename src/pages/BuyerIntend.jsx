import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { marketingBuyerIntentAPI } from '../services/api';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

export default function BuyerIntentPage() {
  const { showToast } = useCRM();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', trigger: 'Website Visit', score: '', status: 'Active' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingBuyerIntentAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load buyer intent data from API:', err.message);
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
      const created = await marketingBuyerIntentAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save buyer intent record to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    setFormData({ name: '', trigger: 'Website Visit', score: '', status: 'Active' });
    setShowForm(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Buyer Intent</div>
          <div className="page-subtitle">Track customer behavior and identify prospects showing strong intent to purchase your services.</div>
        </div>
        <div className="page-actions">
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <i className="fa fa-plus"></i> Add Intent Rule
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Add Intent Tracker</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Tracker Name <span className="required">*</span></label>
              <input 
                className="form-control" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Pricing Page Views" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Intent Trigger</label>
                <select className="form-control" value={formData.trigger} onChange={e => setFormData({...formData, trigger: e.target.value})}>
                  <option>Website Visit</option>
                  <option>Email Click</option>
                  <option>Form Submission</option>
                  <option>Content Download</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Score Applied</label>
              <input 
                className="form-control" 
                type="number"
                value={formData.score} 
                onChange={e => setFormData({...formData, score: e.target.value})} 
                placeholder="e.g. 15" 
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Save Signal</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm && (
            <>
              <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '4px', letterSpacing: '-0.3px' }}>In-market opportunities (last 30 days)</h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Companies in your target market that are showing intent</p>
                </div>
                <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0L14.85 9.15L24 12L14.85 14.85L12 24L9.15 14.85L0 12L9.15 9.15L12 0Z" fill="#ff7a59" />
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', letterSpacing: '-0.3px' }}>Finish setting up Buyer Intent</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', lineHeight: '1.5', margin: '0 auto' }}>
                    Complete your setup in order to see your market opportunities of high-fit companies showing intent.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Research Intent Topics</h2>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                    Find companies researching the topics that matter most to your business. Any company that shows a match for researching any of these topics, whether in your CRM or not, will be populated in the Research tab.
                  </p>
                </div>
                
                <div className="card" style={{ flex: '2 1 500px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Research Intent Topics</h3>
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>9</span>
                    </div>
                    <button
                      style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        setShowForm(true);
                        showToast('Research intent topics are ready to edit.', 'info');
                      }}
                    >
                      <i className="fa fa-pencil"></i> Edit research intent topics
                    </button>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0 24px' }}>
                    {[
                      { topic: 'business growth', count: '213,121' },
                      { topic: 'custom solutions', count: '19,034' },
                      { topic: 'digital marketing', count: '194,667' },
                      { topic: 'digital solutions', count: '33,493' },
                      { topic: 'high quality services', count: '606' },
                      { topic: 'innovative technology', count: '56,538' }
                    ].map((item, idx, arr) => (
                      <div key={idx} style={{ padding: '16px 0', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#1e293b', fontWeight: '500', fontSize: '15px' }}>{item.topic}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                          <i className="fa fa-building-o"></i> {item.count} companies
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Intent Trigger</th>
                    <th>Score Applied</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.trigger}</td>
                      <td><b style={{ color: 'var(--success)' }}>+{item.score}</b></td>
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
