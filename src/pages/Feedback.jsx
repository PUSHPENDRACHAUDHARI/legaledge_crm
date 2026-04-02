import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEEDBACK = [
  { id: 1, user: 'John Doe', company: 'Acme Corp', rating: 5, message: 'Great onboarding experience! The team was very helpful.', date: '2026-03-12' },
  { id: 2, user: 'Jane Smith', company: 'TechStart', rating: 3, message: 'The analytics dashboard is a bit confusing to navigate.', date: '2026-03-10' },
  { id: 3, user: 'Bob Johnson', company: 'Global Solutions', rating: 4, message: 'Good product overall, but missing some API endpoints.', date: '2026-03-08' },
  { id: 4, user: 'Alice Williams', company: 'Creative Agency', rating: 5, message: 'Love the new email sequence features!', date: '2026-03-05' },
];

export default function Feedback() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [surveyModal, setSurveyModal] = useState(false);
  const [surveyForm, setSurveyForm] = useState({ recipient: '', type: 'NPS', message: '' });

  const rows = FEEDBACK.filter(f => {
    if (filter === 'All') return true;
    if (filter === 'Promoters') return f.rating >= 4;
    if (filter === 'Detractors') return f.rating <= 2;
    if (filter === 'Passives') return f.rating === 3;
    return true;
  });

  const openInboxReply = (feedback) => {
    navigate('/inbox', {
      state: {
        compose: {
          subject: `Re: Your feedback for ${feedback.company}`,
          body: feedback.user ? `Hi ${feedback.user},\n\n` : '',
        },
      },
    });
  };

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Feedback</h1>
          <p className="page-subtitle">Track NPS and customer satisfaction surveys</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={() => { setSurveyForm({ recipient: '', type: 'NPS', message: '' }); setSurveyModal(true); }}>
            <i className="fa fa-paper-plane" /> Send Survey
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Avg Rating</div>
          <h2 style={{ fontSize: '32px', margin: '10px 0', color: 'var(--primary)' }}>4.2</h2>
          <div style={{ color: 'var(--success)' }}><i className="fa fa-arrow-up" /> 0.3 this month</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Total Responses</div>
          <h2 style={{ fontSize: '32px', margin: '10px 0', color: 'var(--info)' }}>128</h2>
          <div className="txt-muted">Last 30 days</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">NPS Score</div>
          <h2 style={{ fontSize: '32px', margin: '10px 0', color: 'var(--success)' }}>45</h2>
          <div style={{ color: 'var(--success)' }}><i className="fa fa-arrow-up" /> 5 pts</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div className="txt-muted txt-sm fw-600 text-uppercase">Response Rate</div>
          <h2 style={{ fontSize: '32px', margin: '10px 0', color: 'var(--warning)' }}>24%</h2>
          <div className="txt-muted">Average</div>
        </div>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <h3 style={{ margin: 0, fontSize: '16px' }}>Recent Responses</h3>
          <div className="filter-tabs">
            {['All', 'Promoters', 'Passives', 'Detractors'].map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <div className="table-container">
<table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(f => (
                <tr key={f.id}>
                  <td><div className="fw-600">{f.user}</div></td>
                  <td className="txt-muted">{f.company}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '2px', color: f.rating >= 4 ? 'var(--success)' : f.rating <= 2 ? 'var(--danger)' : 'var(--warning)' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <i key={star} className={`fa fa-star${star <= f.rating ? '' : '-o'}`} />
                      ))}
                    </div>
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{f.message}"
                    </div>
                  </td>
                  <td className="txt-sm txt-muted">{f.date}</td>
                  <td>
                    <button className="btn-secondary btn-sm" onClick={() => openInboxReply(f)}>Reply</button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={6} className="empty-state">
                  <i className="fa fa-comments" /><br />No feedback found
                </td></tr>
              )}
            </tbody>
          </table>
</div>
        </div>
      </div>

      {/* Send Survey Modal */}
      {surveyModal && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) setSurveyModal(false); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fa fa-paper-plane" /> Send Survey</h3>
              <button className="modal-close" onClick={() => setSurveyModal(false)}><i className="fa fa-times" /></button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label className="form-label">Recipient Email / List <span className="required">*</span></label>
                <input className="form-control" value={surveyForm.recipient} onChange={e => setSurveyForm({ ...surveyForm, recipient: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Survey Type</label>
                <select className="form-control" value={surveyForm.type} onChange={e => setSurveyForm({ ...surveyForm, type: e.target.value })}>
                  <option>NPS</option>
                  <option>CSAT</option>
                  <option>Product Feedback</option>
                  <option>Support Survey</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Custom Message</label>
                <textarea className="form-control" rows={3} value={surveyForm.message} onChange={e => setSurveyForm({ ...surveyForm, message: e.target.value })} />
              </div>
            </div>
            <div className="form-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: '10px', justifyContent: 'flex-end', background: 'transparent', borderTop: 'none' }}>
              <button className="btn-secondary" onClick={() => setSurveyModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                if (!surveyForm.recipient.trim()) return alert('Please enter a recipient.');
                setSurveyModal(false);
                alert('Survey sent successfully!');
              }}><i className="fa fa-paper-plane" /> Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
