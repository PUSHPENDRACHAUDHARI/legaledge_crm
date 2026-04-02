import { useState, useEffect, useMemo } from 'react';
import { useCRM } from '../../context/CRMContext';

const EMPTY_COMPOSE = { 
  to: '', 
  cc: '',
  fromName: 'Shailesh Bhange', 
  fromEmail: 'shailesh@company.com', 
  replyTo: '',
  subject: '', 
  body: '',
  signature: 'Best regards,\nShailesh Bhange',
  sendTime: 'Send immediately',
  language: 'English',
  encoding: 'UTF-8'
};

const TEMPLATES = {
  followup: {
    subject: 'Following up on our conversation',
    body: `Hi,\n\nI wanted to follow up on our recent conversation and check if you had a chance to review the information we discussed.\n\nPlease let me know if you have any questions or need any clarification.\n\nLooking forward to hearing from you.\n\nBest regards`,
  },
  proposal: {
    subject: 'LegalEdge CRM Proposal',
    body: `Hi,\n\nThank you for your interest in LegalEdge CRM. Please find below the proposal details tailored to your requirements.\n\nOur solution includes:\n- Complete CRM platform\n- Dedicated onboarding support\n- 24/7 customer service\n\nWe'd love to schedule a quick call to walk you through the details.\n\nBest regards`,
  },
  welcome: {
    subject: 'Welcome to LegalEdge CRM!',
    body: `Hi,\n\nWelcome aboard! We're thrilled to have you with us.\n\nYour account has been set up and you can now start exploring all the features LegalEdge CRM has to offer.\n\nIf you need any help getting started, feel free to reach out to our support team at any time.\n\nBest regards`,
  },
};

const PROVIDERS = [
  { key: 'gmail',   label: 'Gmail',   icon: 'fa-envelope', color: '#ea4335' },
  { key: 'outlook', label: 'Outlook', icon: 'fa-envelope', color: '#0078d4' },
  { key: 'emailjs', label: 'EmailJS', icon: 'fa-paper-plane', color: 'var(--primary)' },
];

function openMailto({ to = '', cc = '', subject = '', body = '' }) {
  const query = [
    cc ? `cc=${encodeURIComponent(cc)}` : '',
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ].filter(Boolean).join('&');
  const url = `mailto:${encodeURIComponent(to)}${query ? `?${query}` : ''}`;
  window.location.href = url;
}

