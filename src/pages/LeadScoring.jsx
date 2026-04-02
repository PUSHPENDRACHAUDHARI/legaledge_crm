import React, { useState, useEffect } from 'react';
import { marketingLeadScoringAPI } from '../services/api';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

export default function LeadScoringPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ruleName: '', criteria: '', condition: 'Equals', points: '', status: 'Active' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingLeadScoringAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load lead scoring rules from API:', err.message);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!formData.ruleName.trim()) return;
    const newItem = {
      ...formData,
      id: Date.now().toString(),
      createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    try {
      const created = await marketingLeadScoringAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save lead scoring rule to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    setFormData({ ruleName: '', criteria: '', condition: 'Equals', points: '', status: 'Active' });
    setShowForm(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Lead Scoring</div>
          <div className="page-subtitle">Automatically score and prioritize leads based on engagement, behavior, and conversion potential.</div>
        </div>
        <div className="page-actions">
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <i className="fa fa-plus"></i> Create Score Rule
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Create Score Rule</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Rule Name <span className="required">*</span></label>
              <input 
                className="form-control" 
                value={formData.ruleName} 
                onChange={e => setFormData({...formData, ruleName: e.target.value})} 
                placeholder="e.g. C-Level Executive Boost" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property Evaluated</label>
                <input 
                  className="form-control" 
                  value={formData.criteria} 
                  onChange={e => setFormData({...formData, criteria: e.target.value})} 
                  placeholder="e.g. Job Title" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-control" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                  <option>Equals</option>
                  <option>Contains</option>
                  <option>Greater Than</option>
                  <option>Less Than</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Points to Add</label>
                <input 
                  className="form-control" 
                  type="number"
                  value={formData.points} 
                  onChange={e => setFormData({...formData, points: e.target.value})} 
                  placeholder="e.g. 10" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Save Rule</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm && (
            <>
              <div style={{ padding: '5px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '0' }}>
                <div style={{ maxWidth: '600px' }}>
                  <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-1px' }}>Prioritize and qualify your leads with Lead Scoring</h1>
                  <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.5', marginBottom: '20px', textAlign: 'justify' }}>
                    Understand your leads' digital body language with fit and engagement scores, help shorten sales cycles and drive more conversions.
                  </p>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', textAlign: 'justify' }}>
                    Unlock this and more with Marketing Hub Professional.
                  </p>
                </div>
              </div>

              <div style={{ padding: '8px 20px 40px', display: 'flex', flexWrap: 'wrap-reverse', gap: '40px', alignItems: 'center' }}>
                <div style={{ flex: '1 1 350px' }}>
                   <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <div style={{ background: '#14b8a6', padding: '10px 16px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '12px', fontWeight: '600' }}>Stephen Smith - Lead score history</span>
                         <i className="fa fa-times" style={{ fontSize: '10px' }}></i>
                      </div>
                      <div style={{ padding: '20px' }}>
                         <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Intent Score for America: 90</div>
                         <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                            {[30, 50, 40, 70, 60, 95].map((h, i) => (
                              <div key={i} style={{ flex: 1, height: `${h}%`, background: '#14b8a6', opacity: 0.15 + (i*0.15), borderRadius: '2px 2px 0 0', position: 'relative' }}>
                                {i === 5 && <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '8px', height: '8px', background: '#14b8a6', borderRadius: '50%', border: '2px solid #fff' }}></div>}
                              </div>
                            ))}
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#94a3b8', fontSize: '9px', fontWeight: '600' }}>
                            <span>MAY 2024</span>
                            <span>JUL 2024</span>
                            <span>SEP 2024</span>
                            <span>NOV 2024</span>
                         </div>
                         <div style={{ marginTop: '24px' }}>
                             <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Score history</div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                                <div>Score</div>
                                <div>Change</div>
                                <div>Event</div>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '12px', color: '#1e293b' }}>
                                <div style={{ fontWeight: '700' }}>90</div>
                                <div style={{ color: '#14b8a6', fontWeight: '700' }}>+30</div>
                                <div style={{ color: '#64748b' }}>Contact Enrolled in workflow</div>
                             </div>
                         </div>
                      </div>
                   </div>
                </div>
                <div style={{ flex: '1 1 400px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', letterSpacing: '-0.3px' }}>Track lead scores with complete transparency</h2>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '16px', textAlign: 'justify' }}>
                    Easily view a contact's lead score right on their CRM record with the contact score card and score history panel. This feature gives you a detailed overview of the lead's score history and recent activities that influenced their score, making it simple for both marketers and salespeople to stay aligned.
                  </p>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', textAlign: 'justify' }}>
                    Effectively sharing valuable leads between Marketing and Sales is essential for your success. Now, with a clear view of how scores evolve over time and what actions drove those changes, Sales can fully trust the scores provided by Marketing. Whether it's tracking a contact's score across different models or understanding the specific actions that led to a score increase, like downloading a case study, you can confidently tailor your outreach to meet your leads exactly where they are in their journey.
                  </p>
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
                    <th>Condition Group</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.ruleName}</b></td>
                      <td>{item.criteria} {item.condition}</td>
                      <td><b style={{ color: 'var(--success)' }}>+{item.points}</b></td>
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
