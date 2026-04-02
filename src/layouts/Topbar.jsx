import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import './Topbar.css';
import SearchBar from '../components/SearchBar';
import { createPortal } from 'react-dom';
import { clearStoredAuth } from '../utils/auth';
import { notificationsAPI } from '../services/api';

const BREADCRUMBS = {
  '/': ['Home', 'Dashboard'],
  '/dashboards': ['Reporting', 'Dashboards'],
  '/contacts': ['CRM', 'Contacts'],
  '/companies': ['CRM', 'Companies'],
  '/deals': ['CRM', 'Deals'],
  '/tickets': ['CRM', 'Tickets'],
  '/leads': ['CRM', 'Leads'],
  '/segments': ['CRM', 'Segments'],
  '/inbox': ['CRM', 'Inbox'],
  '/calls': ['CRM', 'Calls'],
  '/meetings': ['CRM', 'Meetings'],
  '/tasks': ['CRM', 'Tasks'],
  '/target-accounts': ['CRM', 'Target Accounts'],
  '/helpdesk': ['CRM', 'Help Desk'],
  '/reports': ['Reporting', 'Reports'],
  '/sales-analytics': ['Reporting', 'Sales Analytics'],
  '/commerce-analytics': ['Reporting', 'Commerce Analytics'],
  '/service-analytics': ['Reporting', 'Service Analytics'],
  '/goals': ['Reporting', 'Goals'],
  '/forecast': ['Sales', 'Forecast'],
  '/commerce-overview': ['Commerce', 'Overview'],
  '/quotes': ['Commerce', 'Quotes'],
  '/products': ['Commerce', 'Products'],
  '/orders': ['Commerce', 'Orders'],
  '/invoices': ['Commerce', 'Invoices'],
  '/payments': ['Commerce', 'Payments'],
  '/subscriptions': ['Commerce', 'Subscriptions'],
  '/playbooks': ['Sales Tools', 'Playbooks'],
  '/message-templates': ['Sales Tools', 'Templates'],
  '/snippets': ['Sales Tools', 'Snippets'],
  '/documents': ['Sales Tools', 'Documents'],
  '/coaching-playlists': ['Sales Tools', 'Coaching'],
  '/activity-feed': ['Sales Tools', 'Activity Feed'],
  '/sequences': ['Sales Tools', 'Sequences'],
  '/breeze-studio': ['Breeze AI', 'Studio'],
  '/knowledge-vaults': ['Breeze AI', 'Knowledge Vaults'],
  '/prospecting-agent': ['Breeze AI', 'Prospecting Agent'],
  '/customer-agent': ['Breeze AI', 'Customer Agent'],
  '/buyer-intent': ['Breeze AI', 'Buyer Intent'],
  '/data-agent': ['Data', 'Data Agent'],
  '/data-integration': ['Data', 'Integration'],
  '/data-quality': ['Data', 'Quality'],
  '/data-enrichment': ['Data', 'Enrichment'],
  '/marketplace-apps': ['Integrations', 'Marketplace'],
  '/breeze-marketplace': ['Integrations', 'Breeze Marketplace'],
  '/connected-apps': ['Integrations', 'Connected Apps'],
  '/blogs': ['Content', 'Blogs'],
  '/seo': ['Content', 'SEO'],
  '/brand': ['Content', 'Brand'],
  '/chat-flows': ['Content', 'Chat Flows'],
  '/automation': ['Operations', 'Automation'],
  '/campaigns': ['Marketing', 'Campaigns'],
  '/email-marketing': ['Marketing', 'Email Marketing'],
  '/social': ['Marketing', 'Social Media'],
  '/forms': ['Marketing', 'Forms'],
  '/lead-scoring': ['Marketing', 'Lead Scoring'],
  '/events': ['Marketing', 'Events'],
  '/sales-workspace': ['Sales', 'Workspace'],
  '/knowledge-base': ['Service', 'Knowledge Base'],
  '/feedback': ['Service', 'Feedback'],
  '/website-pages': ['Content', 'Website Pages'],
  '/landing-pages': ['Content', 'Landing Pages'],
  '/videos': ['Content', 'Videos'],
  '/podcasts': ['Content', 'Podcasts'],
  '/case-studies': ['Content', 'Case Studies'],
  '/design-manager': ['Content', 'Design Manager'],
  '/data-model': ['Settings', 'Data Model'],
  '/added-agents': ['Settings', 'Added Agents'],
  '/settings': ['Account', 'Settings'],
  '/profile': ['Account', 'Profile'],
};

const FALLBACK_USER = {
  name: 'Shailesh Bhange',
  role: 'Admin',
  avatar: 'SB',
};

