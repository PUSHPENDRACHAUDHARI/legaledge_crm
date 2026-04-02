import { useCRM } from '../context/CRMContext';

function initials(n) { return n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2); }
const COLORS = ['av-blue', 'av-green', 'av-gold', 'av-red', 'av-purple', 'av-teal'];
function avatarColor(n) { return COLORS[n.charCodeAt(0) % COLORS.length]; }

// ══════════════════════════════════════════════════════════
//  DATA AGENT
// ══════════════════════════════════════════════════════════
function DataAgent() {
  const { showToast } = useCRM();
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title"><i className="fa fa-robot" style={{ color: 'var(--primary)' }}></i> Data Agent</div></div>
      </div>

      <div className="ai-card" style={{ marginBottom: 20 }}>
        <h3><i className="fa fa-database"></i> AI Data Agent</h3>
        <p>Your intelligent data assistant – clean, enrich, and manage CRM data automatically.</p>
        <div className="ai-suggestion" onClick={() => showToast('Scanning for duplicates...')}>
          <p><i className="fa-solid fa-search"></i> Scan for duplicate contacts and merge suggestions</p>
          <small>14 potential duplicates found</small>
        </div>
        <div className="ai-suggestion" onClick={() => showToast('Enriching data...')}>
          <p><i className="fa-solid fa-wand-magic-sparkles"></i> Enrich missing email addresses for 8 contacts</p>
          <small>Click to run enrichment</small>
        </div>
        <div className="ai-suggestion" onClick={() => showToast('Validating data...')}>
          <p><i className="fa-solid fa-clipboard-list"></i> Validate phone numbers for all contacts in Mumbai</p>
          <small>Click to validate</small>
        </div>
      </div>

      <div className="stats-grid">
        {[
          ['Clean Records', '89%', 'green', 'fa-check-circle', '↑ 3% this week'],
          ['Duplicates', '14', 'red', 'fa-copy', 'Needs review'],
          ['Missing Fields', '31', 'gold', 'fa-circle-exclamation', 'Action needed'],
          ['Enriched Today', '8', 'blue', 'fa-wand-magic-sparkles', 'Auto-enriched'],
        ].map(([label, val, col, ic, change]) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${col}`}><i className={`fa ${ic}`}></i></div>
            <div className="stat-info">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-change up">{change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DATA INTEGRATION (shares ConnectedApps grid)
// ══════════════════════════════════════════════════════════
function DataIntegration() {
  const { store, showToast } = useCRM();
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title"><i className="fa fa-plug" style={{ color: 'var(--primary)' }}></i> Data Integration</div></div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('Add integration')}><i className="fa fa-plus"></i> Add Integration</button>
        </div>
      </div>

      <div className="marketplace-grid">
        {store.connectedApps.map(a => (
          <div key={a.name} className="marketplace-card">
            <div className="marketplace-card-icon">{a.icon}</div>
            <h4>{a.name}</h4>
            <p>{a.category}</p>
            {a.status === 'Connected' && a.since &&
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Since {new Date(a.since).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            }
            <div className="marketplace-card-actions">
              {a.status === 'Connected'
                ? <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast(`${a.name} settings opened`)}>
                    <span className="connected-dot"></span>Connected
                  </button>
                : <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', width: '100%' }} onClick={() => showToast('Connecting...')}>
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
//  DATA QUALITY
// ══════════════════════════════════════════════════════════
const ISSUES = [
  ['14 duplicate contacts detected', 'High', 'fa-copy', 'var(--danger)', 'lost'],
  ['31 contacts missing email address', 'Medium', 'fa-envelope', 'var(--warning)', 'contacted'],
  ['8 leads with invalid phone numbers', 'Medium', 'fa-phone', 'var(--warning)', 'contacted'],
  ['5 deals missing close dates', 'Low', 'fa-calendar', 'var(--info)', 'new'],
  ['3 companies missing industry field', 'Low', 'fa-building', 'var(--info)', 'new'],
];

function DataQuality() {
  const { showToast } = useCRM();
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title"><i className="fa fa-shield-check" style={{ color: 'var(--success)' }}></i> Data Quality</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[['Overall Score', '89%', 'var(--success)'], ['Contacts', '92%', 'var(--success)'], ['Leads', '85%', 'var(--warning)'], ['Deals', '91%', 'var(--success)']].map(([label, score, color]) => (
          <div key={label} className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 24 }}>
              <div className="dq-score" style={{ borderColor: color }}>
                <div className="score-val" style={{ color }}>{score}</div>
                <div className="score-lbl">Quality</div>
              </div>
              <div style={{ fontWeight: 700, marginTop: 12 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Data Issues</div>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => showToast('Auto-fixing issues...')}>
            <i className="fa fa-wand-magic-sparkles"></i> Auto-Fix All
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {ISSUES.map(([issue, sev, icon, col, badge]) => (
            <div key={issue} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className={`fa ${icon}`} style={{ color: col, fontSize: 16, width: 20 }}></i>
                <span style={{ fontSize: 13 }}>{issue}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge-status badge-${badge}`}>{sev}</span>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => showToast('Issue resolved!')}>Fix</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DATA ENRICHMENT
// ══════════════════════════════════════════════════════════
function DataEnrichment() {
  const { store, showToast } = useCRM();
  const queue = store.contacts.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title"><i className="fa fa-wand-magic-sparkles" style={{ color: 'var(--accent)' }}></i> Data Enrichment</div>
          <div className="page-subtitle">Automatically enrich contact and company data</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Enrichment Queue</div>
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => showToast('Running enrichment...')}>
              <i className="fa fa-play"></i> Run Now
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {queue.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div className="contact-cell">
                  <div className={`avatar ${avatarColor(c.name)}`}>{initials(c.name)}</div>
                  <div className="contact-cell-info"><b>{c.name}</b><span>{c.company}</span></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Missing: {!c.phone ? 'Phone ' : ''}{!c.industry ? 'Industry' : ''}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Enrichment Stats</div></div>
          <div className="card-body">
            {[['Emails enriched', '42', 'var(--success)'], ['Phones found', '28', 'var(--info)'], ['Industries added', '35', 'var(--accent)'], ['LinkedIn profiles', '19', 'var(--primary)']].map(([label, val, color]) => (
              <div key={label} className="info-row"><label>{label}</label><span style={{ color, fontWeight: 700 }}>{val}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════
export default function DataManagement({ view }) {
  switch (view) {
    case 'agent':       return <DataAgent />;
    case 'integration': return <DataIntegration />;
    case 'quality':     return <DataQuality />;
    case 'enrichment':  return <DataEnrichment />;
    default:            return <DataAgent />;
  }
}
