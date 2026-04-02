import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';

const INTEGRATIONS = [
  { id: 1, name: 'Zapier', category: 'Automation', icon: 'fa-bolt', color: '#ff4a00', status: 'Connected', syncData: '12.4k syncs today' },
  { id: 2, name: 'Slack', category: 'Communication', icon: 'fa-slack', color: '#4a154b', status: 'Connected', syncData: 'All active channels' },
  { id: 3, name: 'Google Workspace', category: 'Email & Calendar', icon: 'fa-google', color: '#ea4335', status: 'Not Connected', syncData: null },
  { id: 4, name: 'Shopify', category: 'E-commerce', icon: 'fa-shopping-cart', color: '#95bf47', status: 'Connected', syncData: 'Last sync: 2 hours ago' },
  { id: 5, name: 'Salesforce', category: 'CRM', icon: 'fa-cloud', color: '#00a1e0', status: 'Not Connected', syncData: null },
  { id: 6, name: 'Mailchimp', category: 'Marketing', icon: 'fa-envelope', color: '#ffe01b', status: 'Update Required', syncData: 'API key expired' },
];

export default function DataIntegration() {
  const navigate = useNavigate();
  const { showToast } = useCRM();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const rows = INTEGRATIONS.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    const matchF = filter === 'All' || i.status === filter || (filter === 'Connected' && i.status === 'Update Required');
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Integrations</h1>
          <p className="page-subtitle">Connect and sync data with your favorite tools</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-primary" onClick={() => navigate('/marketplace-apps')}>
            <i className="fa fa-plug"/> Browse Marketplace
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-box">
            <i className="fa fa-search"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search integrations…"/>
          </div>
          <div className="filter-tabs">
            {['All', 'Connected', 'Not Connected'].map(f=>(
              <button key={f} className={`filter-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {rows.map(app => (
          <div key={app.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fab ${app.icon} fa ${app.icon}`} style={{ fontSize: '24px', color: app.color }}></i>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{app.name}</h3>
                <div className="txt-sm txt-muted">{app.category}</div>
              </div>
            </div>

            <div style={{ flex: 1, marginBottom: '20px', padding: '15px', background: 'var(--bg-hover)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="fw-600">Status</span>
                <span className={`badge badge-${app.status.includes('Connected') ? 'success' : app.status === 'Update Required' ? 'warning' : 'secondary'}`}>
                  {app.status}
                </span>
              </div>
              {app.syncData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <i className="fa fa-sync-alt"></i> {app.syncData}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {app.status.includes('Connected') || app.status === 'Update Required' ? (
                <>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => showToast(`${app.name} settings opened`)}>Settings</button>
                  <button className="btn-secondary" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => showToast(`${app.name} disconnected`)}>Disconnect</button>
                </>
              ) : (
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => showToast(`Connecting ${app.name}...`)}>Connect App</button>
              )}
            </div>
          </div>
        ))}
        {!rows.length && (
          <div className="card empty-state" style={{ gridColumn: '1 / -1' }}>
            <i className="fa fa-plug"/><br/>No integrations found
          </div>
        )}
      </div>
    </div>
  );
}
