import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js';
import { dashboardAPI } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

/* ── all your original helpers — untouched ── */
function currency(n) { return '₹' + (n || 0).toLocaleString('en-IN'); }
function fmtDate(str) {
  if (!str) return 'N/A';
  return new Date(str).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

const STAGE_COLORS = {
  'New Lead': '#3b82f6',
  'Contacted': '#f59e0b',
  'Proposal': '#8b5cf6',
  'Negotiation': '#8b5cf6',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444',
};

const PIPELINE_STAGES = ['New Lead','Contacted','Proposal','Negotiation','Closed Won'];

/* Modern Chart.js Config */
const MODERN_CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      cornerRadius: 8,
      displayColors: false,
    }
  }
};

const BAR_OPTIONS = {
  ...MODERN_CHART_DEFAULTS,
  scales: {
    y: {
      grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
      ticks: { 
        callback: v => Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(v),
        font: { size: 12, family: 'Inter' },
        color: '#64748b'
      }
    },
    x: {
      grid: { display: false },
      ticks: { 
        font: { size: 12, family: 'Inter' },
        color: '#64748b'
      }
    },
  },
};

const DONUT_OPTIONS = {
  ...MODERN_CHART_DEFAULTS,
  cutout: '75%',
  plugins: {
    ...MODERN_CHART_DEFAULTS.plugins,
    tooltip: {
      ...MODERN_CHART_DEFAULTS.plugins.tooltip,
      callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` }
    }
  }
};

export default function Dashboard() {
  const { store, currentUser, storeLoading, showToast } = useCRM();
  const navigate  = useNavigate();
  const [year, setYear] = useState('2026');
  const firstName = currentUser?.name?.split(' ')[0] || 'User';
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [leadsChart, setLeadsChart] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, rc, lc, p, ra] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRevenueChart(),
          dashboardAPI.getLeadsChart(),
          dashboardAPI.getPipeline(),
          dashboardAPI.getRecentActivity(),
        ]);
        setStats(s?.data || null);
        setRevenueChart(Array.isArray(rc?.data) ? rc.data : (rc?.data?.results || []));
        setLeadsChart(Array.isArray(lc?.data) ? lc.data : (lc?.data?.results || []));
        setPipeline(Array.isArray(p?.data) ? p.data : (p?.data?.results || []));
        setRecentActivity(Array.isArray(ra?.data) ? ra.data : (ra?.data?.results || []));
      } catch {
        showToast('Failed to load dashboard.', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
    const poll = setInterval(load, 60000);
    return () => clearInterval(poll);
  }, [showToast]);

  const wonVal = Number(stats?.revenue ?? 0) || store.deals.filter(d => d.stage === 'Closed Won').reduce((a,b) => a + Number(b.value), 0);
  const openDeals = Number(stats?.total_deals ?? 0) || store.deals.filter(d => !['Closed Won','Closed Lost'].includes(d.stage)).length;
  const pendingTasks = store.tasks.filter(t => String(t.status || '').toLowerCase() !== 'completed').slice(0, 5);
  const totalContacts = Number(stats?.total_contacts ?? 0) || store.contacts.length;
  const totalLeads = Number(stats?.total_leads ?? 0) || store.leads.length;
  
  const recentLeads = recentActivity.length ? recentActivity.map((a, idx) => ({
    id: a.id || idx,
    name: a.name || a.owner || 'Lead',
    owner: a.owner || 'System',
    company: a.company || a.entity || '-',
    status: a.status || 'New',
    temperature: a.temperature || 'Warm',
  })) : store.leads.slice(0, 5);

  const ALL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const selectedYear = parseInt(year, 10);

  // Group deals by close month for the selected year (always 12 bars)
  const monthlyRevenue = ALL_MONTHS.map((_, monthIdx) => {
    // First try the API revenue chart data
    if (revenueChart.length >= 6) {
      const entry = revenueChart.find((x) => {
        const label = x.label || x.month || x.name || '';
        return label.includes(ALL_MONTHS[monthIdx]) || label.includes(String(monthIdx + 1).padStart(2, '0'));
      });
      if (entry) return Number(entry.value ?? entry.amount ?? 0);
    }
    // Fall back to deriving from store deals
    return store.deals
      .filter((d) => {
        const dateStr = d.closeDate || d.updated || d.created || '';
        if (!dateStr) return false;
        const dt = new Date(dateStr);
        return dt.getFullYear() === selectedYear && dt.getMonth() === monthIdx;
      })
      .reduce((sum, d) => sum + Number(d.value || 0), 0);
  });

  const MONTH_COLORS = [
    '#0f2440', '#1a6b6b', '#d4a843', '#3b82f6', '#8b5cf6', '#10b981',
    '#f59e0b', '#e05c6b', '#06b6d4', '#6366f1', '#14b8a6', '#ef4444',
  ];

  const revenueBarData = {
    labels: ALL_MONTHS,
    datasets: [{
      label: 'Revenue',
      data: monthlyRevenue,
      backgroundColor: monthlyRevenue.map((v, i) => v > 0 ? MONTH_COLORS[i] : 'rgba(200,200,200,0.25)'),
      hoverBackgroundColor: '#d4a843',
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 40,
    }],
  };

  const leadsDonutData = {
    labels: leadsChart.length ? leadsChart.map((x) => x.label || x.status || '') : ['New','Contacted','Qualified','Negotiation'],
    datasets: [{
      data: leadsChart.length ? leadsChart.map((x) => Number(x.value ?? x.count ?? 0)) : [25, 20, 18, 20],
      backgroundColor: ['#0f2440','#d4a843','#e05c6b','#1a3c6b','#8ca6c8'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const TASK_ICON = { Call:'fa-phone', Email:'fa-envelope', Meeting:'fa-calendar', Document:'fa-file' };

  if (loading || storeLoading) {
    return (
      <div className="page-fade dashboard-container">
        <div className="loading-skeleton" />
      </div>
    );
  }

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {firstName}{' '}
            <span className="material-symbols-rounded" style={{ verticalAlign:'middle', fontSize: '24px' }}>
              waving_hand
            </span>
          </h1>
          <p className="page-subtitle">Here's what's happening with your sales pipeline today.</p>
        </div>
        <div className="page-actions" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => navigate('/reports')}>
            <i className="fa-solid fa-chart-line" /> Reports
          </button>
          <button className="btn-primary" onClick={() => navigate('/contacts')}>
            <i className="fa-solid fa-plus" /> Create New
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/contacts')}>
          <div className="txt-muted txt-sm">Total Contacts</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{totalContacts}</div>
          <div className="txt-success txt-sm"><i className="fa-solid fa-arrow-up" /> 12% vs last month</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/leads')}>
          <div className="txt-muted txt-sm">Active Leads</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{totalLeads}</div>
          <div className="txt-success txt-sm"><i className="fa-solid fa-arrow-up" /> 8% vs last month</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/deals')}>
          <div className="txt-muted txt-sm">Open Deals</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{openDeals}</div>
          <div className="txt-success txt-sm"><i className="fa-solid fa-plus" /> 5 new this week</div>
        </div>
        <div className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => navigate('/deals')}>
          <div className="txt-muted txt-sm">Revenue (Won)</div>
          <div className="page-title" style={{ fontSize: 28, marginTop: 4 }}>{currency(wonVal)}</div>
          <div className="txt-success txt-sm"><i className="fa-solid fa-arrow-up" /> 23% from target</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Monthly Revenue Forecast</h3>
            <select
              className="filter-select"
              style={{ fontSize: 13, padding: '4px 8px' }}
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div style={{ position: 'relative', minHeight: 300, flex: 1, width: '100%' }}>
            <Bar data={revenueBarData} options={BAR_OPTIONS} />
          </div>
        </div>

        {/* Lead Distribution */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Lead Distribution</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
            <div style={{ position: 'relative', height: 220, width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={leadsDonutData} options={DONUT_OPTIONS} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 700, display: 'block' }}>{totalLeads}</span>
                <span className="txt-muted txt-sm">Total Leads</span>
              </div>
            </div>
            
            <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {leadsDonutData.labels.map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', marginRight: 6, flexShrink: 0, background: leadsDonutData.datasets[0].backgroundColor[i] }} />
                  <span className="txt-muted" style={{ marginRight: 6 }}>{label}</span>
                  <span className="fw-600">{leadsDonutData.datasets[0].data[i]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Recent Leads */}
        <div className="card" style={{ padding: 0 }}>
          <div className="page-header" style={{ marginBottom: 0, padding: '14px 16px' }}>
            <h3 className="card-title">Recent Leads</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/leads')}>View All</button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name / Owner</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Temperature</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map(l => (
                  <tr key={l.id} onClick={() => navigate('/leads')} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="fw-600">{l.name}</div>
                      <div className="txt-muted txt-sm">{l.owner}</div>
                    </td>
                    <td>{l.company}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>
                        {l.temperature}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card" style={{ padding: 16 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Upcoming Tasks</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/tasks')}>View All</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {pendingTasks.map(t => (
              <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', background: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa ${TASK_ICON[t.type] || 'fa-file'}`} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-600 text-truncate">{t.title}</div>
                  <div className="txt-muted txt-sm text-truncate">{t.related_name || t.owner || 'System Task'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{t.priority || 'Medium'}</div>
                  <div className="txt-muted txt-sm">{fmtDate(t.dueDate)}</div>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 16 }}>No upcoming tasks</div>}
          </div>
        </div>
      </div>

      {/* Pipeline Snapshot */}
      <div className="card" style={{ padding: 16 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h3 className="card-title">Sales Pipeline Snapshot</h3>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/deals')}>Go to Pipeline</button>
        </div>
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, scrollBehavior: 'smooth' }}>
          {PIPELINE_STAGES.map(stage => {
            const deals = pipeline.filter(d => d.stage === stage);
            return (
              <div key={stage} style={{ minWidth: 260, background: 'var(--bg-hover)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                  <span className="fw-600" style={{ color: STAGE_COLORS[stage] }}>{stage}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 12 }}>
                    {deals.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {deals.map(d => (
                    <div key={d.id} className="card" style={{ padding: 12, cursor: 'pointer', marginBottom: 0, boxShadow: 'var(--shadow-sm)' }} onClick={() => navigate('/deals')}>
                      <div className="fw-600 txt-sm" style={{ marginBottom: 4 }}>{d.name}</div>
                      <div className="txt-muted txt-sm" style={{ marginBottom: 8, fontSize: 11 }}>{d.company}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="fw-600" style={{ color: 'var(--primary)', fontSize: 13 }}>{currency(d.value)}</span>
                        <span style={{ fontSize: 10, background: '#e2e8f0', padding: '2px 6px', borderRadius: 12 }}>{d.probability}%</span>
                      </div>
                    </div>
                  ))}
                  {deals.length === 0 && <div className="txt-muted txt-sm" style={{ textAlign: 'center', opacity: 0.6, padding: '16px 0' }}>No deals</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
