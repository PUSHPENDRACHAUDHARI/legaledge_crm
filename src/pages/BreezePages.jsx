import { useCRM } from '../context/CRMContext';

/* ─────────────────────────────────────────────
   RESPONSIVE CSS — same pattern as Dashboard
   Injected once, covers all sub-components
───────────────────────────────────────────── */
const RESPONSIVE_CSS = `
  /* ── Flex two-column row (Bootstrap-style) ── */
  .bp-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;
    margin-bottom: 16px;
  }
  .bp-col-6 {
    flex: 1 1 calc(50% - 8px);
    min-width: 0;
  }
  .bp-col-4 {
    flex: 1 1 calc(33.333% - 11px);
    min-width: 0;
  }
  .bp-col-8 {
    flex: 1 1 calc(66.666% - 5px);
    min-width: 0;
  }

  /* Cards inside columns fill full height */
  .bp-col-6 > .card,
  .bp-col-4 > .card,
  .bp-col-8 > .card { height: 100%; box-sizing: border-box; }

  /* ── Tool cards grid — 3 col → 2 → 1 ── */
  .bp-tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
  }

  /* ── Vault cards grid — 2 col → 1 ── */
  .bp-vault-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    width: 100%;
  }

  /* ── Table horizontal scroll ── */
  .bp-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }

  /* ── Stat grid ── */
  .bp-stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  /* ════════════════════════
     BREAKPOINTS
  ════════════════════════ */

  /* Tablet — 992px */
  @media (max-width: 992px) {
    .bp-col-6,
    .bp-col-4,
    .bp-col-8   { flex: 1 1 100%; }
    .bp-tools-grid { grid-template-columns: repeat(2, 1fr); }
    .bp-stat-grid  { grid-template-columns: repeat(2, 1fr); }
  }

  /* Mobile — 576px */
  @media (max-width: 576px) {
    .bp-col-6,
    .bp-col-4,
    .bp-col-8   { flex: 1 1 100%; }
    .bp-tools-grid { grid-template-columns: 1fr; }
    .bp-vault-grid { grid-template-columns: 1fr; }
    .bp-stat-grid  { grid-template-columns: 1fr; }
  }
`;

