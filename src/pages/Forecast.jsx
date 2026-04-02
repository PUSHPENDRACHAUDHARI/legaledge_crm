import { useCRM } from '../context/CRMContext';

function currency(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STAGE_BADGE = {
  'New Lead': 'new',
  'Contacted': 'contacted',
  'Proposal': 'negotiation',
  'Negotiation': 'negotiation',
  'Closed Won': 'won',
  'Closed Lost': 'lost',
};

export default function Forecast() {
  const { store } = useCRM();
  const openDeals = store.deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
  const pipelineVal = openDeals.reduce((a, b) => a + b.value, 0);
  const weighted    = openDeals.reduce((a, b) => a + (b.value * b.probability / 100), 0);
  const wonVal      = store.deals.filter(d => d.stage === 'Closed Won').reduce((a, b) => a + b.value, 0);
  const targetVal   = 2000000;
  const pct         = Math.min(Math.round((wonVal / targetVal) * 100), 100);

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title"><i className="fa fa-chart-bar" style={{ color: 'var(--primary)' }}></i> Sales Forecast</div></div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fa fa-funnel"></i></div>
          <div className="stat-info">
            <div className="stat-label">Pipeline Value</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{currency(pipelineVal)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold"><i className="fa fa-weight-hanging"></i></div>
          <div className="stat-info">
            <div className="stat-label">Weighted Forecast</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{currency(Math.round(weighted))}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fa fa-trophy"></i></div>
          <div className="stat-info">
            <div className="stat-label">Won This Month</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{currency(wonVal)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><i className="fa fa-bullseye"></i></div>
          <div className="stat-info">
            <div className="stat-label">Monthly Target</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{currency(targetVal)}</div>
            <div style={{ marginTop: 6 }}>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{pct}% achieved</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="card-header"><div className="card-title">Open Deals Forecast</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <div className="table-container">
<table className="data-table">
              <thead>
                <tr><th>Deal</th><th>Company</th><th>Value</th><th>Stage</th><th>Probability</th><th>Weighted Value</th><th>Close Date</th></tr>
              </thead>
              <tbody>
                {openDeals.map(d => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td>{d.company}</td>
                    <td className="fw-bold">{currency(d.value)}</td>
                    <td><span className={`badge-status badge-${STAGE_BADGE[d.stage] || 'new'}`}>{d.stage}</span></td>
                    <td>{d.probability}%</td>
                    <td className="fw-bold text-success">{currency(Math.round(d.value * d.probability / 100))}</td>
                    <td>{fmtDate(d.closeDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          </div>
        </div>
      </div>
    </div>
  );
}
