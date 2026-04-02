import { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { useCRM } from '../context/CRMContext';
import { fmtINR, OWNERS } from '../data/store';
Chart.register(...registerables);

function ChartCard({ title, canvasRef }) {
  return (
    <div className="card">
      <div className="card-header"><h3>{title}</h3></div>
      <div className="chart-wrap"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}

export default function Reports() {
  const { store } = useCRM();
  const lineRef = useRef(); const barRef = useRef();
  const doughRef = useRef(); const radarRef = useRef();
  const charts = useRef({});

  useEffect(() => {
    const chartInstances = charts.current;
    Object.values(chartInstances).forEach(c => c?.destroy());

    const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    chartInstances.line = new Chart(lineRef.current, {
      type:'line',
      data:{ labels:months, datasets:[
        { label:'Revenue', data:[620000,810000,950000,750000,1100000,980000], borderColor:'#3498db', backgroundColor:'rgba(52,152,219,0.1)', fill:true, tension:0.4 },
        { label:'Deals Closed', data:[3,5,7,4,8,6], borderColor:'#2ecc71', backgroundColor:'rgba(46,204,113,0.1)', fill:true, tension:0.4, yAxisID:'y1' },
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } },
        scales:{ y:{ ticks:{ callback: v => '₹'+v.toLocaleString('en-IN') } }, y1:{ position:'right', grid:{ drawOnChartArea:false } } }
      }
    });

    const ownerRevenue = OWNERS.map(o => store.deals.filter(d=>d.owner===o).reduce((s,d)=>s+d.value,0));
    chartInstances.bar = new Chart(barRef.current, {
      type:'bar',
      data:{ labels: OWNERS.map(o=>o.split(' ')[0]), datasets:[
        { label:'Pipeline Value', data:ownerRevenue, backgroundColor:['#3498db','#2ecc71','#9b59b6','#f39c12','#e74c3c','#1abc9c'], borderRadius:6 },
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ ticks:{ callback: v => '₹'+(v/100000).toFixed(1)+'L' } } } }
    });

    const stageCounts = {};
    store.deals.forEach(d => { stageCounts[d.stage] = (stageCounts[d.stage]||0)+1; });
    chartInstances.dough = new Chart(doughRef.current, {
      type:'doughnut',
      data:{ labels:Object.keys(stageCounts), datasets:[{ data:Object.values(stageCounts), backgroundColor:['#3498db','#9b59b6','#f39c12','#e67e22','#2ecc71','#e74c3c'], borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'60%', plugins:{ legend:{ position:'right' } } }
    });

    const industries = ['Technology','Legal','Finance','Healthcare','Retail','Other'];
    chartInstances.radar = new Chart(radarRef.current, {
      type:'radar',
      data:{ labels:industries, datasets:[
        { label:'Lead Count', data: industries.map(ind => store.leads.filter(l=>l.industry===ind).length || Math.floor(Math.random()*5)+1), backgroundColor:'rgba(52,152,219,0.2)', borderColor:'#3498db', pointBackgroundColor:'#3498db' },
        { label:'Deal Count', data: industries.map(ind => store.deals.filter(d=>store.companies.find(c=>c.name===d.company)?.industry===ind).length || Math.floor(Math.random()*3)+1), backgroundColor:'rgba(46,204,113,0.2)', borderColor:'#2ecc71', pointBackgroundColor:'#2ecc71' },
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } } }
    });

    return () => Object.values(chartInstances).forEach(c => c?.destroy());
  }, [store.companies, store.deals, store.leads]);

  const totalRevenue = store.deals.filter(d=>d.stage==='Closed Won').reduce((s,d)=>s+d.value,0);
  const totalPipeline = store.deals.reduce((s,d)=>s+d.value,0);
  const avgDeal = totalPipeline / (store.deals.length || 1);
  const winRate = Math.round((store.deals.filter(d=>d.stage==='Closed Won').length / store.deals.length) * 100);

  return (
    <div className="page page-fade">
      <div className="page-header">
        <div><h1 className="page-title">Sales Analytics</h1><p className="page-subtitle">Performance insights for your team</p></div>
      </div>

      <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px'}}>
        {[
          { label:'Total Revenue', value:fmtINR(totalRevenue), icon:'fa-trophy', color:'#2ecc71' },
          { label:'Pipeline Value', value:fmtINR(totalPipeline), icon:'fa-chart-line', color:'#3498db' },
          { label:'Avg Deal Size', value:fmtINR(Math.round(avgDeal)), icon:'fa-calculator', color:'#9b59b6' },
          { label:'Win Rate', value:winRate+'%', icon:'fa-percent', color:'#f39c12' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-icon" style={{background:k.color+'22',color:k.color}}><i className={`fa-solid ${k.icon}`}></i></div>
            <div className="stat-body"><div className="stat-value">{k.value}</div><div className="stat-label">{k.label}</div></div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        <ChartCard title="Revenue Trend" canvasRef={lineRef} />
        <ChartCard title="Team Performance" canvasRef={barRef} />
      </div>
      <div className="dashboard-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', marginTop: '24px' }}>
        <ChartCard title="Deal Stage Breakdown" canvasRef={doughRef} />
        <ChartCard title="Industry Analysis" canvasRef={radarRef} />
      </div>
    </div>
  );
}
