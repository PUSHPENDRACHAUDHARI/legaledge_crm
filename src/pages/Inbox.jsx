import { useEffect, useRef, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLocation } from 'react-router-dom';
import { emailAPI } from '../services/api';
import { isSmtpConfigError, openProviderCompose } from '../utils/emailClientFallback';

const EMPTY_COMPOSE = { from: '', to: '', cc: '', subject: '', body: '' };

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

const normalizeInboxList = (data) => {
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const mergeInboxMessages = (current, incomingRaw) => {
  const incoming = normalizeInboxList(incomingRaw);
  const currentById = new Map(current.map((msg) => [msg.id, msg]));

  const mergedIncoming = incoming.map((msg) => {
    const existing = currentById.get(msg.id);
    if (!existing) return msg;
    
    return {
      ...msg,
      unread: typeof existing.unread === 'boolean' ? existing.unread : msg.unread,
    };
  });

  const incomingIds = new Set(mergedIncoming.map((msg) => msg.id));
  const localOnly = current.filter((msg) => !incomingIds.has(msg.id));
  return [...localOnly, ...mergedIncoming];
};

export default function Inbox() {
  const { store, showToast, currentUser } = useCRM();
  const user = currentUser || null;
  const location = useLocation();

  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({
    ...EMPTY_COMPOSE,
    from: user?.email || '',
  });
  const [composeErrors, setComposeErrors] = useState({});

  const [inboxMessages, setInboxMessages] = useState(() => store.inbox || []);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const showToastRef = useRef(showToast);
  const handledComposeStateRef = useRef('');

  const getThreadKey = (msg) => msg?.threadId || msg?.thread_id || `message-${msg?.id}`;

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    setCompose((prev) => ({ ...prev, from: user?.email || '' }));
  }, [user?.email]);

  useEffect(() => {
    const composePreset = location.state?.compose;
    if (!composePreset) return;

    const presetKey = JSON.stringify(composePreset);
    if (handledComposeStateRef.current === presetKey) return;
    handledComposeStateRef.current = presetKey;

    setCurrentFolder('inbox');
    setCompose({
      ...EMPTY_COMPOSE,
      from: user?.email || '',
      to: composePreset.to || '',
      cc: composePreset.cc || '',
      subject: composePreset.subject || '',
      body: composePreset.body || '',
    });
    setComposeErrors({});
    setComposeOpen(true);
  }, [location.state, user?.email]);

  useEffect(() => {
    if (!Array.isArray(store.inbox) || !store.inbox.length) return;
    setInboxMessages((prev) => mergeInboxMessages(prev, store.inbox));
  }, [store.inbox]);

  const [currentFolder, setCurrentFolder] = useState('inbox');
  const fetchMailsRef = useRef(null);

  useEffect(() => {
    setSelected((prevSelected) => {
      if (!inboxMessages.length) return null;
      if (prevSelected?.id) {
        const matched = inboxMessages.find((m) => m.id === prevSelected.id);
        if (matched) return matched;
      }
      const firstUnread = inboxMessages.find((m) => m.unread);
      return firstUnread || inboxMessages[0] || null;
    });
  }, [inboxMessages, currentFolder]);

  useEffect(() => {
    let active = true;

    const fetchMails = async () => {
      try {
        if (currentFolder === 'inbox') {
          try {
            await emailAPI.syncInbox({ max_results: 25 });
          } catch {
            // Best-effort background sync; inbox fetch still proceeds.
          }
          const data = await emailAPI.getInbox();
          if (!active) return;
          setInboxMessages((prev) => mergeInboxMessages(prev, data));
        } else {
          const res = await emailAPI.getSent();
          const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.results || [];
          if (!active) return;
          setInboxMessages(data);
        }
      } catch (err) {
        if (!active) return;
        showToastRef.current(err?.message || 'Failed to refresh mails.', 'error');
      }
    };

    fetchMailsRef.current = fetchMails;
    fetchMails();
    const poll = setInterval(fetchMails, 30000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [currentFolder]);

  const handleSelectMessage = async (msg) => {
    setSelected(msg);

    if (!msg?.id || !msg.unread) return;

    setInboxMessages((prev) =>
      prev.map((item) => (item.id === msg.id ? { ...item, unread: false } : item))
    );
    setSelected((prev) => (prev?.id === msg.id ? { ...prev, unread: false } : prev));

    try {
      await emailAPI.markAsRead(msg.id);
      showToast('Message marked as read.');
    } catch (err) {
      showToast(err?.message || 'Failed to mark message as read.', 'error');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setInboxMessages((prev) => prev.filter((item) => item.id !== msgId));
    setSelected((prev) => (prev?.id === msgId ? null : prev));

    try {
      await emailAPI.deleteMsg(msgId);
      showToast('Message deleted.');
    } catch (err) {
      showToast(err?.message || 'Failed to delete message.', 'error');
    }
  };

  const sendReply = async () => {
    if (!selected) {
      showToast('Please select a message to reply.');
      return;
    }
    if (!reply.trim()) {
      showToast('Please write a message before sending.');
      return;
    }

    const replyBody = reply.trim();
    const replySubject = selected.subject?.startsWith('Re:') ? selected.subject : `Re: ${selected.subject || ''}`;

    const payload = {
        from: user?.email || '',
        to: selected.from_email || selected.email || selected.sender_email || '',
        subject: replySubject,
        body: replyBody,
        thread_id: getThreadKey(selected),
      };

    try {
      await emailAPI.send(payload);

      setReply('');
      setInboxMessages((prev) => {
        const updated = prev.map((item) =>
          item.id === selected.id ? { ...item, unread: false } : item
        );

        const sentMsg = {
          id: `sent-reply-${Date.now()}`,
          from: 'You',
          email: user?.email || '',
          subject: replySubject,
          preview: replyBody.slice(0, 100),
          body: replyBody,
          time: 'Just now',
          unread: false,
          tag: 'Sent',
          threadId: getThreadKey(selected),
        };

        return [sentMsg, ...updated];
      });

      setSelected((prev) => (prev?.id === selected.id ? { ...prev, unread: false } : prev));
      showToast('Reply sent successfully.');
      setTimeout(() => fetchMailsRef.current && fetchMailsRef.current(), 500);
    } catch (err) {
      if (isSmtpConfigError(err)) {
        openProviderCompose('mailto', payload);
        showToast('Backend email is unavailable. Opened your mail app instead.', 'info');
        return;
      }
      showToast(err?.message || 'Failed to send reply.', 'error');
    }
  };

  const setC = (k, v) => {
    setCompose((p) => ({ ...p, [k]: v }));
    setComposeErrors((p) => ({ ...p, [k]: '' }));
  };

  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    setCompose((p) => ({ ...p, subject: t.subject, body: t.body }));
    setComposeErrors({});
  };

  const sendEmail = async () => {

    const e = {};
    if (!compose.to.trim()) e.to = 'Email is required';
    if (!compose.subject.trim()) e.subject = 'Subject is required';
    if (!compose.body.trim()) e.body = 'Message is required';
    if (Object.keys(e).length) {
      setComposeErrors(e);
      return;
    }

    const payload = {
        from: compose.from || user?.email || '',
        to: compose.to || '',
        cc: compose.cc || '',
        subject: compose.subject || '',
        body: compose.body || '',
      };

    try {
      await emailAPI.send(payload);

      const sentMsg = {
        id: `sent-compose-${Date.now()}`,
        from: 'You',
        email: user?.email || '',
        subject: compose.subject || '',
        preview: (compose.body || '').slice(0, 100),
        body: compose.body || '',
        time: 'Just now',
        unread: false,
        tag: 'Sent',
      };

      setInboxMessages((prev) => [sentMsg, ...prev]);
      showToast('Email sent successfully.');
      closeCompose();
      setTimeout(() => fetchMailsRef.current && fetchMailsRef.current(), 500);
    } catch (err) {
      if (isSmtpConfigError(err)) {
        openProviderCompose('mailto', payload);
        showToast('Backend email is unavailable. Opened your mail app instead.', 'info');
        return;
      }
      showToast(err?.message || 'Failed to send email.', 'error');
    }
  };

  const openCompose = () => {
    setCompose({
      ...EMPTY_COMPOSE,
      from: user?.email || '',
    });
    setComposeErrors({});
    setComposeOpen(true);
  };

  const closeCompose = () => {
    setComposeOpen(false);
    setCompose({
      ...EMPTY_COMPOSE,
      from: user?.email || '',
    });
    setComposeErrors({});
  };

  const safePreview = (preview) => {
    if (typeof preview !== 'string') return '';
    return preview.length > 70 ? `${preview.slice(0, 70)}...` : preview;
  };

  const tagBadge = (tag) => ({
    Deal: 'success',
    Lead: 'info',
    Prospect: 'warning',
    Customer: 'primary',
    System: 'secondary',
    Sent: 'primary',
  }[tag] || 'secondary');

  const threadSummaryMap = new Map();
  inboxMessages.forEach((msg) => {
    const key = getThreadKey(msg);
    const current = threadSummaryMap.get(key);
    if (!current) {
      threadSummaryMap.set(key, {
        ...msg,
        threadKey: key,
        unreadCount: msg.unread ? 1 : 0,
      });
      return;
    }
    const currentTs = new Date(current.receivedAt || current.created_at || current.time || 0).getTime() || 0;
    const nextTs = new Date(msg.receivedAt || msg.created_at || msg.time || 0).getTime() || 0;
    const latest = nextTs >= currentTs ? msg : current;
    threadSummaryMap.set(key, {
      ...latest,
      threadKey: key,
      unreadCount: current.unreadCount + (msg.unread ? 1 : 0),
    });
  });

  const threadSummaries = Array.from(threadSummaryMap.values()).sort((a, b) => {
    const aTs = new Date(a.receivedAt || a.created_at || a.time || 0).getTime() || 0;
    const bTs = new Date(b.receivedAt || b.created_at || b.time || 0).getTime() || 0;
    return bTs - aTs;
  });

  const selectedThreadKey = selected ? getThreadKey(selected) : '';
  const selectedThreadMessages = selectedThreadKey
    ? inboxMessages
        .filter((msg) => getThreadKey(msg) === selectedThreadKey)
        .slice()
        .sort((a, b) => {
          const aTs = new Date(a.receivedAt || a.created_at || a.time || 0).getTime() || 0;
          const bTs = new Date(b.receivedAt || b.created_at || b.time || 0).getTime() || 0;
          return aTs - bTs;
        })
    : [];

  const unreadCount = inboxMessages.filter((msg) => msg.unread).length;

  return (
    <div className="page-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{currentFolder === 'inbox' ? 'Inbox' : 'Sent Emails'}</h1>
          <p className="page-subtitle">{currentFolder === 'inbox' ? `${unreadCount} unread messages` : ''}</p>
        </div>
        <button className="btn-primary" onClick={openCompose}>
          <i className="fa fa-pen" /> Compose Email
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          className={currentFolder === 'inbox' ? 'btn-primary' : 'btn-secondary'} 
          style={{ padding: '6px 16px', fontSize: '14px', minWidth: '80px' }}
          onClick={() => setCurrentFolder('inbox')}>
          <i className="fa fa-inbox" style={{ marginRight: '6px' }} /> Inbox
        </button>
        <button 
          className={currentFolder === 'sent' ? 'btn-primary' : 'btn-secondary'} 
          style={{ padding: '6px 16px', fontSize: '14px', minWidth: '80px' }}
          onClick={() => setCurrentFolder('sent')}>
          <i className="fa fa-paper-plane" style={{ marginRight: '6px' }} /> Sent
        </button>
      </div>

      <div className="inbox-layout">
        <div className="inbox-list card" style={{ padding: 0 }}>
          {threadSummaries.map((msg) => (
            <div
              key={msg.threadKey || msg.id}
              className={`inbox-item${selected?.id === msg.id ? ' active' : ''}${msg.unread ? ' unread' : ''}`}
              onClick={() => handleSelectMessage(msg)}
              onMouseEnter={() => setHoveredMsgId(msg.threadKey || msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div className="inbox-from">
                  {msg.from}
                  {msg.unread && <span className="unread-dot" />}
                </div>
                <button
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    minWidth: 0,
                    opacity: hoveredMsgId === (msg.threadKey || msg.id) ? 1 : 0,
                    pointerEvents: hoveredMsgId === (msg.threadKey || msg.id) ? 'auto' : 'none',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(msg.id);
                  }}
                  title="Delete message"
                >
                  <i className="fa fa-trash" />
                </button>
              </div>
              <div className="inbox-subject">{msg.subject}</div>
              <div className="inbox-preview">{safePreview(msg.preview)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="inbox-time">{msg.time}</span>
                {msg.unreadCount > 1 && (
                  <span className="badge badge-warning" style={{ marginRight: 6 }}>
                    {msg.unreadCount} unread
                  </span>
                )}
                {msg.tag && <span className={`badge badge-${tagBadge(msg.tag)}`}>{msg.tag}</span>}
              </div>
            </div>
          ))}
        </div>

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
                {selectedThreadMessages.length ? (
                  selectedThreadMessages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: 12 }}>
                      <div className="txt-muted txt-sm" style={{ marginBottom: 4 }}>
                        {msg.from} · {msg.time}
                      </div>
                      <p style={{ margin: 0 }}>{msg.body || msg.preview}</p>
                    </div>
                  ))
                ) : (
                  <p>{selected.body || selected.preview}</p>
                )}
              </div>
              <div className="inbox-reply">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${selected.from}...`}
                  rows={4}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
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

      {composeOpen && (
        <div className="modal-overlay show" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) closeCompose(); }}>
          <div className="modal compose-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fa fa-envelope" style={{ marginRight: 8, color: 'var(--primary)' }} />
                Compose Email
              </h3>
              <button className="modal-close" onClick={closeCompose}><i className="fa fa-times" /></button>
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
                Emails will be sent internally or via SMTP.
              </div>

              <div className="form-group">
                <label className="form-label">From</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Logged in user email"
                  value={compose.from}
                  readOnly
                  style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">To <span className="required">*</span></label>
                <input
                  className={`form-control${composeErrors.to ? ' error' : ''}`}
                  type="email"
                  placeholder="recipient@example.com"
                  value={compose.to}
                  onChange={(e) => setC('to', e.target.value)}
                />
                {composeErrors.to && <div className="form-error show">{composeErrors.to}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">CC</label>
                <input
                  className={`form-control${composeErrors.cc ? ' error' : ''}`}
                  type="email"
                  placeholder="cc@example.com"
                  value={compose.cc}
                  onChange={(e) => setC('cc', e.target.value)}
                />
                {composeErrors.cc && <div className="form-error show">{composeErrors.cc}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Subject <span className="required">*</span></label>
                <input
                  className={`form-control${composeErrors.subject ? ' error' : ''}`}
                  placeholder="Email subject"
                  value={compose.subject}
                  onChange={(e) => setC('subject', e.target.value)}
                />
                {composeErrors.subject && <div className="form-error show">{composeErrors.subject}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Message <span className="required">*</span></label>
                <textarea
                  className={`form-control compose-body${composeErrors.body ? ' error' : ''}`}
                  rows={6}
                  placeholder="Write your message here..."
                  value={compose.body}
                  onChange={(e) => setC('body', e.target.value)}
                />
                {composeErrors.body && <div className="form-error show">{composeErrors.body}</div>}
              </div>

              <div
                className="email-template-bar"
                style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quick Templates:</span>
                <button className="email-tmpl-btn" style={{ margin: 0 }} onClick={() => applyTemplate('followup')}>Follow-up</button>
                <button className="email-tmpl-btn" style={{ margin: 0 }} onClick={() => applyTemplate('proposal')}>Proposal</button>
                <button className="email-tmpl-btn" style={{ margin: 0 }} onClick={() => applyTemplate('welcome')}>Welcome</button>
              </div>
            </div>

            <div
              className="form-actions"
              style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
            >
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