const toInitials = (user) => {
  if (!user) return 'US';
  if (user.avatar) return user.avatar;
  if (!user.name) return 'US';
  return user.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const normalizeRoleLabel = (role) => {
  if (!role) return 'User';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getHomePath = (role) => {
  if (role === 'manager') return '/manager/dashboard';
  if (role === 'user') return '/user/dashboard';
  return '/admin/home';
};

const normalizeNotifications = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const isUnread = (n) => n?.is_read !== true && n?.unread !== false;
const ENABLE_NOTIF_WS = import.meta.env.VITE_ENABLE_NOTIF_WS === 'true';

const mergeNotifications = (current, incoming) => {
  const incomingRows = normalizeNotifications(incoming);
  if (!incomingRows.length) return [];

  const currentById = new Map(current.map((item) => [item.id, item]));
  const merged = incomingRows.map((item) => {
    const existing = currentById.get(item.id);
    if (!existing) return item;

    // Keep optimistic read updates until the backend refresh reflects them.
    if (!isUnread(existing) && isUnread(item)) {
      return { ...item, is_read: true, unread: false };
    }

    return { ...existing, ...item };
  });

  return merged;
};

export default function Topbar({ onBreezeOpen, onCreateNew, onMobileMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, showToast } = useCRM();

  const activeUser = currentUser || FALLBACK_USER;
  const userInitials = toInitials(activeUser);
  const roleLabel = normalizeRoleLabel(activeUser.role);
  const roleClass = (activeUser.role || 'user').toLowerCase();
  const canCreate = roleClass === 'admin';
  const homePath = getHomePath(activeUser.role);

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const notifBtnRef = useRef(null);
  const userRef = useRef(null);
  const userBtnRef = useRef(null);
  const notificationsRef = useRef([]);
  const unreadNotifications = notifications.filter(isUnread);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const notifPanel = document.querySelector('.notif-dropdown');
      const userPanel = document.querySelector('.user-menu');

      if (notifRef.current && !notifRef.current.contains(e.target) && !(notifPanel && notifPanel.contains(e.target))) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target) && !(userPanel && userPanel.contains(e.target))) {
        setUserOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    let ws;
    let active = true;

    const loadNotifications = async ({ silent = false } = {}) => {
      try {
        const res = await notificationsAPI.getAll();
        if (!active) return;
        setNotifications((prev) => {
          const rows = mergeNotifications(prev, res?.data);
          setUnreadCount(rows.filter(isUnread).length);
          return rows;
        });
      } catch (err) {
        if (!active) return;
        if (!silent) {
          showToast(err?.message || 'Failed to load notifications.');
        }
      }
    };

    void loadNotifications();

    if (ENABLE_NOTIF_WS) {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
        ws = new WebSocket(`${wsProtocol}://${wsHost}/ws/notifications/`);
        ws.onmessage = (e) => {
          if (!active) return;
          try {
            const n = JSON.parse(e.data);
            setNotifications((prev) => {
              const existing = prev.find((item) => item.id === n?.id);
              const next = existing
                ? prev.map((item) => (item.id === n.id ? { ...item, ...n } : item))
                : [n, ...prev];
              setUnreadCount(next.filter(isUnread).length);
              return next;
            });
            showToast('New notification received.');
          } catch {
            showToast('Failed to parse notification payload.');
          }
        };
        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // Silent fallback to polling.
      }
    }

    const interval = setInterval(() => {
      void loadNotifications({ silent: true });
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [showToast]);

  const closeAll = () => {
    setNotifOpen(false);
    setUserOpen(false);
  };

  const markNotificationReadLocally = (notif) => {
    const existing = notificationsRef.current.find((item) => item.id === notif?.id);
    const wasUnread = isUnread(existing ?? notif);

    if (!wasUnread) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notif.id ? { ...item, is_read: true, unread: false } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleBellClick = () => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        void notificationsAPI.getAll()
          .then((res) => {
            const rows = mergeNotifications(notificationsRef.current, res?.data);
            setNotifications(rows);
            setUnreadCount(rows.filter(isUnread).length);
          })
          .catch((err) => {
            showToast(err?.message || 'Failed to load notifications.');
          });
      }
      return next;
    });
    setUserOpen(false);
  };

  const handleNotifClick = async (notif) => {
    markNotificationReadLocally(notif);
    closeAll();
    if (notif.path || notif.link) navigate(notif.path || notif.link);

    try {
      if (notif?.id !== undefined && notif?.id !== null) {
        await notificationsAPI.markRead(notif.id);
      }
    } catch (err) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notif.id ? { ...item, is_read: notif?.is_read, unread: notif?.unread } : item
        )
      );
      setUnreadCount((prev) => prev + (isUnread(notif) ? 1 : 0));
      showToast(err?.message || 'Failed to open notification.');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    closeAll();
    navigate('/login', { replace: true });
  };

  const crumb = BREADCRUMBS[pathname.toLowerCase()] || ['Home', 'Dashboard'];
  const _parent = crumb[0];
  const _current = crumb[1];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onMobileMenu}
          aria-label="Open menu"
          data-sidebar-toggle="true"
        >
          <i className="fa fa-bars" />
        </button>

        <SearchBar />

        <div className="topbar-actions-group">
          <button className="topbar-action-btn" aria-label="Calls" onClick={() => navigate('/calls')}>
            <i className="fa fa-phone" />
          </button>

          <button className="topbar-action-btn" aria-label="Home" onClick={() => navigate(homePath)}>
            <i className="fa fa-home-alt" />
          </button>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="breeze-topbar-btn"
          onClick={() => {
            if (onBreezeOpen) {
              onBreezeOpen();
              return;
            }
            document.querySelector('.bw-trigger')?.click();
          }}
          aria-label="Open Breeze AI"
        >
          <span className="breeze-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span>
          <span className="topbar-btn-label">Breeze</span>
        </button>

        {canCreate && (
          <button className="btn-create" onClick={onCreateNew} aria-label="Create new">
            <i className="fa fa-plus" />
            <span className="topbar-btn-label">Create</span>
          </button>
        )}

        <div className="topbar-icon-wrap" ref={notifRef}>
          <button
            ref={notifBtnRef}
            className="topbar-icon"
            onClick={() => {
              void handleBellClick();
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
          >
            <i className="fa fa-bell" />
            {unreadCount > 0 && (
              <span className="notif-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {createPortal(
          notifOpen ? (
            <div
              className="notif-dropdown show"
              style={{
                position: 'fixed',
                top: `${(notifBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 6}px`,
                right: `${window.innerWidth - (notifBtnRef.current?.getBoundingClientRect().right ?? 0)}px`,
                zIndex: 9999,
              }}
              role="menu"
              aria-label="Notifications panel"
            >
              <div className="notif-header">
                <span>Notifications</span>
                <span className="notif-count">{unreadCount} new</span>
              </div>

              <div>
                {unreadNotifications.length ? (
                  unreadNotifications.map((n, i) => (
                    <div
                      key={n.id || i}
                      className="notif-item unread"
                      onClick={() => {
                        void handleNotifClick(n);
                      }}
                      role="menuitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          void handleNotifClick(n);
                        }
                      }}
                    >
                      <i className={`fa ${n.icon || 'fa-bell'}`} />
                      <div>
                        <b>{n.title}</b>
                        <p>{n.body}</p>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">No new notifications.</div>
                )}
              </div>

              <div
                className="notif-footer"
                onClick={() => {
                  navigate('/inbox');
                  closeAll();
                }}
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/inbox');
                    closeAll();
                  }
                }}
              >
                View all notifications →
              </div>
            </div>
          ) : null,
          document.body
        )}

        <div className="topbar-icon-wrap" ref={userRef}>
          <button
            ref={userBtnRef}
            className="topbar-avatar"
            onClick={() => {
              setUserOpen((p) => !p);
              setNotifOpen(false);
            }}
            aria-label="User menu"
            aria-expanded={userOpen}
            aria-haspopup="true"
          >
            {userInitials}
          </button>
        </div>

        {createPortal(
          userOpen ? (
            <div
              className="user-menu show"
              style={{
                position: 'fixed',
                top: `${(userBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 6}px`,
                right: `${window.innerWidth - (userBtnRef.current?.getBoundingClientRect().right ?? 0)}px`,
                zIndex: 9999,
              }}
              role="menu"
              aria-label="User options"
            >
              <div className="user-menu-profile">
                <div className="user-avatar-sm">{userInitials}</div>
                <div className="user-menu-info">
                  <div className="user-menu-name">{activeUser.name}</div>
                  <div className={`user-role-badge role-${roleClass}`}>{roleLabel}</div>
                </div>
              </div>

              <div className="user-menu-divider" />

              <button className="user-menu-item" role="menuitem" onClick={() => { navigate('/profile'); closeAll(); }}>
                <i className="fa fa-user" /> My Profile
              </button>

              <button className="user-menu-item" role="menuitem" onClick={() => { navigate('/settings'); closeAll(); }}>
                <i className="fa fa-cog" /> Account Settings
              </button>

              {roleLabel === 'Admin' && (
                <button className="user-menu-item" role="menuitem" onClick={() => { navigate('/settings?tab=admin'); closeAll(); }}>
                  <i className="fa fa-tools" /> Admin Settings
                </button>
              )}

              {roleLabel === 'Manager' && (
                <button className="user-menu-item" role="menuitem" onClick={() => { navigate('/settings?tab=team'); closeAll(); }}>
                  <i className="fa fa-users" /> Team Settings
                </button>
              )}

              <div className="user-menu-divider" />

              <button className="user-menu-item user-menu-logout" role="menuitem" onClick={handleLogout}>
                <i className="fa fa-sign-out-alt" /> Log Out
              </button>
            </div>
          ) : null,
          document.body
        )}
      </div>
    </header>
  );
}
