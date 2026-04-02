import { useState } from 'react';
import { useCRM } from '../context/CRMContext';

const ENRICHMENT_LOGS = [
  { id: 1, source: 'LinkedIn Data', target: 'Companies', processed: 450, enriched: 380, status: 'Completed', date: '2026-03-10 14:30' },
  { id: 2, source: 'ZoomInfo API', target: 'Contacts', processed: 1200, enriched: 950, status: 'Completed', date: '2026-03-09 09:15' },
  { id: 3, source: 'Clearbit Integration', target: 'Leads', processed: 50, enriched: 45, status: 'In Progress', date: '2026-03-12 11:05' },
  { id: 4, source: 'Hunter.io', target: 'Contacts', processed: 120, enriched: 80, status: 'Failed', date: '2026-03-08 16:20' },
];

export default function DataEnrichment() {
  const { showToast } = useCRM();
  const [filter, setFilter] = useState('All');

  const rows = ENRICHMENT_LOGS.filter(l => {
    return filter === 'All' || l.status === filter;
  });

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Enrichment</h1>
          <p className="page-subtitle">Automatically append firmographic and contact data</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" onClick={() => showToast('Enrichment settings opened')}>
            <i className="fa fa-cog"/> Enrichment Settings
          </button>
          <button className="btn-primary" onClick={() => showToast('Starting enrichment sync...')}>
            <i className="fa fa-magic"/> Start Enrichment Sync
          </button>
        </div>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Data Completeness</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--success)' }}>84%</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>of total records</span>
          </div>
          <div style={{ background: 'var(--bg-hover)', height: '6px', borderRadius: '3px', marginTop: '15px' }}>
            <div style={{ background: 'var(--success)', width: '84%', height: '100%', borderRadius: '3px' }}></div>
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Records Enriched (30 Days)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--primary)' }}>4,250</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>records mapped</span>
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Active Data Sources</div>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
            <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--info)' }}>3</h2>
            <span className="txt-muted" style={{ marginLeft: '10px' }}>API connections</span>
          </div>
          <div style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
            <span className="badge badge-secondary">LinkedIn</span>
            <span className="badge badge-secondary">ZoomInfo</span>
            <span className="badge badge-secondary">Clearbit</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Enrichment Logs</h3>
          <div className="filter-tabs">
            {['All', 'Completed', 'In Progress', 'Failed'].map(f=>(
              <button key={f} className={`filter-tab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Data Source</th>
                <th>Target Entity</th>
                <th>Records Processed</th>
                <th>Successfully Enriched</th>
                <th>Status</th>
                <th>Date / Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(l=>(
                <tr key={l.id}>
                  <td>
                    <div className="fw-600 color-primary"><i className="fa fa-database" style={{ marginRight: '8px', color: 'var(--text-muted)' }}></i> {l.source}</div>
                  </td>
                  <td><span className="badge badge-secondary">{l.target}</span></td>
                  <td>{l.processed.toLocaleString()}</td>
                  <td><span className="fw-500 color-success">{l.enriched.toLocaleString()}</span></td>
                  <td>
                    <span className={`badge badge-${l.status==='Completed'?'success':l.status==='In Progress'?'primary':'danger'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="txt-sm txt-muted">{l.date}</td>
                  <td>
                    <button className="btn-secondary btn-sm" onClick={() => showToast(`Viewing ${l.source} log`)}>View Log</button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7} className="empty-state">
                  <i className="fa fa-magic"/><br/>No enrichment logs found
                </td></tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>
    </div>
  );
}
