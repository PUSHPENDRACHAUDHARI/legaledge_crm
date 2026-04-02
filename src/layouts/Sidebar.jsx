import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCRM } from "../context/CRMContext";
import "./Sidebar.css";

export const NAV_GROUPS = [
  {
    id: 'crm',
    icon: 'fa-users',
    label: 'CRM',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-address-book', label: 'Contacts', path: '/contacts', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-building', label: 'Companies', path: '/companies', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-handshake', label: 'Deals', path: '/deals', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-ticket-alt', label: 'Tickets', path: '/tickets', roles: ['admin', 'manager'] },
      { icon: 'fa-user-plus', label: 'Leads', path: '/leads', roles: ['admin', 'manager'] },
      { icon: 'fa-layer-group', label: 'Segments', path: '/segments', roles: ['admin', 'manager'] },
      { icon: 'fa-inbox', label: 'Inbox', path: '/inbox', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-phone', label: 'Calls', path: '/calls', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-tasks', label: 'Tasks', path: '/tasks', roles: ['admin', 'manager', 'user'] },
    ]
  },
  {
    id: 'marketing',
    icon: 'fa-bullhorn',
    label: 'Marketing',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-rocket', label: 'Campaigns', path: '/campaigns', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-envelope', label: 'Email', path: '/email-marketing', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-share-alt', label: 'Social', path: '/social', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-list-alt', label: 'Forms', path: '/forms', roles: ['admin', 'manager', 'user'] },
      { id: 'lead-scoring', label: 'Lead Scoring', icon: 'fa-chart-line', path: '/lead-scoring', roles: ['admin', 'manager'] },
      { icon: 'fa-calendar', label: 'Events', path: '/events', roles: ['admin', 'manager', 'user'] },
    ]
  },
  {
    id: 'sales',
    icon: 'fa-chart-line',
    label: 'Sales',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-briefcase', label: 'Sales Workspace', path: '/sales-workspace', roles: ['admin', 'manager'] },
      { icon: 'fa-crosshairs', label: 'Target Accounts', path: '/target-accounts', roles: ['admin', 'manager'] },
      { icon: 'fa-calendar-check', label: 'Meetings', path: '/meetings', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-list-ol', label: 'Sequences', path: '/sequences', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-chart-bar', label: 'Forecast', path: '/forecast', roles: ['admin', 'manager'] },
      { icon: 'fa-chart-pie', label: 'Sales Analytics', path: '/sales-analytics', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'service',
    icon: 'fa-headset',
    label: 'Service',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-life-ring', label: 'Help Desk', path: '/helpdesk', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-book', label: 'Knowledge Base', path: '/knowledge-base', roles: ['admin', 'manager'] },
      { icon: 'fa-comments', label: 'Feedback', path: '/feedback', roles: ['admin', 'manager'] },
      { icon: 'fa-chart-area', label: 'Service Analytics', path: '/service-analytics', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'reporting',
    icon: 'fa-chart-bar',
    label: 'Reporting',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-tachometer-alt', label: 'Dashboards', path: '/dashboards', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-file-alt', label: 'Reports', path: '/reports', roles: ['admin', 'manager'] },
      { icon: 'fa-bullseye', label: 'Goals', path: '/goals', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'commerce',
    icon: 'fa-store',
    label: 'Commerce',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-tachometer-alt', label: 'Overview', path: '/commerce-overview', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-file-invoice', label: 'Quotes', path: '/quotes', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-box', label: 'Products', path: '/products', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-shopping-cart', label: 'Orders', path: '/orders', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-file-invoice-dollar', label: 'Invoices', path: '/invoices', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-credit-card', label: 'Payments', path: '/payments', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-sync-alt', label: 'Subscriptions', path: '/subscriptions', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-chart-pie', label: 'Commerce Analytics', path: '/commerce-analytics', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'content',
    icon: 'fa-pen-nib',
    label: 'Content',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-globe', label: 'Website Pages', path: '/website-pages', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-flag', label: 'Landing Pages', path: '/landing-pages', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-blog', label: 'Blogs', path: '/blogs', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-video', label: 'Videos', path: '/videos', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-podcast', label: 'Podcast', path: '/podcasts', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-book-open', label: 'Case Studies', path: '/case-studies', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-search', label: 'SEO', path: '/seo', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-palette', label: 'Design Manager', path: '/design-manager', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-star', label: 'Brand', path: '/brand', roles: ['admin', 'manager', 'user'] },
    ]
  },
  {
    id: 'data',
    icon: 'fa-database',
    label: 'Data Management',
    roles: ['admin', 'manager'],
    items: [
      { icon: 'fa-robot', label: 'Data Agent', path: '/data-agent', roles: ['admin'] },
      { icon: 'fa-plug', label: 'Data Integration', path: '/data-integration', roles: ['admin', 'manager'] },
      { icon: 'fa-shield-alt', label: 'Data Quality', path: '/data-quality', roles: ['admin', 'manager'] },
      { icon: 'fa-project-diagram', label: 'Data Model', path: '/data-model', roles: ['admin'] },
      { icon: 'fa-magic', label: 'Data Enrichment', path: '/data-enrichment', roles: ['admin'] },
    ]
  },
  {
    id: 'breeze',
    icon: 'fa-microchip',
    label: 'Breeze AI',
    roles: ['admin', 'manager'],
    items: [
      { icon: 'fa-wand-magic-sparkles', label: 'Breeze Studio', path: '/breeze-studio', roles: ['admin', 'manager'] },
      { icon: 'fa-lock', label: 'Knowledge Vaults', path: '/knowledge-vaults', roles: ['admin', 'manager'] },
      { icon: 'fa-store', label: 'Marketplace', path: '/breeze-marketplace', roles: ['admin', 'manager'] },
      { icon: 'fa-user-secret', label: 'Prospecting Agent', path: '/prospecting-agent', roles: ['admin', 'manager'] },
      { icon: 'fa-headset', label: 'Customer Agent', path: '/customer-agent', roles: ['admin', 'manager'] },
      { id: 'buyer-intent', label: 'Buyer Intent', icon: 'fa-bullseye', path: '/buyer-intent', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'salestools',
    icon: 'fa-toolbox',
    label: 'Sales Tools',
    roles: ['admin', 'manager', 'user'],
    items: [
      { icon: 'fa-book', label: 'Playbooks', path: '/playbooks', roles: ['admin', 'manager'] },
      { icon: 'fa-envelope-open-text', label: 'Templates', path: '/message-templates', roles: ['admin', 'manager'] },
      { icon: 'fa-cut', label: 'Snippets', path: '/snippets', roles: ['admin', 'manager'] },
      { icon: 'fa-folder-open', label: 'Documents', path: '/documents', roles: ['admin', 'manager', 'user'] },
      { icon: 'fa-play-circle', label: 'Coaching', path: '/coaching-playlists', roles: ['admin', 'manager'] },
      { icon: 'fa-rss', label: 'Activity Feed', path: '/activity-feed', roles: ['admin', 'manager'] },
    ]
  },
  {
    id: 'marketplace',
    icon: 'fa-store',
    label: 'Marketplace',
    roles: ['admin'],
    items: [
      { icon: 'fa-th', label: 'App Marketplace', path: '/marketplace-apps', roles: ['admin'] },
      { icon: 'fa-link', label: 'Connected Apps', path: '/connected-apps', roles: ['admin'] },
      { icon: 'fa-robot', label: 'Added Agents', path: '/added-agents', roles: ['admin'] },
    ]
  },
];

/* ---------- Flyout Menu ---------- */

function FlyoutMenu({ group, onNavigate, activePath, onToggleBookmark, bookmarks, triggerRef }) {
  const flyoutRef = useRef(null);
  const [flyoutStyle, setFlyoutStyle] = useState({
    '--flyout-top': '12px',
    '--flyout-max-h': 'calc(100vh - 24px)',
  });

  useEffect(() => {
    const updateFlyoutPosition = () => {
      if (!flyoutRef.current || !triggerRef?.current) return;

      const viewportPadding = 12;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const flyoutHeight = flyoutRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxHeight = Math.max(220, viewportHeight - viewportPadding * 2);
      const maxTop = Math.max(viewportPadding, viewportHeight - viewportPadding - flyoutHeight);
      const top = Math.min(Math.max(triggerRect.top, viewportPadding), maxTop);

      setFlyoutStyle({
        '--flyout-top': `${top}px`,
        '--flyout-max-h': `${Math.max(220, viewportHeight - top - viewportPadding)}px`,
      });
    };

    updateFlyoutPosition();
    window.addEventListener('resize', updateFlyoutPosition);
    window.addEventListener('scroll', updateFlyoutPosition, true);

    return () => {
      window.removeEventListener('resize', updateFlyoutPosition);
      window.removeEventListener('scroll', updateFlyoutPosition, true);
    };
  }, [group.items.length, triggerRef]);

  return (
    <div className="flyout-menu" ref={flyoutRef} style={flyoutStyle}>
      <div className="flyout-title">{group.label}</div>
      <div className="flyout-scroll-area">
        {group.items.map((item) => {
          const isBookmarked = bookmarks.some(b => b.path === item.path);
          return (
            <div
              key={item.path}
              className={`flyout-item ${activePath === item.path ? "active" : ""}`}
              onClick={() => onNavigate(item.path)}
            >
              <i className={`fa ${item.icon}`} />
              <span>{item.label}</span>
              <i
                className={`fa fa-star bookmark-toggle ${isBookmarked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(item);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Nav Group ---------- */

function NavGroup({
  g,
  collapsed,
  mobileOpen,
  isOpen,
  onToggle,
  onNavigate,
  activePath,
  onToggleBookmark,
  bookmarks
}) {
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const leaveTimer = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const showFlyout = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setFlyoutVisible(true);
  };

  const hideFlyout = () => {
    leaveTimer.current = setTimeout(() => setFlyoutVisible(false), 200);
  };

  const isChildActive = g.items.some((i) => i.path === activePath);

  return (
    <div
      className={`nav-group ${isChildActive ? "has-active" : ""}`}
      onMouseEnter={collapsed && !mobileOpen ? showFlyout : undefined}
      onMouseLeave={collapsed && !mobileOpen ? hideFlyout : undefined}
    >
      {/* FIX 1: header click calls onToggle once. Chevron has NO onClick — parent covers it. */}
      <div
        ref={triggerRef}
        className="nav-group-header"
        onClick={() => onToggle(g.id)}
      >
        <div className="nav-group-left">
          <i className={`fa ${g.icon}`} />
          {!collapsed && <span>{g.label}</span>}
        </div>

        {!collapsed && (
          <i className={`fa fa-chevron-down nav-arrow ${isOpen ? "rotated" : ""}`} />
        )}
      </div>

      {/* FIX 2: only "open" class, no "show" */}
      {!collapsed && (
        <div className={`nav-group-items ${isOpen ? "open" : ""}`}>
          {g.items.map((item) => {
            const isBookmarked = bookmarks.some(b => b.path === item.path);
            return (
              <div
                key={item.path}
                className={`nav-sub-item ${activePath === item.path ? "active" : ""}`}
                onClick={() => onNavigate(item.path)}
              >
                <i className={`fa ${item.icon}`} />
                <span>{item.label}</span>
                <i
                  className={`fa fa-star bookmark-toggle ${isBookmarked ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(item);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {collapsed && flyoutVisible && (
        <FlyoutMenu
          group={g}
          activePath={activePath}
          bookmarks={bookmarks}
          onToggleBookmark={onToggleBookmark}
          triggerRef={triggerRef}
          onNavigate={(path) => {
            onNavigate(path);
            setFlyoutVisible(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Single Nav Item ---------- */

function NavItem({ icon, label, path, activePath, collapsed, onNavigate }) {
  return (
    <div
      className={`nav-item ${activePath === path ? "active" : ""}`}
      onClick={() => onNavigate(path)}
    >
      <i className={`fa ${icon}`} />
      {!collapsed && <span>{label}</span>}
      {collapsed && <div className="nav-tooltip">{label}</div>}
    </div>
  );
}

/* ---------- Sidebar Main ---------- */

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentUser } = useCRM();
  const sidebarRef = useRef(null);
  const sidebarUser = currentUser ?? { name: 'Shailesh Bhange', avatar: 'SB', role: 'admin' };
  const role = sidebarUser.role;
  const homeItem = { icon: "fa-home", label: "Home", path: "/", roles: ['admin', 'manager', 'user'] };

  const [openGroups, setOpenGroups] = useState({});
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem("sidebar_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("sidebar_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest('[data-sidebar-toggle="true"]')) return;
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onMobileClose?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [mobileOpen, onMobileClose]);

  const toggleBookmark = (item) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.path === item.path);
      if (exists) return prev.filter(b => b.path !== item.path);
      return [...prev, { label: item.label, path: item.path, icon: item.icon }];
    });
  };

  // FIX 3: clean toggleGroup — no comments, no stale closure issues
  const toggleGroup = (id) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const go = (path) => {
    if (pathname !== path) navigate(path);
    if (mobileOpen && onMobileClose) onMobileClose();
  };

  const effectiveCollapsed = mobileOpen ? false : collapsed;

  const handleToggle = () => {
    if (mobileOpen) {
      onMobileClose?.();
      return;
    }
    onToggle?.();
  };

  const visibleGroups = NAV_GROUPS
    .filter(g => g.roles?.includes(role))
    .map(g => ({ ...g, items: g.items.filter(item => item.roles?.includes(role)) }))
    .filter(g => g.items.length > 0);

  const allowedPaths = new Set(visibleGroups.flatMap(g => g.items.map(item => item.path)));
  const visibleBookmarks = bookmarks.filter(item => allowedPaths.has(item.path));

  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        ref={sidebarRef}
        className={`sidebar ${effectiveCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-logo">
          <div className="logo-container">
            {!effectiveCollapsed && (
              <img src="/logo_legaledge.png" alt="LegalEdge CRM" className="logo-img-full" />
            )}
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={handleToggle}
            data-sidebar-toggle="true"
            aria-label={mobileOpen ? 'Close sidebar' : effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`fa ${effectiveCollapsed ? "fa-indent" : "fa-outdent"}`} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {homeItem.roles.includes(role) && (
            <NavItem
              icon={homeItem.icon}
              label={homeItem.label}
              path={homeItem.path}
              activePath={pathname}
              collapsed={effectiveCollapsed}
              onNavigate={go}
            />
          )}

          <NavGroup
            g={{ id: 'bookmarks', icon: 'fa-bookmark', label: 'Bookmarks', items: visibleBookmarks }}
            collapsed={effectiveCollapsed}
            mobileOpen={mobileOpen}
            isOpen={!!openGroups.bookmarks}
            onToggle={toggleGroup}
            onNavigate={go}
            activePath={pathname}
            bookmarks={visibleBookmarks}
            onToggleBookmark={toggleBookmark}
          />

          {!effectiveCollapsed && openGroups.bookmarks && visibleBookmarks.length === 0 && (
            <div className="no-bookmarks-text">No bookmarks yet</div>
          )}

          {visibleGroups.map(g => (
            <NavGroup
              key={g.id}
              g={g}
              collapsed={effectiveCollapsed}
              mobileOpen={mobileOpen}
              isOpen={!!openGroups[g.id]}
              onToggle={toggleGroup}
              onNavigate={go}
              activePath={pathname}
              bookmarks={visibleBookmarks}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </nav>

        <div
          className="sidebar-user"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="Go to Profile"
        >
          <div className="user-avatar">{sidebarUser.avatar || 'SB'}</div>
          {!effectiveCollapsed && (
            <div className="user-info">
              <span className="user-name">{sidebarUser.name}</span>
              <span className="user-role">
                {sidebarUser.role
                  ? sidebarUser.role.charAt(0).toUpperCase() + sidebarUser.role.slice(1)
                  : 'Admin'}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
