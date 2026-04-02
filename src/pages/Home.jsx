import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM } from "../context/CRMContext";
import { getRecentActivities } from "../utils/activityRetention";
import "../styles/Home.css";

// ---------- helpers ----------
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function parseMeetingDateTime(meeting) {
  const date = meeting?.date;
  if (!date) return null;

  const datePart = String(date).split("T")[0];
  const rawTime = String(meeting?.time || "").trim();

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

function getTaskDueDate(task) {
  return task?.dueDate || task?.due_date || "";
}

// ---------- sub-components ----------
function _SectionHeader({ icon, title, right }) {
  return (
    <div className="home-section-header">
      <div className="home-section-title">
        <span className="home-section-icon">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="home-section-actions">{right}</div>
    </div>
  );
}

function _EmptyCard({ message, buttonLabel, onAdd }) {
  return (
    <div className="home-empty-card">
      <p className="home-empty-text">{message}</p>
      <button className="home-ghost-btn" onClick={onAdd}>
        <span className="home-ghost-btn-icon">+</span> {buttonLabel}
      </button>
    </div>
  );
}

function _DateNav({ date, onPrev, onNext }) {
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="home-date-nav">
      <button className="home-nav-btn" onClick={onPrev}>&#8249;</button>
      <span className="home-date-label">{label}</span>
      <button className="home-nav-btn" onClick={onNext}>&#8250;</button>
    </div>
  );
}

