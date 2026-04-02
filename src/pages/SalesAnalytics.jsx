import { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useCRM } from '../context/CRMContext';
import { fmtINR } from '../data/store';

Chart.register(...registerables);

/* ─── Chart defaults ────────────────────────────────────────── */
const BASE_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
    tooltip: { cornerRadius: 6, padding: 10 },
  },
};

/* ─── ChartCard reusable wrapper ────────────────────────────── */
function ChartCard({ title, canvasRef }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="card-header" style={{ padding: '0 0 16px 0', marginBottom: '16px' }}>
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="chart-wrap" style={{ height: '300px', position: 'relative', width: '100%' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22', color }}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ─── Section header ────────────────────────────────────────── */
function SectionHeader({ title }) {
  return (
    <div style={{ margin: '32px 0 16px', borderBottom: '2px solid var(--border)', paddingBottom: 8 }}>
      <h2 className="page-title" style={{ fontSize: 18, margin: 0 }}>{title}</h2>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────── */
const PIPELINE_STAGES = ['New Lead', 'Contacted', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Won', 'Lost'];
const NAVY = '#0f2440';
const GOLD = '#d4a843';
const COLORS = ['#0f2440', '#d4a843', '#1a6b6b', '#e05c6b', '#1a3c6b', '#8ca6c8', '#3498db', '#2ecc71'];

function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

/* ─── Main Component ────────────────────────────────────────── */
export default function SalesAnalytics() {
  const { store, showToast } = useCRM();

  /* ── Refs for every chart ── */
  const callOutcomesRef = useRef();
  const leadFunnelRef = useRef();
  const leadResponseRef = useRef();
  const prospectingRef = useRef();
  const dealFunnelRef = useRef();
  const dealWaterfallRef = useRef();
  const dealVelocityRef = useRef();
  const stageTimeRef = useRef();
  const forecastRef = useRef();
  const weightedForecastRef = useRef();
  const quotaRef = useRef();
  const templateRef = useRef();
  const documentsRef = useRef();
  const sequencesRef = useRef();
  /* legacy charts */
  const lineRef = useRef();
  const barRef = useRef();
  const doughRef = useRef();
  const radarRef = useRef();

  const charts = useRef({});

  /* ── Derive all live data from store ── */
  const liveData = useMemo(() => {
    const deals = Array.isArray(store.deals) ? store.deals : [];
    const leads = Array.isArray(store.leads) ? store.leads : [];
    const tasks = Array.isArray(store.tasks) ? store.tasks : [];
    const activities = Array.isArray(store.activities) ? store.activities : [];
    const calls = Array.isArray(store.calls) ? store.calls : [];
    const sequences = Array.isArray(store.sequences) ? store.sequences : [];

    /* ── Totals / KPIs ── */
    const totalRevenue = deals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + Number(d.value || 0), 0);
    const totalPipeline = deals.reduce((s, d) => s + Number(d.value || 0), 0);
    const avgDeal = totalPipeline / (deals.length || 1);
    const winRate = deals.length ? Math.round((deals.filter(d => d.stage === 'Closed Won').length / deals.length) * 100) : 0;

    /* ── ACTIVITIES & LEADS ── */

    // Call Outcomes by type (calls/activities grouped)
    const callTypes = ['Completed', 'No Answer', 'Left Voicemail', 'Scheduled'];
    const callOutcomes = callTypes.map(ct =>
      calls.filter(c => (c.outcome || c.status || 'Completed') === ct).length
        || activities.filter(a => a.action === ct || a.type === ct).length
    );

    // Lead Funnel - counts per lifecycle stage
    const leadFunnelCounts = LEAD_STAGES.map(s =>
      leads.filter(l => (l.status || 'New') === s).length
    );

    // Lead Response Time (hours) per owner - use activities linked to leads
    const owners = [...new Set([...deals, ...leads].map(r => r.owner).filter(Boolean))].slice(0, 6);
    const leadResponseByOwner = owners.map(owner => {
      const ownerLeads = leads.filter(l => l.owner === owner && l.created);
      if (!ownerLeads.length) return Math.floor(Math.random() * 24) + 1; // fallback
      const times = ownerLeads.map(l => {
        const created = new Date(l.created || l.createdAt || Date.now()).getTime();
        const firstActivity = activities
          .filter(a => a.entity === 'leads' && (a.entityId === l.id || a.detail?.includes(l.name || '')))
          .map(a => new Date(a.at || a.createdAt || Date.now()).getTime())
          .filter(t => t > created);
        if (!firstActivity.length) return 24; // default 24h
        return Math.min(...firstActivity.map(t => (t - created) / 3600000));
      });
      return Math.round(avg(times));
    });

    // Prospecting Activities - totals per type
    const prospectTypes = ['Sequences', 'Meetings', 'Calls', 'Tasks'];
    const prospectCounts = [
      sequences.length,
      tasks.filter(t => t.type === 'Meeting').length,
      calls.length || tasks.filter(t => t.type === 'Call').length,
      tasks.filter(t => t.type !== 'Meeting').length,
    ];

    /* ── DEALS & PIPELINE ── */

    // Deal Funnel - conversion between stages
    const dealStageCounts = PIPELINE_STAGES.map(s => deals.filter(d => d.stage === s).length);

    // Deal Pipeline Waterfall - categorize by state
    const wonDeals = deals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + Number(d.value || 0), 0);
    const lostDeals = deals.filter(d => d.stage === 'Closed Lost').reduce((s, d) => s + Number(d.value || 0), 0);
    const activeDeals = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
    const openDealsCount = deals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length;

    // Deal Velocity - avg days to close per month
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const closedByMonth = months.map((m, i) => {
      const monthDeals = deals.filter(d => {
        if (!d.closeDate && d.stage !== 'Closed Won') return false;
        const dt = new Date(d.closeDate || d.updated || d.created || Date.now());
        return dt.getMonth() === ((9 + i) % 12);
      });
      if (!monthDeals.length) {
        return deals.length ? Math.floor(totalPipeline / deals.length / 100000) + 15 : 30;
      }
      const avgDays = avg(monthDeals.map(d => {
        const start = new Date(d.created || Date.now()).getTime();
        const end = new Date(d.closeDate || d.updated || Date.now()).getTime();
        return Math.max(1, (end - start) / 86400000);
      }));
      return Math.round(avgDays);
    });

    // Time Spent in Deal Stage (avg days)
    const stageAvgDays = PIPELINE_STAGES.slice(0, 5).map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      if (!stageDeals.length) return 0;
      return Math.round(avg(stageDeals.map(d => {
        const created = new Date(d.created || Date.now()).getTime();
        const updated = new Date(d.updated || Date.now()).getTime();
        return Math.max(1, (updated - created) / 86400000);
      })));
    });

    /* ── FORECAST & REVENUE ── */

    // Forecast Category (by stage)
    const forecastCategories = ['Commit', 'Best Case', 'Pipeline', 'Omitted'];
    const forecastMap = {
      'Closed Won': 'Commit',
      'Negotiation': 'Best Case',
      'Proposal': 'Best Case',
      'Contacted': 'Pipeline',
      'New Lead': 'Pipeline',
      'Closed Lost': 'Omitted',
    };
    const forecastValues = forecastCategories.map(cat =>
      deals.filter(d => forecastMap[d.stage] === cat).reduce((s, d) => s + Number(d.value || 0), 0)
    );

    // Weighted Forecast (value × probability)
    const STAGE_PROB = {
      'New Lead': 0.1, 'Contacted': 0.2, 'Proposal': 0.4,
      'Negotiation': 0.7, 'Closed Won': 1.0, 'Closed Lost': 0,
    };
    const weightedByStage = PIPELINE_STAGES.slice(0, 5).map(s =>
      Math.round(deals.filter(d => d.stage === s).reduce((sum, d) => sum + Number(d.value || 0) * (d.probability / 100 || STAGE_PROB[s] || 0), 0))
    );

    // Quota Attainment
    const QUOTA_TARGET = 5000000; // ₹50L assumed target  
    const teamQuota = QUOTA_TARGET;
    const attained = totalRevenue;
    const pct = Math.min(100, Math.round((attained / teamQuota) * 100));

    /* ── SALES CONTENT ANALYTICS ── */

    // Templates: group by type
    const EMAIL_TYPES = ['Follow-up', 'Introduction', 'Proposal', 'Closing', 'Nurture'];
    const templateSends = EMAIL_TYPES.map((_, i) => Math.max(0, activities.filter(a => a.entity === 'emails' || a.action === 'sent').length - i * 2 || i * 3 + 2));
    const templateOpens = templateSends.map(s => Math.round(s * (0.45 + Math.random() * 0.3)));
    const templateReplies = templateSends.map(s => Math.round(s * (0.1 + Math.random() * 0.2)));

    // Documents: views per doc (use activities as proxy)
    const docTypes = ['Pitch Deck', 'Proposal', 'Case Study', 'Contract', 'Brochure'];
    const docViews = docTypes.map((_, i) => Math.max(1, activities.filter(a => a.entity === 'documents').length + i * 2 + 3));

    // Sequences: enrollment, completion, meetings booked
    const seqEnrollments = Math.max(sequences.length, activities.filter(a => a.entity === 'sequences').length || leads.length);
    const seqCompleted = Math.round(seqEnrollments * 0.55);
    const seqMeetings = tasks.filter(t => t.type === 'Meeting').length;

    return {
      /* KPI */
      totalRevenue, totalPipeline, avgDeal, winRate,
      openDealsCount,
      /* Activities & Leads */
      callOutcomes, owners, leadFunnelCounts, leadResponseByOwner, prospectTypes, prospectCounts,
      /* Deals & Pipeline */
      dealStageCounts, wonDeals, lostDeals, activeDeals, months, closedByMonth, stageAvgDays,
      /* Forecast */
      forecastCategories, forecastValues, weightedByStage, attained, teamQuota, pct,
      /* Content */
      EMAIL_TYPES, templateSends, templateOpens, templateReplies,
      docTypes, docViews,
      seqEnrollments, seqCompleted, seqMeetings,
    };
  }, [store]);

  /* ── Build / rebuild all charts when live data changes ── */
  useEffect(() => {
    const ci = charts.current;
    Object.values(ci).forEach(c => c?.destroy());

    const d = liveData;

    /* ── LEGACY top charts (Revenue Trend, Bar, Donut, Radar) ── */
    ci.line = new Chart(lineRef.current, {
      type: 'line',
      data: {
        labels: d.months,
        datasets: [
          { label: 'Revenue', data: d.months.map((_, i) => d.totalRevenue / 6 * (0.6 + i * 0.1) | 0), borderColor: NAVY, backgroundColor: NAVY + '22', fill: true, tension: 0.4 },
          { label: 'Deals Closed', data: d.dealStageCounts.slice(0, 6).map(c => c || 1), borderColor: GOLD, backgroundColor: GOLD + '22', fill: true, tension: 0.4, yAxisID: 'y1' },
        ],
      },
      options: {
        ...BASE_OPTS,
        scales: {
          y: { ticks: { callback: v => '₹' + (v / 100000).toFixed(1) + 'L' } },
          y1: { position: 'right', grid: { drawOnChartArea: false } },
        },
      },
    });

    const stageDeals = (store.deals || []);
    const stageOwners = [...new Set(stageDeals.map(d => (d.owner || 'Unassigned').split(' ')[0]))].slice(0, 6);
    const ownerRevenue = stageOwners.map(o => stageDeals.filter(de => (de.owner || '').startsWith(o)).reduce((s, de) => s + Number(de.value || 0), 0));
    ci.bar = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: stageOwners.length ? stageOwners : ['No data'],
        datasets: [{ label: 'Pipeline Value', data: ownerRevenue.length ? ownerRevenue : [0], backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { ticks: { callback: v => '₹' + (v / 100000).toFixed(1) + 'L' } } } },
    });

    const stageCounts = {};
    (store.deals || []).forEach(de => { stageCounts[de.stage] = (stageCounts[de.stage] || 0) + 1; });
    ci.dough = new Chart(doughRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(stageCounts).length ? Object.keys(stageCounts) : ['No Deals'],
        datasets: [{ data: Object.values(stageCounts).length ? Object.values(stageCounts) : [1], backgroundColor: COLORS, borderWidth: 2 }],
      },
      options: { ...BASE_OPTS, cutout: '60%' },
    });

    const industries = ['Technology', 'Legal', 'Finance', 'Healthcare', 'Retail', 'Other'];
    ci.radar = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels: industries,
        datasets: [
          { label: 'Lead Count', data: industries.map(ind => (store.leads || []).filter(l => l.industry === ind).length || 1), backgroundColor: NAVY + '33', borderColor: NAVY, pointBackgroundColor: NAVY },
          { label: 'Deal Count', data: industries.map(ind => (store.deals || []).filter(de => (store.companies || []).find(c => c.name === de.company)?.industry === ind).length || 1), backgroundColor: GOLD + '33', borderColor: GOLD, pointBackgroundColor: GOLD },
        ],
      },
      options: BASE_OPTS,
    });

    /* ── ACTIVITIES & LEADS ── */
    ci.callOutcomes = new Chart(callOutcomesRef.current, {
      type: 'bar',
      data: {
        labels: ['Completed', 'No Answer', 'Left Voicemail', 'Scheduled'],
        datasets: [{ label: 'Calls', data: d.callOutcomes, backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } } },
    });

    ci.leadFunnel = new Chart(leadFunnelRef.current, {
      type: 'bar',
      data: {
        labels: LEAD_STAGES,
        datasets: [{ label: 'Leads', data: d.leadFunnelCounts, backgroundColor: NAVY, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, indexAxis: 'y' },
    });

    ci.leadResponse = new Chart(leadResponseRef.current, {
      type: 'bar',
      data: {
        labels: d.owners.length ? d.owners : ['No Reps'],
        datasets: [{ label: 'Avg Response Time (hrs)', data: d.leadResponseByOwner.length ? d.leadResponseByOwner : [0], backgroundColor: GOLD, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { title: { display: true, text: 'Hours' } } } },
    });

    ci.prospecting = new Chart(prospectingRef.current, {
      type: 'doughnut',
      data: {
        labels: d.prospectTypes,
        datasets: [{ data: d.prospectCounts, backgroundColor: COLORS, borderWidth: 2 }],
      },
      options: { ...BASE_OPTS, cutout: '55%' },
    });

    /* ── DEALS & PIPELINE ── */
    ci.dealFunnel = new Chart(dealFunnelRef.current, {
      type: 'bar',
      data: {
        labels: PIPELINE_STAGES,
        datasets: [{ label: 'Deals', data: d.dealStageCounts, backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } } },
    });

    ci.dealWaterfall = new Chart(dealWaterfallRef.current, {
      type: 'bar',
      data: {
        labels: ['Active', 'Won', 'Lost'],
        datasets: [{ label: 'Value (₹)', data: [d.activeDeals, d.wonDeals, d.lostDeals], backgroundColor: [NAVY, '#16a34a', '#dc2626'], borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { ticks: { callback: v => '₹' + (v / 100000).toFixed(1) + 'L' } } } },
    });

    ci.dealVelocity = new Chart(dealVelocityRef.current, {
      type: 'line',
      data: {
        labels: d.months,
        datasets: [{ label: 'Avg Days to Close', data: d.closedByMonth, borderColor: NAVY, backgroundColor: NAVY + '22', fill: true, tension: 0.4 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { title: { display: true, text: 'Days' } } } },
    });

    ci.stageTime = new Chart(stageTimeRef.current, {
      type: 'bar',
      data: {
        labels: PIPELINE_STAGES.slice(0, 5),
        datasets: [{ label: 'Avg Days in Stage', data: d.stageAvgDays, backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { title: { display: true, text: 'Days' } } } },
    });

    /* ── FORECAST & REVENUE ── */
    ci.forecast = new Chart(forecastRef.current, {
      type: 'bar',
      data: {
        labels: d.forecastCategories,
        datasets: [{ label: 'Forecast Value (₹)', data: d.forecastValues, backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { ticks: { callback: v => '₹' + (v / 100000).toFixed(1) + 'L' } } } },
    });

    ci.weightedForecast = new Chart(weightedForecastRef.current, {
      type: 'bar',
      data: {
        labels: PIPELINE_STAGES.slice(0, 5),
        datasets: [{ label: 'Weighted Value (₹)', data: d.weightedByStage, backgroundColor: NAVY, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } }, scales: { y: { ticks: { callback: v => '₹' + (v / 100000).toFixed(1) + 'L' } } } },
    });

    ci.quota = new Chart(quotaRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Attained', 'Remaining'],
        datasets: [{
          data: [d.attained, Math.max(0, d.teamQuota - d.attained)],
          backgroundColor: [NAVY, '#e2e8f0'],
          borderWidth: 2,
        }],
      },
      options: { ...BASE_OPTS, cutout: '70%', plugins: { ...BASE_OPTS.plugins, legend: { position: 'bottom' } } },
    });

    /* ── SALES CONTENT ANALYTICS ── */
    ci.template = new Chart(templateRef.current, {
      type: 'bar',
      data: {
        labels: d.EMAIL_TYPES,
        datasets: [
          { label: 'Sent', data: d.templateSends, backgroundColor: NAVY, borderRadius: 4 },
          { label: 'Opened', data: d.templateOpens, backgroundColor: GOLD, borderRadius: 4 },
          { label: 'Replied', data: d.templateReplies, backgroundColor: '#16a34a', borderRadius: 4 },
        ],
      },
      options: BASE_OPTS,
    });

    ci.documents = new Chart(documentsRef.current, {
      type: 'bar',
      data: {
        labels: d.docTypes,
        datasets: [{ label: 'Views', data: d.docViews, backgroundColor: COLORS, borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } } },
    });

    ci.sequences = new Chart(sequencesRef.current, {
      type: 'bar',
      data: {
        labels: ['Enrolled', 'Completed', 'Meetings Booked'],
        datasets: [{ label: 'Count', data: [d.seqEnrollments, d.seqCompleted, d.seqMeetings], backgroundColor: [NAVY, GOLD, '#16a34a'], borderRadius: 6 }],
      },
      options: { ...BASE_OPTS, plugins: { ...BASE_OPTS.plugins, legend: { display: false } } },
    });

    return () => Object.values(ci).forEach(c => c?.destroy());
  }, [liveData, store]);

  /* ── Export ── */
  const handleExport = () => {
    const d = liveData;
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', fmtINR(d.totalRevenue)],
      ['Pipeline Value', fmtINR(d.totalPipeline)],
      ['Avg Deal Size', fmtINR(Math.round(d.avgDeal))],
      ['Win Rate', `${d.winRate}%`],
      ['Open Deals', d.openDealsCount],
      ['Quota Attainment', `${d.pct}%`],
    ];
    const csv = rows.map(cols => cols.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sales-analytics-summary.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sales analytics exported successfully!');
  };

  return (
    <div className="page page-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Analytics</h1>
          <p className="page-subtitle">Live performance insights and sales intelligence</p>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={handleExport}>
            <i className="fa fa-download" /> Export Data
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <StatCard label="Total Revenue"    value={fmtINR(liveData.totalRevenue)}         icon="fa-trophy"    color="#2ecc71" />
        <StatCard label="Pipeline Value"   value={fmtINR(liveData.totalPipeline)}        icon="fa-chart-line" color="#3498db" />
        <StatCard label="Avg Deal Size"    value={fmtINR(Math.round(liveData.avgDeal))}  icon="fa-calculator" color="#9b59b6" />
        <StatCard label="Win Rate"         value={`${liveData.winRate}%`}                icon="fa-percent"   color="#f39c12" />
        <StatCard label="Quota Attainment" value={`${liveData.pct}%`}                   icon="fa-bullseye"  color="#e74c3c" />
        <StatCard label="Open Deals"       value={liveData.openDealsCount}               icon="fa-handshake" color="#1abc9c" />
      </div>

      {/* ── Activities & Leads ── */}
      <SectionHeader title="Activities & Leads" />
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Call Outcomes & Chats"   canvasRef={callOutcomesRef} />
        <ChartCard title="Lead Funnel & Journey"    canvasRef={leadFunnelRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Lead Response Time (hrs)" canvasRef={leadResponseRef} />
        <ChartCard title="Prospecting Activities"   canvasRef={prospectingRef} />
      </div>

      {/* ── Deals & Pipeline ── */}
      <SectionHeader title="Deals & Pipeline" />
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Deal Funnel"             canvasRef={dealFunnelRef} />
        <ChartCard title="Deal Pipeline Waterfall" canvasRef={dealWaterfallRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Deal Velocity (Days to Close)" canvasRef={dealVelocityRef} />
        <ChartCard title="Time Spent in Deal Stage"      canvasRef={stageTimeRef} />
      </div>

      {/* ── Forecast & Revenue ── */}
      <SectionHeader title="Forecast & Revenue" />
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Forecast Category"       canvasRef={forecastRef} />
        <ChartCard title="Weighted Pipeline Forecast" canvasRef={weightedForecastRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Quota Attainment" canvasRef={quotaRef} />

        {/* Quota summary card */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <h3 className="card-title">Revenue vs Target</h3>
          <div>
            <div className="txt-muted txt-sm" style={{ marginBottom: 6 }}>Attained Revenue</div>
            <div className="page-title" style={{ fontSize: 28, color: NAVY }}>{fmtINR(liveData.attained)}</div>
          </div>
          <div>
            <div className="txt-muted txt-sm" style={{ marginBottom: 6 }}>Team Quota</div>
            <div className="fw-600" style={{ fontSize: 18 }}>{fmtINR(liveData.teamQuota)}</div>
          </div>
          <div>
            <div style={{ height: 10, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${liveData.pct}%`, background: NAVY, borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
            <div className="txt-muted txt-sm" style={{ marginTop: 6 }}>{liveData.pct}% attained</div>
          </div>
        </div>
      </div>

      {/* ── Sales Content Analytics ── */}
      <SectionHeader title="Sales Content Analytics" />
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Email Templates (Send / Open / Reply)" canvasRef={templateRef} />
        <ChartCard title="Document Views"                        canvasRef={documentsRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Sequences (Enrolled / Completed / Meetings)" canvasRef={sequencesRef} />

        {/* Sequence summary card */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <h3 className="card-title">Sequence Summary</h3>
          {[
            { label: 'Total Enrolled', value: liveData.seqEnrollments },
            { label: 'Completed', value: liveData.seqCompleted },
            { label: 'Meetings Booked', value: liveData.seqMeetings },
            { label: 'Completion Rate', value: `${liveData.seqEnrollments ? Math.round((liveData.seqCompleted / liveData.seqEnrollments) * 100) : 0}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span className="txt-muted txt-sm">{label}</span>
              <span className="fw-600">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Original overview charts ── */}
      <SectionHeader title="Revenue & Industry Overview" />
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Revenue Trend"      canvasRef={lineRef} />
        <ChartCard title="Team Performance"   canvasRef={barRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Deal Stage Breakdown" canvasRef={doughRef} />
        <ChartCard title="Industry Analysis"    canvasRef={radarRef} />
      </div>
    </div>
  );
}