/* ── shared date helper — untouched ── */
function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ══════════════════════════════════════════════════════════
//  BREEZE STUDIO
// ══════════════════════════════════════════════════════════
function BreezeStudio() {
  const { showToast } = useCRM();
  const tools = [
    ['Content Writer',  'pen-nib',    'Draft emails, proposals & follow-ups instantly'],
    ['Deal Analyzer',   'chart-bar',  'Score and rank your deals by close probability'],
    ['Lead Qualifier',  'user-check', 'Auto-qualify leads based on fit & behavior'],
    ['Email Optimizer', 'envelope',   'Improve subject lines & open rates with AI'],
    ['Call Summarizer', 'phone',      'Transcribe and summarize sales calls'],
    ['Forecast AI',     'chart-line', 'Predict quarterly revenue with AI forecasting'],
  ];

  return (
    <div>
      <style>{RESPONSIVE_CSS}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fa fa-wand-magic-sparkles" style={{ color: 'var(--accent)' }} /> Breeze AI Studio
          </div>
          <div className="page-subtitle">AI-powered tools to supercharge your CRM</div>
        </div>
      </div>

      <div className="ai-card" style={{ marginBottom: 20 }}>
        <h3><i className="fa fa-microchip" /> LegalEdge AI Assistant</h3>
        <p>Get instant insights, draft emails, summarize deals, and automate tasks with built-in AI.</p>
        <div className="ai-suggestion" onClick={() => showToast('AI generating email draft...')}>
          <p><i className="fa-solid fa-envelope" /> Draft a follow-up email for Priya Mehta after proposal sent</p>
          <small>Click to generate</small>
        </div>
        <div className="ai-suggestion" onClick={() => showToast('AI analyzing pipeline...')}>
          <p><i className="fa-solid fa-chart-column" /> Summarize this week's pipeline performance</p>
          <small>Click to generate</small>
        </div>
        <div className="ai-suggestion" onClick={() => showToast('AI finding leads...')}>
          <p><i className="fa-solid fa-bullseye" /> Suggest 5 high-intent leads based on activity patterns</p>
          <small>Click to generate</small>
        </div>
      </div>

      {/* 3-col grid → 2 on tablet → 1 on mobile */}
      <div className="bp-tools-grid">
        {tools.map(([name, ic, desc]) => (
          <div
            key={name}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => showToast(`${name} activated!`)}
          >
            <div className="card-body" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{
                width: 52, height: 52,
                background: 'linear-gradient(135deg,var(--primary-dark),var(--primary))',
                borderRadius: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 12px',
                fontSize: 22, color: 'var(--accent)',
              }}>
                <i className={`fa fa-${ic}`} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
              <button
                className="btn-primary"
                style={{ marginTop: 14, fontSize: 12, padding: '7px 14px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  showToast(`${name} activated!`);
                }}
              >
                Activate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  KNOWLEDGE VAULTS
// ══════════════════════════════════════════════════════════
const VAULTS = [
  { name: 'Sales Handbook',        docs: 12, updated: '2026-03-01', desc: 'Complete sales process, scripts, and best practices' },
  { name: 'Product Knowledge Base',docs: 28, updated: '2026-03-05', desc: 'All product features, FAQs, and technical docs' },
  { name: 'Customer Objections',   docs: 8,  updated: '2026-02-20', desc: 'Common objections and proven responses' },
  { name: 'Onboarding Resources',  docs: 15, updated: '2026-03-07', desc: 'New client onboarding guides and checklists' },
];

function KnowledgeVaults() {
  const { showToast } = useCRM();
  return (
    <div>
      <style>{RESPONSIVE_CSS}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fa fa-vault" style={{ color: 'var(--primary)' }} /> Knowledge Vaults
          </div>
          <div className="page-subtitle">Centralized knowledge for your AI assistant</div>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => showToast('New vault')}>
            <i className="fa fa-plus" /> New Vault
          </button>
        </div>
      </div>

      {/* 2-col grid → 1 on mobile */}
      <div className="bp-vault-grid">
        {VAULTS.map(v => (
          <div
            key={v.name}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => showToast('Opening vault...')}
          >
            <div className="card-body">
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', marginBottom: 10,
              }}>
                <div style={{
                  width: 44, height: 44,
                  background: 'rgba(26,60,107,0.08)',
                  borderRadius: 10, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--primary)',
                }}>
                  <i className="fa fa-vault" />
                </div>
                <span className="badge-status badge-active">Active</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{v.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{v.desc}</div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span><i className="fa fa-file" /> {v.docs} documents</span>
                <span><i className="fa fa-clock" /> Updated {fmtDate(v.updated)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PROSPECTING AGENT  ← main fix from screenshot
// ══════════════════════════════════════════════════════════
const SEQUENCES = [
  ['Legal Firms Mumbai',  '25 prospects', 'Running', '87%'],
  ['Tech Startups Pune',  '40 prospects', 'Paused',  '62%'],
  ['Healthcare Chennai',  '18 prospects', 'Running', '74%'],
];

function ProspectingAgent() {
  const { showToast } = useCRM();
  return (
    <div>
      <style>{RESPONSIVE_CSS}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fa fa-user-secret" style={{ color: 'var(--primary)' }} /> Prospecting Agent
          </div>
          <div className="page-subtitle">AI-powered outbound prospecting</div>
        </div>
      </div>

      <div className="ai-card" style={{ marginBottom: 20 }}>
        <h3><i className="fa fa-crosshairs" /> AI Prospecting Engine</h3>
        <p>Let AI find, qualify, and sequence prospects for your sales team automatically.</p>
      </div>

      {/* ── Two columns: sequences left, finder right ── */}
      <div className="bp-row">

        {/* LEFT — Active Prospect Sequences */}
        <div className="bp-col-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Active Prospect Sequences</div>
              <button
                className="btn-primary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => showToast('New sequence')}
              >
                + New Sequence
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {SEQUENCES.map(([n, p, s, r]) => (
                <div
                  key={n}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <b style={{ fontSize: 13 }}>{n}</b>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className={`badge-status badge-${s === 'Running' ? 'active' : 'inactive'}`}>
                      {s}
                    </span>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Response: {r}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Prospect Finder */}
        <div className="bp-col-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Prospect Finder</div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-control">
                  <option>Legal</option>
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-control">
                  <option>Mumbai</option>
                  <option>Delhi</option>
                  <option>Pune</option>
                  <option>Bangalore</option>
                  <option>Hyderabad</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select className="form-control">
                  <option>1–50</option>
                  <option>50–200</option>
                  <option>200–1000</option>
                  <option>1000+</option>
                </select>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={() => showToast('AI finding prospects...')}
              >
                <i className="fa fa-search" /> Find Prospects
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CUSTOMER AGENT
// ══════════════════════════════════════════════════════════
function CustomerAgent() {
  const { store, showToast } = useCRM();
  const openTickets = (store.tickets || []).filter(t => t.status === 'Open').length;

  return (
    <div>
      <style>{RESPONSIVE_CSS}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fa fa-headset" style={{ color: 'var(--primary)' }} /> Customer Agent
          </div>
          <div className="page-subtitle">AI-powered customer support automation</div>
        </div>
      </div>

      {/* 4-col stat grid → 2 → 1 */}
      <div className="bp-stat-grid">
        {[
          ['AI Resolved',    '78%', 'green', 'fa-robot',     '↑ 12%'],
          ['Avg Response',   '1.2m', 'blue', 'fa-clock',     '↑ 3× faster'],
          ['CSAT Score',     '4.7',  'gold', 'fa-star',      '↑ 0.3'],
          ['Tickets Handled','142',  'info', 'fa-ticket-alt','This month'],
        ].map(([label, val, col, ic, change]) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${col}`}><i className={`fa ${ic}`} /></div>
            <div className="stat-info">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{val}</div>
              <div className="stat-change up">{change}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="ai-card" style={{ marginTop: 4 }}>
        <h3><i className="fa fa-headset" /> AI Support Agent – Online</h3>
        <p>
          The AI agent is actively handling {openTickets} open tickets.
          Average resolution time: 4.2 hours.
        </p>
        <div className="ai-suggestion" onClick={() => showToast('Drafting response...')}>
          <p>
            <i className="fa-solid fa-comment-dots" /> Draft response for ticket:
            "Cannot login to CRM" (High Priority)
          </p>
          <small>Click to generate AI response</small>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  BUYER INTENT
// ══════════════════════════════════════════════════════════
const INTENT_SIGNALS = [
  { company: 'TechCorp India',  contact: 'Rahul Sharma', score: 94, signals: ['Viewed pricing 3x','Downloaded brochure','Opened 5 emails'], intent: 'High'   },
  { company: 'StartupX',        contact: 'Vijay Khanna', score: 81, signals: ['Visited demo page','Clicked CTA','Returned to site'],        intent: 'High'   },
  { company: 'FinPro Services', contact: 'Amit Joshi',   score: 67, signals: ['Opened email','Read blog post'],                             intent: 'Medium' },
  { company: 'RetailCo India',  contact: 'Karan Patel',  score: 45, signals: ['Single website visit'],                                     intent: 'Low'    },
];

function BuyerIntent() {
  const { showToast } = useCRM();
  return (
    <div>
      <style>{RESPONSIVE_CSS}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            <i className="fa fa-brain" style={{ color: 'var(--accent)' }} /> Buyer Intent
          </div>
          <div className="page-subtitle">AI-detected buying signals from prospects</div>
        </div>
      </div>

      {/* Horizontal scroll on small screens */}
      <div className="bp-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Intent Score</th>
              <th>Buying Signals</th>
              <th>Intent Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {INTENT_SIGNALS.map(s => (
              <tr key={s.company}>
                <td><b>{s.company}</b></td>
                <td>{s.contact}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar-wrap" style={{ width: 80 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${s.score}%`,
                          background: s.score > 80
                            ? 'var(--success)'
                            : s.score > 60
                            ? 'var(--warning)'
                            : 'var(--danger)',
                        }}
                      />
                    </div>
                    <b>{s.score}</b>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {s.signals.join(' · ')}
                  </div>
                </td>
                <td>
                  <span className={`badge-status badge-${
                    s.intent === 'High' ? 'hot' : s.intent === 'Medium' ? 'warm' : 'cold'
                  }`}>
                    {s.intent}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                    onClick={() => showToast('Outreach started!')}
                  >
                    <i className="fa fa-paper-plane" /> Reach Out
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  EXPORT — untouched
// ══════════════════════════════════════════════════════════
export default function BreezePages({ view }) {
  switch (view) {
    case 'studio':      return <BreezeStudio />;
    case 'vaults':      return <KnowledgeVaults />;
    case 'prospecting': return <ProspectingAgent />;
    case 'customer':    return <CustomerAgent />;
    case 'intent':      return <BuyerIntent />;
    default:            return <BreezeStudio />;
  }
}