function _TaskTabs({ active, onChange }) {
  return (
    <div className="home-task-tabs">
      {["Open", "Completed"].map((tab) => (
        <button
          key={tab}
          className={`home-tab-btn ${active === tab ? "home-tab-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function GettingStartedCard({ title, desc, btnLabel, btnVariant, onAction }) {
  return (
    <div className="home-gs-card">
      <div className="home-gs-card-body">
        <h4 className="home-gs-card-title">{title}</h4>
        {desc && <p className="home-gs-card-desc">{desc}</p>}
      </div>
      <button className={`home-gs-btn home-gs-btn--${btnVariant}`} onClick={onAction}>{btnLabel}</button>
    </div>
  );
}

// / ---------- main component ----------/
export default function Home() {
  const navigate = useNavigate();
  const { store, showToast, storeLoading } = useCRM();
  const [showCustomize, setShowCustomize] = useState(false);

  // 1. Initialize state with the current time
  const [currentTime, setCurrentTime] = useState(new Date());

  const [_meetingDate, setMeetingDate] = useState(new Date());
  const [_taskTab, _setTaskTab] = useState("Open");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const now = currentTime;

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
    })
    .slice(0, 5);

  const openTasks = (store.tasks || [])
    .filter((t) => (t.status || "").toLowerCase() !== "completed")
    .slice()
    .sort((a, b) => {
      const ad = new Date(getTaskDueDate(a) || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const bd = new Date(getTaskDueDate(b) || 0).getTime() || Number.MAX_SAFE_INTEGER;
      return ad - bd;
    })
    .slice(0, 5);

  const recentActivities = getRecentActivities(store.activities || []);
  const latestNotes = (store.notes || []).slice().sort((a,b) => new Date(b.createdAt || b.at || 0) - new Date(a.createdAt || a.at || 0)).slice(0, 3);

  // 2. Set up an interval to update the time every minute
  // This ensures the greeting and date change automatically at midnight/morning
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Check every 60 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const _shiftMeetingDate = (days) => {
    setMeetingDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };
  const gettingStartedItems = [
    {
      title: "Set up the basics",
      desc: "Import contacts, set up your inbox, and invite your team.",
      btnLabel: "Set up the basics",
      btnVariant: "primary",
      onAction: () => navigate('/contacts'),
    },
    {
      title: "Engage leads and convert them to customers",
      desc: "Create deals, log activities, and move leads through your pipeline.",
      btnLabel: "Engage leads",
      btnVariant: "primary",
      onAction: () => navigate('/leads'),
    },
  ];

  const totalTasks = 12;
  const completedTasks = 0;
  const progressPct = Math.round((completedTasks / totalTasks) * 100);

  const carouselSteps = [
    {
      tag: "Set up the basics",
      tagColor: "he-tag--blue",
      time: "About 2 minutes",
      title: "Add your existing contacts",
      desc: "Organize, track, and manage your valuable leads in your LegalEdge CRM database.",
      actionLabel: "Add contacts",
      actionVariant: "he-action--dark",
      onAction: () => navigate('/contacts'),
    },
    {
      tag: "Engage leads",
      tagColor: "he-tag--blue",
      time: "About 3 minutes",
      title: "Create an email list",
      desc: "Segment contacts into smart lists for laser-focused outreach.",
      actionLabel: "Create list",
      actionVariant: "he-action--outline",
      actionIcon: true,
      onAction: () => showToast('List creation wizard is coming soon.', 'info'),
    },
    {
      tag: "Connectivity",
      tagColor: "he-tag--blue",
      time: "About 1 minute",
      title: "Connect your inbox",
      desc: "Send and receive emails directly to keep all conversations in one place.",
      actionLabel: "Connect inbox",
      actionVariant: "he-action--dark",
      onAction: () => navigate('/inbox'),
    },
    {
      tag: "Sales",
      tagColor: "he-tag--blue",
      time: "About 4 minutes",
      title: "Create your first deal",
      desc: "Track opportunities and move prospects through your sales pipeline with ease.",
      actionLabel: "Create deal",
      actionVariant: "he-action--dark",
      onAction: () => navigate('/deals'),
    }
  ];

  const visibleCount = 2;
  const maxIndex = carouselSteps.length - visibleCount;

  const handleCarouselPrev = () => setCarouselIndex((prev) => Math.max(prev - 1, 0));
  const handleCarouselNext = () => setCarouselIndex((prev) => Math.min(prev + 1, maxIndex));
  const handleRecentActivityNavigation = (event) => {
    event.preventDefault();
    navigate('/recent-activity');
  };

  const frequentItems = [
    { icon: "fa-envelope", label: "Email", visits: "7 times this week", path: "/inbox" },
    { icon: "fa-chart-column", label: "Dashboards", visits: "6 times this week", path: "/dashboards" },
    { icon: "fa-check", label: "Tasks", visits: "1 time this week", path: "/tasks" },
    { icon: "fa-inbox", label: "Inbox", visits: "1 time this week", path: "/inbox" },
  ];

  if (storeLoading) {
    return (
      <div className="home-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa fa-spinner fa-spin" style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <div>
          {/* 3. Use currentTime instead of 'new Date()' so it reacts to the timer */}
          <p className="home-date-text">{formatDate(currentTime)}</p>
          <h1 className="home-greeting">
            {/* getGreeting will now receive the updated hour from currentTime */}
            {getGreeting(currentTime.getHours())}, Shailesh
          </h1>
        </div>
        <button className="home-customize-btn" onClick={() => setShowCustomize(true)}><i className="fa-solid fa-gear"></i> Customize</button>
      </header>

      <section className="home-section">
        <div className="home-section-title">
          <span className="home-section-icon"><i className="fa-regular fa-calendar-days"></i></span>
          <span>Meetings</span>
        </div>

        <div className="home-empty-card">
          {upcomingMeetings.length === 0 ? (
            <p className="home-empty-text">No upcoming meetings right now</p>
          ) : (
            upcomingMeetings.map((m) => (
              <p key={m.id} className="home-empty-text" style={{ margin: '0.35rem 0' }}>
                {m.title || 'Untitled meeting'}{m.time ? ` • ${m.time}` : ''}{m.owner ? ` • ${m.owner}` : ''}
              </p>
            ))
          )}

          <button className="home-ghost-btn" onClick={() => navigate('/calls')}>
            <span className="home-ghost-btn-icon">+</span> New meeting
          </button>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-title">
          <span className="home-section-icon"><i className="fa-regular fa-circle-check"></i></span>
          <span>Tasks</span>
        </div>

        <div className="home-empty-card">
          {openTasks.length === 0 ? (
            <p className="home-empty-text">You have no open tasks</p>
          ) : (
            openTasks.map((t) => (
              <p key={t.id} className="home-empty-text" style={{ margin: '0.35rem 0' }}>
                {t.title || 'Untitled task'}{t.status ? ` • ${t.status}` : ''}{getTaskDueDate(t) ? ` • ${getTaskDueDate(t)}` : ''}
              </p>
            ))
          )}

          <button className="home-ghost-btn" onClick={() => navigate('/tasks')}>
            <span className="home-ghost-btn-icon">+</span> New Task
          </button>
        </div>
      </section>

      <section className="home-section">
        <div className="home-gs-header">
          <div>
            <h2 className="home-gs-title">Get started with LegalEdge</h2>
            <a href="#" className="home-gs-link">View your plan →</a>
          </div>
          <div className="home-gs-progress-block">
            <div className="home-gs-progress-bar-track">
              <div className="home-gs-progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="home-gs-progress-meta">
              <span className="home-gs-progress-pct">{progressPct}%</span>
              <span className="home-gs-progress-sub">{completedTasks} of {totalTasks} completed</span>
            </div>
          </div>
        </div>
        <div className="home-grid-two-col">
          {gettingStartedItems.map((item) => <GettingStartedCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="he-carousel-container">
        <button className="he-carousel-arrow left" onClick={handleCarouselPrev} disabled={carouselIndex === 0}>‹</button>
        <div className="home-grid-two-col">
          {carouselSteps.slice(carouselIndex, carouselIndex + visibleCount).map((step, i) => (
            <div key={i} className="he-step-card">
              <span className={`he-step-tag ${step.tagColor}`}>{step.tag}</span>
              <p className="he-step-time">{step.time}</p>
              <h3 className="he-step-title">{step.title}</h3>
              <p className="he-step-desc">{step.desc}</p>
              <div className="he-step-actions">
                <button className={`he-action-btn ${step.actionVariant}`} onClick={step.onAction}>{step.actionLabel}</button>
                <button className="he-skip-btn" onClick={() => showToast(`Skipped: ${step.title}`, 'info')}>Skip</button>
              </div>
            </div>
          ))}
        </div>
        <button className="he-carousel-arrow right" onClick={handleCarouselNext} disabled={carouselIndex >= maxIndex}>›</button>
      </section>
      <div>
        <a href="/tasks" className="home-gs-link">See all Task →</a>
      </div>
      <br></br>

      <section className="home-section">
        <div className="he-freq-header"><i className="fa-solid fa-bolt" style={{color: '#f59e0b'}}></i> <span className="he-freq-title">Frequently visited</span></div>
        <div className="home-grid-four-col">
          {frequentItems.map((item) => (
            <button key={item.label} className="he-freq-card" onClick={() => navigate(item.path)}>
              <span className="he-freq-icon"><i className={`fa-solid ${item.icon}`}></i></span>
              <span className="he-freq-label">{item.label}</span>
              <span className="he-freq-visits">{item.visits}</span>
            </button>
          ))}
        </div>
      </section>

      

      {/* Recent Activity Section */}
      <section className="home-section recent-activity-section">
        <div className="home-section-header">
          <div className="home-section-title">
            <span className="home-section-icon"><i className="fa-regular fa-clock"></i></span>
            <span>Recent Activity</span>
          </div>
        </div>

        <div className="activity-grid">
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 6).map((a) => (
              <div key={a.id} className="activity-card">
                <div className="activity-card-header">
                  <span className="activity-label">{a.entity ? a.entity.charAt(0).toUpperCase() + a.entity.slice(1) : 'Activity'}</span>
                  <span className={`activity-badge ${a.action === 'created' ? 'badge-green' : a.action === 'updated' ? 'badge-blue' : 'badge-gray'}`}>
                    {a.action || 'Action'}
                  </span>
                </div>
                <div className="activity-card-body">
                  <h4 className="activity-primary-name">{a.detail || a.message || `${a.entity || 'Record'} action`}</h4>
                  <p className="activity-timestamp">{a.at ? new Date(a.at).toLocaleString() : 'Just now'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="activity-card">
              <div className="activity-card-body">
                <p className="activity-timestamp">No activities logged.</p>
              </div>
            </div>
          )}
        </div>

        {latestNotes.length > 0 && (
          <div className="notes-list" style={{ marginTop: '1rem' }}>
            {latestNotes.map((note) => (
              <div key={note.id} className="activity-card" style={{ borderLeft: '3px solid #7c3aed' }}>
                <div className="activity-card-header">
                  <span className="activity-label">Note</span>
                  <span className="activity-badge badge-purple">New</span>
                </div>
                <div className="activity-card-body">
                  <h4 className="activity-primary-name">{note.title}</h4>
                  <p className="activity-timestamp">{note.description || 'No description'}</p>
                  <p className="activity-timestamp" style={{ marginTop: 4 }}>Created {new Date(note.createdAt || note.at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="activity-footer-link" onClick={handleRecentActivityNavigation}>
          <a href="#" className="home-gs-link">See all recent activity →</a>
        </div>
      </section>

      {/* Feedback Banner */}
      <div className="home-feedback-banner">
        <div className="feedback-content">
          <span className="feedback-icon"><i className="fa-regular fa-lightbulb"></i></span>
          <p className="feedback-text">Make a request for what you'd like to see added to your homepage</p>
        </div>
        <button className="feedback-share-btn" onClick={() => navigate('/feedback')}>Share Feedback</button>
      </div>

      {showCustomize && (
        <>
          <div className="customize-overlay" onClick={() => setShowCustomize(false)} />

          <div className="customize-panel">
            <div className="customize-header">
              <h3>Customize Layout</h3>
              <button className="btn-icon" onClick={() => setShowCustomize(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="customize-body">
              <div className="card">
                <div className="card-title">Meetings</div>
                <p className="txt-muted">
                  Stay on top of your schedule with quick access.
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCustomize(false);
                    navigate('/meetings');
                  }}
                >
                  Open Meetings
                </button>
              </div>

              <div className="card">
                <div className="card-title">Tasks</div>
                <p className="txt-muted">
                  Track your daily work and deadlines.
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCustomize(false);
                    navigate('/tasks');
                  }}
                >
                  Open Tasks
                </button>
              </div>

              <div className="card">
                <div className="card-title">Recent Activity</div>
                <p className="txt-muted">
                  Jump back to your latest updates from the dashboard.
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowCustomize(false);
                    navigate('/dashboards');
                  }}
                >
                  Open Dashboard
                </button>
              </div>

            </div>

            <div className="customize-footer">
              <button className="btn-secondary" onClick={() => setShowCustomize(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  showToast('Layout preferences saved.');
                  setShowCustomize(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
