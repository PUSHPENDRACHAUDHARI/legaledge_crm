import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCRM } from '../context/CRMContext';

function parseMeetingDateTime(meeting) {
  const date = meeting?.date;
  if (!date) return null;

  const datePart = String(date).split('T')[0];
  const rawTime = String(meeting?.time || '').trim();

  if (!rawTime) {
    const fallback = new Date(`${datePart}T23:59:59`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(rawTime)) {
    const hhmmss = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
    const parsed = new Date(`${datePart}T${hhmmss}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(`${datePart} ${rawTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getTypeBadgeClass(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('inbound')) return 'badge-info';
  if (value.includes('outbound')) return 'badge-primary';
  if (value.includes('video')) return 'badge-primary';
  if (value.includes('phone')) return 'badge-warning';
  if (value.includes('meeting')) return 'badge-secondary';
  return 'badge-secondary';
}

function getStatusBadgeClass(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('answered')) return 'badge-success';
  if (value.includes('scheduled')) return 'badge-info';
  if (value.includes('missed')) return 'badge-danger';
  if (value.includes('voicemail')) return 'badge-warning';
  return 'badge-secondary';
}

export default function Calls() {
  const { store, showToast, addMeeting, currentUser } = useCRM();
  const [activeCall, setActiveCall] = useState(null);
  const [callTime, setCallTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [onHold, setOnHold] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '', contact: '', date: '', time: '',
    platform: 'zoom', duration: '1 hour', notes: '',
  });
  const timerRef = useRef(null);
  const now = new Date();
  const upcomingMeetings = (store.meetings || [])
    .filter((m) => {
      const dt = parseMeetingDateTime(m);
      if (!dt) return true;
      return dt >= now;
    })
    .slice()
    .sort((a, b) => {
      const ad = parseMeetingDateTime(a)?.getTime() || 0;
      const bd = parseMeetingDateTime(b)?.getTime() || 0;
      return ad - bd;
    });
  const callActivityRows = [
    ...(store.callLogs || []).map((call) => ({
      ...call,
      rowType: 'call',
      rowId: `call-${call.id}`,
    })),
    ...(store.meetings || []).map((meeting) => ({
      id: meeting.id,
      rowType: 'meeting',
      rowId: `meeting-${meeting.id}`,
      contact: meeting.contact || meeting.title || 'Scheduled meeting',
      phone: meeting.phone || '--',
      type: meeting.type || 'Meeting',
      status: 'Scheduled',
      duration: meeting.duration || '--',
      date: meeting.date || '',
      time: meeting.time || '',
      notes: meeting.notes || `${meeting.platform || 'Meeting'} scheduled`,
      title: meeting.title,
      platform: meeting.platform,
    })),
  ]
    .sort((a, b) => {
      const aTime = parseMeetingDateTime(a)?.getTime() || new Date(a.created || 0).getTime() || 0;
      const bTime = parseMeetingDateTime(b)?.getTime() || new Date(b.created || 0).getTime() || 0;
      return bTime - aTime;
    });

  useEffect(() => {
    if (activeCall) {
      timerRef.current = setInterval(() => setCallTime(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [activeCall]);

  useEffect(() => {
    document.body.style.overflow = showMeetingModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMeetingModal]);

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startCall = contact => {
    setActiveCall(contact);
    setMuted(false);
    setOnHold(false);
    showToast(`Calling ${contact.contact}…`);
  };

  const endCall = () => {
    showToast(`Call with ${activeCall?.contact} ended · ${fmt(callTime)}`);
    setActiveCall(null);
  };

  const closeModal = () => setShowMeetingModal(false);
  const toggleHold = () => {
    setOnHold(prev => {
      const next = !prev;
      showToast(next ? `Call with ${activeCall?.contact} is on hold` : `Call with ${activeCall?.contact} resumed`);
      return next;
    });
  };

  const handleSchedule = async () => {
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) {
      showToast('Please complete meeting title, date and time', 'warning');
      return;
    }

    try {
      await addMeeting(meetingForm);

      showToast('Meeting scheduled!');
      closeModal();
      setMeetingForm({ title: '', contact: '', date: '', time: '', platform: 'zoom', duration: '1 hour', notes: '' });
    } catch (err) {
      showToast(err?.message || 'Unable to save meeting. Please sign in again and retry.', 'error');
    }
  };

  const updateForm = (field, value) => setMeetingForm(p => ({ ...p, [field]: value }));

  const inputStyle = {
    width: '100%',
    padding: '7px 12px',
    fontSize: '0.85rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: '7px',
    outline: 'none',
    background: '#fff',
    color: '#1a202c',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.68rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#718096',
    marginBottom: '4px',
    textTransform: 'uppercase',
  };

  const meetingModal = (
    <>
      {/* Backdrop */}
      <div
        onClick={closeModal}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998,
        }}
      />

      {/* Centering wrapper */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meetingModalTitle"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid #edf2f7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={closeModal}
                aria-label="Back"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4a5568', fontSize: '0.95rem', padding: '2px 6px 2px 0',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <i className="fa-solid fa-arrow-left" />
              </button>
              <h5
                id="meetingModalTitle"
                style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1a202c' }}
              >
                Schedule Meeting
              </h5>
            </div>
            <button
              onClick={closeModal}
              aria-label="Close"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.25rem', color: '#718096', lineHeight: 1, padding: '2px 6px',
              }}
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>

            {/* Row 1 — Title */}
            <div>
              <label style={labelStyle}>Meeting Title <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                type="text"
                style={inputStyle}
                placeholder="e.g. Project kickoff call"
                value={meetingForm.title}
                onChange={e => updateForm('title', e.target.value)}
              />
            </div>

            {/* Row 2 — Contact */}
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="e.g. Rahul Sharma"
                value={meetingForm.contact}
                onChange={e => updateForm('contact', e.target.value)}
              />
            </div>

            {/* Row 3 — Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Date <span style={{ color: '#e53e3e' }}>*</span></label>
                <input type="date" style={inputStyle} value={meetingForm.date}
                  onChange={e => updateForm('date', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Time <span style={{ color: '#e53e3e' }}>*</span></label>
                <input type="time" style={inputStyle} value={meetingForm.time}
                  onChange={e => updateForm('time', e.target.value)} />
              </div>
            </div>

            {/* Row 4 — Platform + Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select style={inputStyle} value={meetingForm.platform}
                  onChange={e => updateForm('platform', e.target.value)}>
                  {['zoom', 'gmeet', 'teams', 'other'].map(v => (
                    <option key={v} value={v}>
                      {v === 'gmeet' ? 'Google Meet' : v === 'other' ? 'Phone' : v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duration</label>
                <select style={inputStyle} value={meetingForm.duration}
                  onChange={e => updateForm('duration', e.target.value)}>
                  {['30 mins', '1 hour', '1.5 hours', '2 hours'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5 — Notes */}
            <div>
              <label style={labelStyle}>
                Notes{' '}
                <span style={{ fontSize: '0.68rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#a0aec0' }}>
                  (optional)
                </span>
              </label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: '62px' }}
                placeholder="Agenda, dial-in link, etc."
                value={meetingForm.notes}
                onChange={e => updateForm('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid #edf2f7',
            background: '#f7fafc',
          }}>
            <button
              onClick={closeModal}
              style={{
                padding: '7px 18px', fontSize: '0.83rem', fontWeight: 500,
                border: '1.5px solid #e2e8f0', borderRadius: '7px',
                background: '#fff', color: '#4a5568', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              style={{
                padding: '7px 20px', fontSize: '0.83rem', fontWeight: 600,
                border: 'none', borderRadius: '7px',
                background: '#f6ad1a', color: '#1a202c', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <i className="fa-solid fa-calendar-check" />
              Save Meeting
            </button>
          </div>

        </div>
      </div>
    </>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calls &amp; Meetings</h1>
          <p className="page-subtitle">Manage your calls and schedule meetings</p>
        </div>
        <div className="page-actions">
          <button className="btn-primary" onClick={() => setShowMeetingModal(true)}>
            <i className="fa-solid fa-video" /> Schedule Meeting
          </button>
        </div>
      </div>

      {activeCall && (
        <div className="active-call-banner">
          <div className="call-info">
            <div className="call-pulse" />
            <div>
              <div className="call-name"><i className="fa-solid fa-phone" /> {activeCall.contact}</div>
              <div className="call-number">{activeCall.phone}</div>
            </div>
            <div className="call-timer">{fmt(callTime)}</div>
          </div>
          <div className="call-actions">
            <button
              className={`call-btn${muted ? ' active' : ''}`}
              onClick={() => setMuted(p => !p)}
              title={muted ? 'Unmute' : 'Mute'}
            >
              <i className={`fa-solid ${muted ? 'fa-microphone-slash' : 'fa-microphone'}`} />
            </button>
            <button className={`call-btn${onHold ? ' active' : ''}`} onClick={toggleHold} title={onHold ? 'Resume' : 'Hold'}>
              <i className={`fa-solid ${onHold ? 'fa-play' : 'fa-pause'}`} />
            </button>
            <button className="call-btn end-call" onClick={endCall} title="End Call">
              <i className="fa-solid fa-phone-slash" /> End
            </button>
          </div>
        </div>
      )}

      <div className="calls-grid">
        <div className="card" style={{ flex: 2 }}>
          <div className="card-header"><h3>Recent Calls &amp; Meetings</h3></div>
          <div className="table-responsive">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contact</th><th>Phone</th><th>Type</th><th>Status</th>
                    <th>Duration</th><th>Date/Time</th><th>Notes</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {callActivityRows.length ? callActivityRows.map(c => (
                    <tr key={c.rowId}>
                      <td>
                        <strong>{c.contact}</strong>
                        {c.rowType === 'meeting' && c.title && c.title !== c.contact && (
                          <div><small>{c.title}</small></div>
                        )}
                      </td>
                      <td>{c.phone}</td>
                      <td>
                        <span className={`badge ${getTypeBadgeClass(c.type)}`}>
                          {c.type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.duration}</td>
                      <td>{c.date} {c.time}</td>
                      <td><small>{c.notes}</small></td>
                      <td>
                        {c.rowType === 'call' ? (
                          <button className="action-btn success" onClick={() => startCall(c)} title="Call Again">
                            <i className="fa-solid fa-phone" />
                          </button>
                        ) : (
                          <button
                            className="action-btn"
                            onClick={() => showToast(`${c.title || c.contact} is scheduled on ${c.date} ${c.time}`)}
                            title="View scheduled meeting"
                          >
                            <i className="fa-solid fa-video" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No calls or meetings to show yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="card-header"><h3>Upcoming Meetings</h3></div>
          <div className="meeting-list">
            {upcomingMeetings.map(m => (
              <div key={m.id} className="meeting-item">
                <div className="meeting-icon"><i className="fa-solid fa-video" /></div>
                <div className="meeting-body">
                  <div className="meeting-title">{m.title}</div>
                  <div className="meeting-meta">{m.date} · {m.time} · {m.duration}</div>
                  <div className="meeting-contact">{m.contact} · {m.platform}</div>
                </div>
                <span className="badge badge-scheduled">Scheduled</span>
              </div>
            ))}
            {!upcomingMeetings.length && (
              <div className="meeting-item">
                <div className="meeting-body">
                  <div className="meeting-title">No upcoming meetings</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMeetingModal && createPortal(meetingModal, document.body)}
    </div>
  );
}
