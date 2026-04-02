import { useState, useRef, useEffect, useCallback } from 'react';
import { useCRM } from '../context/CRMContext';

const safeLeads = (s) => (Array.isArray(s?.leads) ? s.leads : []);
const safeDeals = (s) => (Array.isArray(s?.deals) ? s.deals : []);
const safeTasks = (s) => (Array.isArray(s?.tasks) ? s.tasks : []);
const safeContacts = (s) => (Array.isArray(s?.contacts) ? s.contacts : []);

function getBreezeResponse(q, store) {
  const ql = q.toLowerCase();

  if (/hot lead/.test(ql)) {
    const hot = safeLeads(store).filter((l) => l.temperature === 'Hot');
    if (!hot.length) return "No hot leads right now. Let's heat up the pipeline! <i class=\"fa fa-fire\"></i>";
    return `<i class="fa fa-fire" style="color:var(--danger)"></i> You have <b>${hot.length} hot lead${hot.length > 1 ? 's' : ''}</b>:<br><br>${hot.map((l) =>
      `- <b>${l.name}</b> (${l.company})<br>&nbsp;&nbsp;Status: ${l.status} | Value: INR ${l.value}`
    ).join('<br>')}`;
  }

  if (/pipeline|deal summary/.test(ql)) {
    const open = safeDeals(store).filter((d) => !['Closed Won', 'Closed Lost'].includes(d.stage));
    const total = open.reduce((s, d) => s + (d.value || 0), 0);
    return `<i class="fa fa-chart-column" style="color:var(--primary)"></i> <b>Pipeline Summary</b><br><br>Active deals: <b>${open.length}</b><br>Total value: <b>INR ${total.toLocaleString('en-IN')}</b><br><br>${open.map((d) =>
      `- ${d.name} - <span style="color:var(--bp-gold)">${d.stage}</span>`
    ).join('<br>')}`;
  }

  if (/closing|close soon|high prob/.test(ql)) {
    const soon = safeDeals(store).filter((d) => d.probability >= 60 && !['Closed Won', 'Closed Lost'].includes(d.stage));
    if (!soon.length) return 'No deals at >=60% probability right now. Keep pushing! <i class="fa fa-thumbs-up"></i>';
    return `<i class="fa fa-handshake" style="color:var(--primary)"></i> <b>${soon.length} deal${soon.length > 1 ? 's' : ''} likely to close:</b><br><br>${soon.map((d) =>
      `- <b>${d.name}</b><br>&nbsp;&nbsp;${d.probability}% | INR ${(d.value || 0).toLocaleString('en-IN')}`
    ).join('<br>')}`;
  }

  if (/overdue|task|due/.test(ql)) {
    const today = new Date().toISOString().split('T')[0];
    const overdue = safeTasks(store).filter((t) => t.dueDate < today && t.status !== 'Completed');
    if (!overdue.length) return '<i class="fa fa-circle-check" style="color:var(--success)"></i> Great news - no overdue tasks! You are right on track.';
    return `<i class="fa fa-clock" style="color:var(--danger)"></i> <b>${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}</b>:<br><br>${overdue.map((t) =>
      `- ${t.title}<br>&nbsp;&nbsp;Due: ${t.dueDate} | ${t.priority} priority`
    ).join('<br>')}`;
  }

  if (/contact/.test(ql)) {
    const contacts = safeContacts(store);
    const active = contacts.filter((c) => c.status === 'active');
    const industries = [...new Set(contacts.map((c) => c.industry).filter(Boolean))].join(', ') || '-';
    return `<i class="fa fa-users" style="color:var(--primary)"></i> <b>Contact Overview</b><br><br>Total: <b>${contacts.length}</b><br>Active: <b>${active.length}</b><br>Industries: ${industries}`;
  }

  if (/revenue|won|closed/.test(ql)) {
    const won = safeDeals(store).filter((d) => d.stage === 'Closed Won');
    const rev = won.reduce((s, d) => s + (d.value || 0), 0);
    return `<i class="fa fa-money-bill-wave" style="color:var(--success)"></i> <b>Revenue Overview</b><br><br>Deals closed: <b>${won.length}</b><br>Total revenue: <b>INR ${rev.toLocaleString('en-IN')}</b><br><br>${won.map((d) =>
      `- ${d.name} - INR ${(d.value || 0).toLocaleString('en-IN')}`
    ).join('<br>')}`;
  }

  if (/email|draft/.test(ql)) {
    const c = safeContacts(store)[0];
    const firstName = c?.name?.split(' ')[0] || 'there';
    return `<i class="fa fa-envelope" style="color:var(--primary)"></i> <b>Draft Follow-up Email</b><br><br><div class="breeze-email-draft">Subject: Following up - LegalEdge CRM<br><br>Hi ${firstName},<br><br>Just checking in on your interest in LegalEdge CRM. Happy to schedule a quick call this week!<br><br>Best regards,<br>Adv. S. Kumar</div>`;
  }

  if (/lead/.test(ql)) {
    const leads = safeLeads(store);
    return `<i class="fa fa-bullseye" style="color:var(--danger)"></i> <b>Lead Summary</b><br><br>Total: <b>${leads.length}</b><br>Hot: <b>${leads.filter((l) => l.temperature === 'Hot').length}</b><br>Warm: <b>${leads.filter((l) => l.temperature === 'Warm').length}</b><br>Cold: <b>${leads.filter((l) => l.temperature === 'Cold').length}</b>`;
  }

  return 'Hi! I\'m <b>Breeze AI</b> - your LegalEdge CRM assistant. <i class="fa fa-robot"></i><br><br>I can help you with:<br>- <i class="fa fa-fire" style="color:var(--danger)"></i> Hot leads &amp; lead summary<br>- <i class="fa fa-chart-column" style="color:var(--primary)"></i> Pipeline &amp; deal analysis<br>- <i class="fa fa-handshake" style="color:var(--primary)"></i> Deals closing soon<br>- <i class="fa fa-clock" style="color:var(--danger)"></i> Overdue tasks<br>- <i class="fa fa-money-bill-wave" style="color:var(--success)"></i> Revenue overview<br>- <i class="fa fa-envelope" style="color:var(--primary)"></i> Draft emails<br><br>What would you like to explore?';
}

