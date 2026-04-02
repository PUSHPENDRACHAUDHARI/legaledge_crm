import { useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { emailAPI } from '../services/api';
import { isSmtpConfigError, openProviderCompose } from '../utils/emailClientFallback';

const TEMPLATES = {
  followup: {
    subject: 'Following up on our conversation',
    body: `Hi,\n\nI wanted to follow up on our recent conversation about LegalEdge CRM.\n\nWould you be available for a quick call this week to discuss next steps?\n\nBest regards,\nShailesh Bhange\nLegalEdge CRM`,
  },
  proposal: {
    subject: 'LegalEdge CRM - Proposal',
    body: `Dear,\n\nThank you for your interest in LegalEdge CRM.\n\nPlease find our tailored proposal below. Key highlights:\n- Full CRM platform with Breeze AI\n- Dedicated onboarding support\n- 24/7 technical assistance\n\nLet me know if you'd like to schedule a demo.\n\nBest regards,\nShailesh Bhange`,
  },
  welcome: {
    subject: 'Welcome to LegalEdge CRM!',
    body: `Hi,\n\nWelcome to LegalEdge CRM! We're thrilled to have you on board.\n\nYour account is now active. Our onboarding team will be in touch shortly to get you set up.\n\nBest regards,\nThe LegalEdge Team`,
  },
};

export default function EmailModal({ open, onClose, defaultTo = '', defaultSubject = '' }) {
  const { showToast, currentUser } = useCRM();
  const user = currentUser || null;
  const [from, setFrom] = useState(user?.email || '');
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFrom(user?.email || '');
  }, [user?.email]);

  useEffect(() => {
    if (!open) return;
    setTo(defaultTo || '');
    setSubject(defaultSubject || '');
    setCc('');
    setBody('');
    setErrors({});
    setFrom(user?.email || '');
  }, [open, defaultTo, defaultSubject, user?.email]);

  if (!open) return null;

  function validate() {
    const nextErrors = {};
    if (!from) nextErrors.from = 'From email is required';
    if (!to) nextErrors.to = 'Email is required';
    if (!subject) nextErrors.subject = 'Subject is required';
    if (!body) nextErrors.body = 'Message is required';
    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  function applyTemplate(key) {
    const tpl = TEMPLATES[key];
    setSubject(tpl.subject);
    setBody(tpl.body);
  }

  async function sendEmail() {
    if (!validate()) return;

    const payload = {
      from: from || user?.email || '',
      to,
      cc,
      subject,
      body,
    };

    try {
      await emailAPI.send(payload);
      showToast('Email sent successfully.');
      onClose();
    } catch (err) {
      if (isSmtpConfigError(err)) {
        openProviderCompose('mailto', payload);
        showToast('Backend email is unavailable. Opened your mail app instead.', 'info');
        return;
      }
      showToast(err?.message || 'Failed to send email.', 'error');
    }
  }

  return (
    <div
      className="modal-overlay show"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>
            <i className="fa fa-envelope" style={{ color: 'var(--primary)', marginRight: 8 }} />
            Compose Email
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>x</button>
        </div>

        <div className="form-body">
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e3a8a',
              fontSize: 13,
            }}
          >
            Emails will be sent internally, through a connected email account, or via SMTP.
          </div>

          <div className="form-group">
            <label className="form-label">From</label>
            <input
              className={`form-control${errors.from ? ' is-err' : ''}`}
              type="email"
              placeholder="Logged in user email"
              value={from}
              readOnly
              style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
            />
            {errors.from && <div className="field-error">{errors.from}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              To <span className="required">*</span>
            </label>
            <input className={`form-control${errors.to ? ' is-err' : ''}`} value={to} onChange={(e) => setTo(e.target.value)} />
            {errors.to && <div className="field-error">{errors.to}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">CC</label>
            <input
              className={`form-control${errors.cc ? ' is-err' : ''}`}
              type="email"
              placeholder="cc@example.com (optional)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
            {errors.cc && <div className="field-error">{errors.cc}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Subject <span className="required">*</span>
            </label>
            <input
              className={`form-control${errors.subject ? ' is-err' : ''}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            {errors.subject && <div className="field-error">{errors.subject}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Message <span className="required">*</span>
            </label>
            <textarea
              className={`form-control${errors.body ? ' is-err' : ''}`}
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {errors.body && <div className="field-error">{errors.body}</div>}
          </div>

          <div className="email-template-bar">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick Templates:</span>
            {['followup', 'proposal', 'welcome'].map((key) => (
              <button type="button" key={key} className="email-tmpl-btn" onClick={() => applyTemplate(key)}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div
          className="form-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            marginTop: 4,
          }}
        >
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={sendEmail}>
            <i className="fa fa-paper-plane" /> Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
