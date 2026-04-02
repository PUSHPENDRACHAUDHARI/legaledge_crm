import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';

const AI_AGENTS = [
  { id: 1, name: 'Breeze Prospecting Agent', role: 'Sales Outreach', status: 'Active', tasks: 1450, successRate: '92%', lastActive: '2 mins ago', icon: 'fa-user-secret', color: 'var(--primary)' },
  { id: 2, name: 'Breeze Customer Service Agent', role: 'Support Triage', status: 'Active', tasks: 340, successRate: '98%', lastActive: '1 hr ago', icon: 'fa-headset', color: 'var(--success)' },
  { id: 3, name: 'Data Cleanup Agent', role: 'Data Quality', status: 'Paused', tasks: 5600, successRate: '99%', lastActive: '2 days ago', icon: 'fa-broom', color: 'var(--warning)' },
  { id: 4, name: 'Content Marketing AI', role: 'Blog Drafts', status: 'Active', tasks: 45, successRate: '85%', lastActive: '4 hrs ago', icon: 'fa-pen-nib', color: 'var(--info)' },
];

export default function AddedAgents() {
  const navigate = useNavigate();
  const { showToast } = useCRM();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const rows = AI_AGENTS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
    return (filter === 'All' || a.status === filter) && matchSearch;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Added AI Agents</h1>
          <p className="page-subtitle">Manage your autonomous AI agents across the CRM</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => navigate('/breeze-marketplace')}>
            <i className="fa fa-robot"/> Browse Agent Marketplace
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-box">
            <i className="fa fa-search"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." />
          </div>
          <div className="filter-tabs">
            {['All', 'Active', 'Paused'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {rows.map(a => (
          <div key={a.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: a.color, fontSize: '20px' }}>
                <i className={`fa ${a.icon}`}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{a.name}</h3>
                <span className={`badge badge-${a.status === 'Active' ? 'success' : 'warning'}`}>{a.status}</span>
              </div>
              <button className="btn-icon" onClick={() => showToast(`More options for ${a.name}`)}>
                <i className="fa fa-ellipsis-v"></i>
              </button>
            </div>

            <div style={{ padding: '20px', flex: 1 }}>
              <div className="txt-muted txt-sm" style={{ marginBottom: '5px' }}>Assigned Role</div>
              <div className="fw-500" style={{ marginBottom: '20px' }}><i className="fa fa-briefcase txt-muted"></i> {a.role}</div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div className="txt-muted txt-sm">Tasks Handled</div>
                  <div className="fw-600 color-primary" style={{ fontSize: '18px' }}>{a.tasks.toLocaleString()}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="txt-muted txt-sm">Success Rate</div>
                  <div className="fw-600 color-success" style={{ fontSize: '18px' }}>{a.successRate}</div>
                </div>
              </div>

              <div className="txt-sm txt-muted"><i className="fa fa-clock"></i> Last Active: {a.lastActive}</div>
            </div>

            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => showToast(`${a.name} settings opened`)}>Settings</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => showToast(`${a.name} analytics opened`)}>Analytics</button>
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <i className="fa fa-robot"/><br/>No AI agents found
          </div>
        )}
      </div>
    </div>
  );
}