const PRESETS = [
  { label: 'Hot leads', q: 'Show me hot leads', icon: 'fa-fire' },
  { label: 'Pipeline', q: 'Pipeline summary', icon: 'fa-chart-column' },
  { label: 'Closing deals', q: 'Deals closing soon', icon: 'fa-handshake' },
  { label: 'Overdue tasks', q: 'Overdue tasks', icon: 'fa-clock' },
  { label: 'Revenue', q: 'Revenue overview', icon: 'fa-money-bill-wave' },
  { label: 'Draft email', q: 'Draft an email', icon: 'fa-envelope' },
];

export default function BreezeAI({ open, onClose }) {
  const { store } = useCRM();
  const panelStyle = { display: 'flex', flexDirection: 'column', overflow: 'hidden' };
  const messagesStyle = { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' };
  const bubbleStyle = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' };
  const inputStyle = { lineHeight: 1.4 };

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      html: "<i class='fa-solid fa-hand-wave'></i> Hi! I'm <b>Breeze AI</b>, your LegalEdge CRM assistant.<br><br>Ask me anything about your <b>leads</b>, <b>deals</b>, <b>contacts</b>, <b>tasks</b>, or <b>pipeline</b>. I can also help draft emails and analyse your data!",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const storeRef = useRef(store);
  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  const send = useCallback((preset) => {
    const text = (preset || input).trim();
    if (!text || typing) return;

    setMessages((m) => [...m, { type: 'user', text }]);
    setInput('');
    setTyping(true);

    timerRef.current = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { type: 'ai', html: getBreezeResponse(text, storeRef.current) }]);
    }, 800 + Math.random() * 500);
  }, [input, typing]);

  if (!open) return null;

  return (
    <>

      <div className="breeze-panel" role="dialog" aria-modal="true" aria-label="Breeze AI Assistant" style={panelStyle}>
        <div className="breeze-header">
          <div className="breeze-header-left">
            <div className="breeze-avatar"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            <div className="breeze-header-info">
              <div className="breeze-header-name">Breeze AI</div>
              <div className="breeze-header-sub">
                <span className="breeze-online-dot"></span>
                LegalEdge CRM Assistant
              </div>
            </div>
          </div>
          <button className="breeze-close-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="breeze-messages" style={messagesStyle}>
          {messages.map((m, i) => (
            <div key={i} className={`breeze-msg breeze-msg-${m.type}`} style={{ maxWidth: '100%' }}>
              {m.type === 'ai' && <div className="breeze-msg-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>}
              <div className="breeze-bubble" style={bubbleStyle}>
                {m.type === 'ai'
                  ? <span dangerouslySetInnerHTML={{ __html: m.html }} />
                  : m.text}
              </div>
            </div>
          ))}

          {messages.length === 1 && !typing && (
            <div className="breeze-presets">
              {PRESETS.map((p) => (
                <button key={p.q} className="breeze-preset-btn" onClick={() => send(p.q)}>
                  <i className={`fa-solid ${p.icon}`} style={{ marginRight: 6 }}></i> {p.label}
                </button>
              ))}
            </div>
          )}

          {typing && (
            <div className="breeze-msg breeze-msg-ai" style={{ maxWidth: '100%' }}>
              <div className="breeze-msg-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
              <div className="breeze-bubble breeze-typing-bubble" style={bubbleStyle}>
                <div className="breeze-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="breeze-input-bar">
          <input
            ref={inputRef}
            className="breeze-input"
            placeholder="Ask about leads, deals, contacts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={typing}
            style={inputStyle}
          />
          <button
            className="breeze-send-btn"
            onClick={() => send()}
            disabled={typing || !input.trim()}
            aria-label="Send message"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
}
