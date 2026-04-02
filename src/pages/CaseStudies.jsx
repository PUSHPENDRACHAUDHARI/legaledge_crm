import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

const CASE_STUDIES = [
  { id: 1, title: 'How Acme Corp Increased Sales by 150%', company: 'Acme Corp', industry: 'Logistics', outcome: '150% ROI', status: 'Published', date: '2026-02-15' },
  { id: 2, title: "TechStart's Journey to Automated CRM", company: 'TechStart', industry: 'Software', outcome: 'Saved 20hrs/wk', status: 'Published', date: '2026-03-01' },
  { id: 3, title: 'Streamlining Legal Processes with AI', company: 'Legal Solutions Ltd', industry: 'Legal', outcome: '30% faster closing', status: 'Draft', date: '2026-03-10' },
  { id: 4, title: 'Global Retail Expansion Strategy', company: 'RetailCo', industry: 'Retail', outcome: '12 new markets', status: 'Published', date: '2026-01-20' },
  { id: 5, title: 'HealthTech Revenue Growth Q1', company: 'MediCare Group', industry: 'Healthcare', outcome: '42% MRR growth', status: 'Published', date: '2026-03-05' },
  { id: 6, title: 'Finance Platform Data Migration', company: 'FinPro Services', industry: 'Finance', outcome: '0 downtime migration', status: 'Draft', date: '2026-03-14' },
];

export default function CaseStudies() {
  const { showToast } = useCRM();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const rows = CASE_STUDIES.filter(cs => {
    const q = search.toLowerCase();
    const matchQ = !q || cs.title.toLowerCase().includes(q) || cs.company.toLowerCase().includes(q);
    const matchF = filter === 'All' || cs.status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Case Studies</h1>
          <p className="page-subtitle">Showcase your success stories and customer wins</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => showToast('Case study editor is coming soon.', 'info')}>
            <i className="fa fa-plus" /> New Case Study
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-toolbar" style={{ borderBottom: 'none' }}>
          <div className="search-box">
            <i className="fa fa-search" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search case studies…"
            />
          </div>
          <div className="filter-tabs">
            {['All', 'Published', 'Draft'].map(f => (
              <button
                key={f}
                className={`filter-tab${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid – 1 col mobile / 2 tablet / 3 desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {rows.map(cs => (
          <div
            key={cs.id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', padding: 20, gap: 12 }}
          >
            {/* Top row: status badge + menu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge badge-${cs.status === 'Published' ? 'success' : 'secondary'}`}>
                {cs.status}
              </span>
              <button className="btn-icon" onClick={() => showToast(`More actions for ${cs.title}`)}>
                <i className="fa fa-ellipsis-h" />
              </button>
            </div>

            {/* Title */}
            <h3 style={{ margin: 0, fontSize: 16, lineHeight: '1.4', color: 'var(--primary)', flex: 1 }}>
              {cs.title}
            </h3>

            {/* Company + Industry grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                background: 'var(--bg-hover)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div>
                <div className="txt-muted txt-sm" style={{ marginBottom: 2 }}>Company</div>
                <div className="fw-600">{cs.company}</div>
              </div>
              <div>
                <div className="txt-muted txt-sm" style={{ marginBottom: 2 }}>Industry</div>
                <div className="fw-600">{cs.industry}</div>
              </div>
            </div>

            {/* Key Outcome */}
            <div>
              <div className="txt-muted txt-sm" style={{ marginBottom: 4 }}>Key Outcome</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>
                <i className="fa fa-chart-line" style={{ marginRight: 6 }} />
                {cs.outcome}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-color)',
                paddingTop: 12,
                marginTop: 4,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span className="txt-sm txt-muted">
                <i className="fa fa-calendar" style={{ marginRight: 6 }} />
                {cs.date}
              </span>
              <button className="btn-secondary btn-sm" onClick={() => showToast(`Opening editor for ${cs.title}`)}>Edit Document</button>
            </div>
          </div>
        ))}

        {!rows.length && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <i className="fa fa-book-open" />
            <br />
            No case studies found
          </div>
        )}
      </div>
    </div>
  );
}
