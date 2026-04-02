import React, { useState, useEffect } from 'react';
import { marketingEventsAPI } from '../services/api';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

export default function MarketingEventsPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const EMPTY_FORM = { 
    name: '', 
    description: '',
    type: '',
    startDate: '', 
    startTime: '',
    endDate: '', 
    endTime: '',
    organizer: '',
    status: 'Upcoming',
    location: 'Virtual'
  };
  
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingEventsAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load events from API:', err.message);
      }
    };
    load();
  }, []);

  const handleSave = async (addAnother = false) => {
    if (!formData.name.trim()) return;
    
    const newItem = {
      ...formData,
      id: Date.now().toString(),
      createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    
    try {
      const created = await marketingEventsAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save event to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    if (addAnother) {
      setFormData(EMPTY_FORM);
    } else {
      setFormData(EMPTY_FORM);
      setShowForm(false);
    }
  };

  const setNow = (field) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    
    if (field === 'start') {
      setFormData(prev => ({ ...prev, startDate: date, startTime: time }));
    } else {
      setFormData(prev => ({ ...prev, endDate: date, endTime: time }));
    }
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Events</div>
          <div className="page-subtitle">Plan, manage, and track webinars, meetings, and marketing events to engage your audience.</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <i className="fa fa-plus"></i> Create Event
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay show" style={{ zIndex: 10000 }}>
          <div className="modal detailed-compose-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create Marketing event</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            
            <div className="detailed-compose-body" style={{ maxHeight: '70vh' }}>
              <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                <a href="#" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none' }}>Edit this form <i className="fa fa-external-link" /></a>
              </div>

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input 
                  className="form-control" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Event name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  className="form-control" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Description"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <input 
                  className="form-control" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  placeholder="Type"
                />
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label className="form-label">Start date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.startTime} 
                    onChange={e => setFormData({...formData, startTime: e.target.value})} 
                    style={{ flex: 1 }}
                  />
                  <button className="btn-secondary" onClick={() => setNow('start')} style={{ whiteSpace: 'nowrap' }}>Now</button>
                </div>
                <button className="btn-link" onClick={() => setFormData({...formData, startDate: '', startTime: ''})} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px 0', cursor: 'pointer' }}>Clear</button>
              </div>

              {/* End Date */}
              <div className="form-group">
                <label className="form-label">End date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="time" 
                    className="form-control" 
                    value={formData.endTime} 
                    onChange={e => setFormData({...formData, endTime: e.target.value})} 
                    style={{ flex: 1 }}
                  />
                  <button className="btn-secondary" onClick={() => setNow('end')} style={{ whiteSpace: 'nowrap' }}>Now</button>
                </div>
                <button className="btn-link" onClick={() => setFormData({...formData, endDate: '', endTime: ''})} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px 0', cursor: 'pointer' }}>Clear</button>
              </div>

              <div className="form-group">
                <label className="form-label">Organizer</label>
                <input 
                  className="form-control" 
                  value={formData.organizer} 
                  onChange={e => setFormData({...formData, organizer: e.target.value})} 
                  placeholder="Organizer"
                />
              </div>

            </div>

            <div className="form-actions">
              <button 
                className="btn-primary" 
                style={{ background: '#e2e8f0', color: '#64748b', border: 'none' }}
                onClick={() => handleSave(false)}
                disabled={!formData.name}
              >
                Create
              </button>
              <button className="btn-secondary" onClick={() => handleSave(true)}>Create and add another</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm && (
            <>
              <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '32px', padding: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 500px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', letterSpacing: '-0.4px' }}>See all of your marketing events in one place</h2>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ width: '24px', height: '24px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <i className="fa fa-arrow-right" style={{ fontSize: '11px' }}></i>
                      </div>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                        Track and analyze data from your events to optimize your marketing efforts and event strategy.
                      </p>
                    </div>
                    <div className="header-actions">
                      <div style={{ width: '24px', height: '24px', background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <i className="fa fa-arrow-right" style={{ fontSize: '11px' }}></i>
                      </div>
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                        For integrated Marketing Events, check the <strong style={{ color: '#1e293b' }}>Connected apps</strong> page to make sure your event app(s) are syncing data.
                      </p>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '180px', height: '140px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100px', height: '70px', background: '#fff', border: '2px solid #e2e8f0', borderRadius: '4px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ width: '50px', height: '5px', background: '#f1f5f9', margin: '12px 10px 5px' }}></div>
                        <div style={{ width: '70px', height: '4px', background: '#f8fafc', margin: '0 10px 4px' }}></div>
                        <div style={{ width: '60px', height: '4px', background: '#f8fafc', margin: '0 10px' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '50%' }}></div>
                          <div style={{ width: '16px', height: '16px', background: '#6366f1', borderRadius: '3px 3px 0 0', marginTop: '2px' }}></div>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: '15px', left: '30px', display: 'flex', gap: '6px' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - i * 0.2 }}>
                            <div style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%' }}></div>
                            <div style={{ width: '14px', height: '12px', background: '#cbd5e1', borderRadius: '3px 3px 0 0', marginTop: '2px' }}></div>
                          </div>
                        ))}
                      </div>
                      <div style={{ position: 'absolute', top: '20px', right: '30px', width: '30px', height: '30px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa fa-line-chart" style={{ fontSize: '14px', color: '#6366f1' }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Your Marketing event with</h3>
                </div>

                <div style={{ padding: '24px 20px', overflowX: 'auto', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content', paddingBottom: '16px' }}>
                    {[
                      { name: 'Eventbrite', by: 'Legaledge', installs: '17K', desc: 'Use Eventbrite data for email lists, workflows, and more in Legaledge.', color: '#ff7a59', icon: 'e', videoId: 'oeUP65lDuCY' },
                      { name: 'GoToWebinar', by: 'Legaledge', installs: '6K', desc: 'Seamlessly sync webinar data between Legaledge and GoToWebinar.', color: '#0ea5e9', icon: 'fa-snowflake-o', videoId: 'dh501g6zSJE' },
                      { name: 'Events by SimpleEvents.io', by: 'Legaledge', installs: '1K', desc: 'Say goodbye to spending hours coordinating and running your events!', color: '#f97316', icon: 'fa-calendar', videoId: '1EpzS37eQDo' },
                      { name: 'WebinarGeek', by: 'WebinarGeek', installs: '800+', desc: 'Easy-to-use webinar software with powerful marketing tools.', color: '#0284c7', icon: 'fa-play', videoId: 'dkmEwkbsADc' },
                      { name: 'Humanitix', by: 'Humanitix', installs: '600+', desc: 'Boost ticket sales, grow your audience and streamline workflows.', color: '#f43f5e', icon: 'hx', videoId: 'NZnAtsqViF8' },
                      { name: 'ON24', by: 'ON24', installs: '600+', desc: 'Integrate ON24 data to drive engagement, qualify and prioritize...', color: '#2563eb', icon: 'ON', videoId: 'exKkXw67jnw' }
                    ].map((card, idx) => (
                      <div key={idx} onClick={() => setSelectedVideo(card.videoId)} style={{ width: '260px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                        <div style={{ width: '40px', height: '40px', background: card.color, borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                          {card.icon.startsWith('fa-') ? <i className={`fa ${card.icon}`}></i> : card.icon}
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{card.name}</h4>
                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>By {card.by} &nbsp;•&nbsp; {card.installs}</p>
                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', height: '60px', overflow: 'hidden', marginBottom: '16px' }}>{card.desc}</p>
                        <div style={{ display: 'inline-block', padding: '3px 12px', background: '#f1f5f9', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#475569' }}>View</div>
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
                    <th>Event Name</th>
                    <th>Location / Type</th>
                    <th>Start Date</th>
                    <th>Organizer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.name}</b></td>
                      <td>{item.type || item.location}</td>
                      <td>{item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td>{item.organizer || '-'}</td>
                      <td><span className={`badge-status badge-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Video Pop-up Modal */}
      {selectedVideo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedVideo(null)}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '15px', right: '15px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedVideo(null)}>
              <i className="fa fa-times"></i>
            </button>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                title="Video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
