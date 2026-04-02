import React, { useState, useEffect } from 'react';
import { marketingSocialAPI } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

const toList = (data) => (Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
const unwrapPayload = (row) => ({ ...(row?.data || {}), id: row?.data?.id || row?.localId || row?.id });

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const _InteractionsChart = () => {
  const data = {
    labels: ['15 Oct', '17 Oct', '19 Oct', '21 Oct', '23 Oct', '25 Oct', '27 Oct', '29 Oct', '31 Oct'],
    datasets: [
      {
        label: 'Likes',
        data: [130, 80, 150, 100, 140, 70, 40, 100, 40],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Dislikes',
        data: [80, 60, 40, 90, 60, 40, 70, 40, 20],
        borderColor: '#eab308',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Comments',
        data: [70, 60, 80, 70, 75, 50, 40, 60, 30],
        borderColor: '#f472b6',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Shares',
        data: [60, 50, 70, 55, 60, 45, 30, 50, 20],
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        tension: 0.4,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
      }
    },
    scales: {
      y: { display: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      x: { display: true, grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
    }
  };

  return <Line data={data} options={options} />;
};

const _SubscribersChart = () => {
  const data = {
    labels: ['15 Oct', '17 Oct', '19 Oct', '21 Oct', '23 Oct', '25 Oct', '27 Oct', '29 Oct', '31 Oct'],
    datasets: [
      {
        label: 'Subscribers gained',
        data: [115, 120, 80, 95, 80, 70, 110, 85, 150],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Subscribers lost',
        data: [30, 25, 35, 20, 30, 45, 30, 25, 30],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
      }
    },
    scales: {
      y: { display: true, beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      x: { display: true, grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } }
    }
  };

  return <Line data={data} options={options} />;
};

export default function SocialActivitiesPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ platform: 'LinkedIn', content: '', status: 'Draft' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await marketingSocialAPI.list();
        setItems(toList(res).map(unwrapPayload));
      } catch (err) {
        console.warn('Failed to load social activities from API:', err.message);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!formData.content.trim()) return;
    const newItem = {
      ...formData,
      id: Date.now().toString(),
      createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    try {
      const created = await marketingSocialAPI.create({ localId: newItem.id, data: newItem });
      setItems((prev) => [...prev, unwrapPayload(created)]);
    } catch (err) {
      console.warn('Failed to save social activity to API:', err.message);
      setItems((prev) => [...prev, newItem]);
    }

    setFormData({ platform: 'LinkedIn', content: '', status: 'Draft' });
    setShowForm(false);
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Social</div>
          <div className="page-subtitle">Schedule, publish, and monitor social media content to engage your audience and grow brand presence.</div>
        </div>
        <div className="page-actions">
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <i className="fa fa-plus"></i> Create Social Post
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">Create New Social Post</div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Platform</label>
                <select className="form-control" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                  <option>LinkedIn</option>
                  <option>Twitter / X</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Draft</option>
                  <option>Scheduled</option>
                  <option>Published</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Post Content <span className="required">*</span></label>
              <textarea 
                className="form-control" 
                rows={3}
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                placeholder="What do you want to share?" 
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}><i className="fa fa-check"></i> Save Post</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'block' }}>
        {items.length === 0 ? (
          !showForm ? (
            <React.Fragment>
              {/* --- SECTION 1: Upsell --- */}
              <div className="card upsell-state" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', padding: '40px' }}>
                  <div style={{ flex: '1 1 400px', paddingRight: '40px', minWidth: '320px', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.2', color: '#1e293b', marginBottom: '20px', letterSpacing: '-0.5px' }}>
                      Prove the return-on-<br />investment for your<br />social activities.
                    </h1>
                    <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
                      Legaledge Social allows you to spend more time connecting with the people who matter most, with time-saving tools that help you prioritize your social interactions.
                    </p>
                     <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: '600', marginBottom: '24px' }}>
                      Unlock this and more with Marketing Hub Professional.
                    </p>
                  </div>
                  
                  {/* Removed Edit social post mockup */}
                </div>
              </div>

              <div style={{ padding: '40px', display: 'flex', flexWrap: 'wrap-reverse', gap: '40px', alignItems: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                <div style={{ flex: '1 1 400px' }}>
                  <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop" alt="Social dashboard" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ flex: '1 1 450px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '16px', letterSpacing: '-0.3px' }}>Manage all your social accounts in one place</h2>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
                    Publish to multiple social media platforms, including Facebook, Instagram, LinkedIn, and X (formerly Twitter).
                  </p>
                  <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                    Monitor your brand by keeping track of mentions, messages, and social interactions across all your profiles.
                  </p>
                </div>
              </div>
            </React.Fragment>
          ) : null
        ) : (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Content Snippet</th>
                    <th>Status</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><b>{item.platform}</b></td>
                      <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</td>
                      <td><span className={`badge-status badge-${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
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
