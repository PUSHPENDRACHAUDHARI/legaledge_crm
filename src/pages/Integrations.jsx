import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

const MARKETPLACE_APPS = [
  { name: 'Gmail', icon: 'fa-envelope', category: 'Email', desc: 'Sync emails with CRM contacts', connected: true },
  { name: 'Slack', icon: 'fa-comment-dots', category: 'Messaging', desc: 'Get CRM alerts in Slack channels', connected: true },
  { name: 'Zoom', icon: 'fa-video', category: 'Video', desc: 'Schedule and log Zoom meetings', connected: true },
  { name: 'Razorpay', icon: 'fa-credit-card', category: 'Payments', desc: 'Accept payments and track invoices', connected: true },
  { name: 'Google Calendar', icon: 'fa-calendar-days', category: 'Calendar', desc: 'Sync meetings and reminders', connected: true },
  { name: 'Tally', icon: 'fa-chart-simple', category: 'Accounting', desc: 'Sync invoices with Tally ERP', connected: false },
  { name: 'WhatsApp Business', icon: 'fa-brands fa-whatsapp', category: 'Messaging', desc: 'Send WhatsApp messages from CRM', connected: false },
  { name: 'IndiaMART', icon: 'fa-store', category: 'Leads', desc: 'Import leads from IndiaMART', connected: false },
  { name: 'JustDial', icon: 'fa-phone', category: 'Leads', desc: 'Sync JustDial leads automatically', connected: false },
  { name: 'Mailchimp', icon: 'fa-envelope-open-text', category: 'Email', desc: 'Email marketing integration', connected: false },
  { name: 'Stripe', icon: 'fa-brands fa-stripe', category: 'Payments', desc: 'Global payment processing', connected: false },
  { name: 'Zapier', icon: 'fa-bolt', category: 'Automation', desc: 'Connect 5000+ apps with Zapier', connected: false },
];

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ══════════════════════════════════════════════════════════
//  MARKETPLACE
// ══════════════════════════════════════════════════════════
function MarketplaceApps() {
  const { showToast } = useCRM();
  const [search, setSearch] = useState('');
  const connected = MARKETPLACE_APPS.filter(a => a.connected).length;
  const filtered = MARKETPLACE_APPS.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-grid-2" style={{ color: 'var(--primary)' }}></i> App Marketplace</div>
          <div className="page-subtitle">{connected} connected · {MARKETPLACE_APPS.length - connected} available</div>
        </div>
        <div className="page-actions">
          <div className="filter-search" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', display: 'flex', gap: 8 }}>
            <i className="fa fa-search" style={{ color: 'var(--text-muted)' }}></i>
            <input type="text" placeholder="Search apps..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'none', fontFamily: "'DM Sans', sans-serif" }} />
          </div>
        </div>
      </div>

      <div className="marketplace-grid">
        {filtered.map(a => (
          <div key={a.name} className="marketplace-card">
            <div className="marketplace-card-icon"><i className={`fa ${a.icon}`} style={{ fontSize: 24 }}></i></div>
            <h4>{a.name}</h4>
            <p>{a.desc}</p>
            <span style={{ fontSize: 11, background: 'rgba(26,60,107,0.08)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 20 }}>{a.category}</span>
            <div className="marketplace-card-actions">
              {a.connected
                ? <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast(`${a.name} settings opened`)}>
                    <span className="connected-dot"></span>Connected
                  </button>
                : <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast(`${a.name} connecting...`)}>
                    <i className="fa fa-plug"></i> Connect
                  </button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CONNECTED APPS
// ══════════════════════════════════════════════════════════
function ConnectedApps() {
  const { store, showToast } = useCRM();
  const apps = store.connectedApps || [];
  const connectedCount = apps.filter(a => a.status === 'Connected').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-link" style={{ color: 'var(--primary)' }}></i> Connected Apps</div>
          <div className="page-subtitle">{connectedCount} apps connected</div>
        </div>
      </div>

      <div className="marketplace-grid">
        {apps.map(a => (
          <div key={a.name} className="marketplace-card">
            <div className="marketplace-card-icon"><i className={`fa ${a.icon}`} style={{ fontSize: 24 }}></i></div>
            <h4>{a.name}</h4>
            <p>{a.category}</p>
            {a.status === 'Connected' && a.since &&
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Since {fmtDate(a.since)}</div>
            }
            <div className="marketplace-card-actions">
              {a.status === 'Connected'
                ? <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast(`${a.name} settings opened`)}>
                    <span className="connected-dot"></span>Connected
                  </button>
                : <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast(`Connecting to ${a.name}...`)}>
                    <i className="fa fa-plug"></i> Connect
                  </button>
              }
            </div>
          </div>
        ))}
        {!apps.length && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="fa fa-plug" style={{ fontSize: 40, marginBottom: 16 }}></i>
            <p>No connected apps yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════
export default function Integrations({ view }) {
  switch (view) {
    case 'marketplace': return <MarketplaceApps />;
    case 'connected':   return <ConnectedApps />;
    default:            return <MarketplaceApps />;
  }
}