export default function EmailPage() {
  const { store, addRecord, showToast } = useCRM();
  const [selected,      setSelected]      = useState(null);
  const [reply,         setReply]         = useState('');
  const [composeOpen,   setComposeOpen]   = useState(false);
  const [compose,       setCompose]       = useState(EMPTY_COMPOSE);
  const [composeErrors, setComposeErrors] = useState({});
  const [provider,      setProvider]      = useState('gmail');

  const inbox = useMemo(() => store.inbox || [], [store.inbox]);

  useEffect(() => {
    const firstUnread = inbox.find(m => m.unread);
    setSelected(firstUnread || inbox[0] || null);
  }, [inbox]);

  /* ── Reply ── */
  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    openMailto({
      to: selected.email || '',
      subject: `Re: ${selected.subject || ''}`,
      body: reply,
    });
    showToast('Opened your mail app for reply.');
    setReply('');
  };

  /* ── Compose helpers ── */
  const setC = (k, v) => {
    setCompose(p => ({ ...p, [k]: v }));
    setComposeErrors(p => ({ ...p, [k]: '' }));
  };

  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    setCompose(p => ({ ...p, subject: t.subject, body: t.body }));
    setComposeErrors({});
  };

  const sendEmail = () => {
    const e = {};
    if (!compose.to.trim())      e.to      = 'Email is required';
    if (!compose.subject.trim()) e.subject = 'Subject is required';
    if (!compose.body.trim())    e.body    = 'Message is required';
    if (Object.keys(e).length) { setComposeErrors(e); return; }

    const newMsg = {
      from: compose.fromName || 'Me',
      email: compose.fromEmail || 'me@company.com',
      subject: compose.subject,
      preview: compose.body.slice(0, 100),
      body: compose.body,
      time: 'Just now',
      unread: false,
      tag: 'Sent'
    };

    addRecord('inbox', newMsg);
    const fullBody = `${compose.body}${compose.signature ? `\n\n${compose.signature}` : ''}`;
    openMailto({
      to: compose.to || '',
      cc: compose.cc || '',
      subject: compose.subject || '',
      body: fullBody,
    });
    showToast('Opened your mail app.');
    closeCompose();
  };

  const closeCompose = () => {
    setComposeOpen(false);
    setCompose(EMPTY_COMPOSE);
    setComposeErrors({});
    setProvider('gmail');
  };

  const safePreview = (preview) => {
    if (typeof preview !== 'string') return '';
    return preview.length > 70 ? preview.slice(0, 70) + '…' : preview;
  };

  const tagBadge = tag => ({
    Deal:'success', Lead:'info', Prospect:'warning',
    Customer:'primary', System:'secondary', Sent: 'primary',
  }[tag] || 'secondary');

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="page-subtitle">{inbox.filter(m => m.unread).length} unread messages</p>
        </div>
        <button className="btn-primary" onClick={() => setComposeOpen(true)}>
          <i className="fa fa-pen" /> Compose Email
        </button>
      </div>

      <div className="inbox-layout">

        {/* ── Message List ── */}
        <div className="inbox-list card" style={{ padding: 0, maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {[...inbox].reverse().map((msg, idx) => (
            <div
              key={msg.id}
              className={`inbox-item${selected?.id === msg.id ? ' active' : ''}${msg.unread ? ' unread' : ''}`}
              style={{ borderBottom: idx === inbox.length - 1 ? 'none' : undefined }}
              onClick={() => setSelected(msg)}
            >
              <div className="inbox-from">
                {msg.from}
                {msg.unread && <span className="unread-dot" />}
              </div>
              <div className="inbox-subject">{msg.subject}</div>
              <div className="inbox-preview">{safePreview(msg.preview)}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
                <span className="inbox-time">{msg.time}</span>
                {msg.tag && <span className={`badge badge-${tagBadge(msg.tag)}`}>{msg.tag}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Message Detail ── */}
        <div className="inbox-detail card">
          {selected ? (
            <>
              <div className="inbox-detail-header">
                <h3>{selected.subject}</h3>
                <div className="inbox-detail-meta">
                  <strong>{selected.from}</strong> &lt;{selected.email}&gt; · {selected.time}
                </div>
              </div>
              <div className="inbox-detail-body">
                <p>{selected.body || selected.preview}</p>
                <p style={{ marginTop:12, color:'var(--text-muted)' }}>
                  Thank you for reaching out. We'll get back to you shortly regarding your inquiry.
                </p>
              </div>
              <div className="inbox-reply">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder={`Reply to ${selected.from}…`}
                  rows={4}
                />
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                  <button className="btn-secondary" onClick={() => setReply('')}>
                    <i className="fa fa-trash" />
                  </button>
                  <button className="btn-primary" onClick={sendReply}>
                    <i className="fa fa-paper-plane" /> Send Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <i className="fa fa-inbox" />
              <h3>Select a message</h3>
              <p>Click on a message to read it</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Compose Email Modal ══ */}
      {composeOpen && (
        <div className="modal-overlay show" onClick={e => { if (e.target.classList.contains('modal-overlay')) closeCompose(); }}>
          <div className="modal compose-modal detailed-compose-modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h3>
                <i className="fa fa-envelope" style={{ marginRight:8, color:'var(--primary)' }} />
                Compose Email
              </h3>
              <button className="modal-close" onClick={closeCompose}><i className="fa fa-times" /></button>
            </div>

            <div className="form-body detailed-compose-body">
              {/* Provider selector */}
              <div className="email-compose-header">
                <div className="email-provider-btns">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.key}
                      className={`email-provider-btn${provider === p.key ? ' active' : ''}`}
                      onClick={() => setProvider(p.key)}
                    >
                      <i className={`fa ${p.icon}`} style={{ color: p.color }} /> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Sender Information */}
              <div className="compose-section-card">
                <div className="compose-section-header">
                  <h4>Email — Sender Information</h4>
                  <p>Configure how your emails appear to recipients.</p>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">From name</label>
                    <input className="form-control" value={compose.fromName} onChange={e => setC('fromName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">From email <i className="fa fa-info-circle info-icon" title="This email will be shown to recipients" /></label>
                    <input className="form-control" value={compose.fromEmail} onChange={e => setC('fromEmail', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reply-to address <span className="label-optional">(optional)</span></label>
                  <input className="form-control" placeholder="replies@company.com" value={compose.replyTo} onChange={e => setC('replyTo', e.target.value)} />
                  <p className="field-hint">Leave blank to use the same as your From email address.</p>
                </div>
              </div>

              {/* 2. Recipients */}
              <div className="compose-section-card">
                <div className="compose-section-header">
                  <h4>Email — Recipients</h4>
                  <p>Add To and CC addresses. Press Enter after each email.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <div className="tag-input-wrapper form-control">
                    <input 
                      className="tag-input" 
                      placeholder="recipient@example.com"
                      value={compose.to}
                      onChange={e => setC('to', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">CC <span className="label-optional">(optional)</span></label>
                  <input className="form-control" placeholder="Add CC email..." value={compose.cc} onChange={e => setC('cc', e.target.value)} />
                </div>
              </div>

              {/* 3. Compose */}
              <div className="compose-section-card">
                <div className="compose-section-header">
                  <h4>Email — Compose</h4>
                  <p>Write your email subject and body content.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject line</label>
                  <div className="input-with-counter">
                    <input
                      className={`form-control${composeErrors.subject ? ' error' : ''}`}
                      placeholder="Enter subject..."
                      value={compose.subject}
                      maxLength={150}
                      onChange={e => setC('subject', e.target.value)}
                    />
                    <span className="char-counter">{compose.subject.length}/150</span>
                  </div>
                  {composeErrors.subject && <div className="form-error show">{composeErrors.subject}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email body</label>
                  <div className="input-with-counter">
                    <textarea
                      className={`form-control compose-body${composeErrors.body ? ' error' : ''}`}
                      rows={6}
                      placeholder="Write your message here..."
                      value={compose.body}
                      maxLength={2000}
                      onChange={e => setC('body', e.target.value)}
                    />
                    <span className="char-counter">{compose.body.length}/2000</span>
                  </div>
                  {composeErrors.body && <div className="form-error show">{composeErrors.body}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email signature <span className="label-optional">(optional)</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={compose.signature}
                    onChange={e => setC('signature', e.target.value)}
                  />
                </div>
              </div>

              {/* Quick templates */}
              <div className="email-template-bar" style={{ marginTop: '10px' }}>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>Quick Templates:</span>
                <button className="email-tmpl-btn" onClick={() => applyTemplate('followup')}>Follow-up</button>
                <button className="email-tmpl-btn" onClick={() => applyTemplate('proposal')}>Proposal</button>
                <button className="email-tmpl-btn" onClick={() => applyTemplate('welcome')}>Welcome</button>
              </div>

            </div>


            <div className="form-actions">
              <button className="btn-secondary" onClick={closeCompose}>Cancel</button>
              <button className="btn-primary" onClick={sendEmail}>
                <i className="fa fa-paper-plane" /> Send Email
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
