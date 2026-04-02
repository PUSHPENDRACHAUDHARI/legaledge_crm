import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// ── Styles ───────────────────────────────────────────────────────────────────
import './style.css';
import './styles/breezAI.css';
import './styles/theme-overrides.css';
import './styles/BreezeWidget.css';

// ── Context & Layout ─────────────────────────────────────────────────────────
import { CRMProvider, useCRM } from './context/CRMContext';
import Sidebar from './layouts/Sidebar';
import Topbar from './layouts/Topbar';
import Toast from './components/Toast';
import CreateModal from './components/CreateModal';
import BreezeWidget from './components/BreezeWidget';
import AuthDebugPanel from './components/AuthDebugPanel';

// ── Pages ────────────────────────────────────────────────────────────────────
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Leads from './pages/Leads';
import Deals from './pages/Deals';
import Tasks from './pages/Tasks';
import Companies from './pages/Companies';
import Tickets from './pages/Tickets';
import Calls from './pages/Calls';
import Inbox from './pages/Inbox';
import SalesAnalytics from './pages/SalesAnalytics';
import Commerce from './pages/Commerce';
import Forecast from './pages/Forecast';
import Automation from './pages/Automation';
import SalesTools from './pages/SalesTools';
import BreezePages from './pages/BreezePages';
import DataManagement from './pages/DataManagement';
import Integrations from './pages/Integrations';
import ContentHub from './pages/ContentHub';
import TargetAccounts from './pages/TargetAccounts';
import Segment from './pages/Segments';
import SalesWorkspace from './pages/SalesWorkspace';
import Sequences from './pages/Sequences';
import HelpDesk from './pages/HelpDesk';
import KnowledgeBase from './pages/KnowledgeBase';
import Feedback from './pages/Feedback';
import Goals from './pages/Goals';
import Webpages from './pages/Webpages';
import LandingPages from './pages/LandingPages';
import Videos from './pages/Videos';
import Podcast from './pages/Podcast';  
import CaseStudies from './pages/CaseStudies';
import DesignManager from './pages/DesignManager';
import DataIntegration from './pages/DataIntegration';
import DataEnrichment from './pages/DataEnrichment';
import AddedAgents from './pages/AddedAgents';
import Coaching from './pages/Coaching';
import GenericPage from './pages/GenericPage';
import RecentActivity from './pages/recent-activity.component';
import Settings from './pages/Profile';
import Campaigns from './pages/Campaigns';
import EmailMarketing from './pages/Email';
import Social from './pages/Social';
import Ads from './pages/Ads';
import Events from './pages/Events';
import Forms from './pages/Forms';
import BuyerIntend from './pages/BuyerIntend';
import LeadScoring from './pages/LeadScoring';
import LeadScoringPage from './pages/LeadScoringPage';
import AddUser from './pages/User';
import AddManager from './pages/Manager';
import ManagerDashboard from './pages/ManagerDashboard';
import UserDashboard from './pages/UserDashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AuthEntry from './pages/AuthEntry';
import UserManagement from './pages/UserManagement';
import { canAccessRoute } from './utils/permissions';

const roleLandingPath = (role) => {
  if (role === 'admin') return '/admin/home';
  if (role === 'manager') return '/manager/dashboard';
  if (role === 'user') return '/user/dashboard';
  return '/dashboards';
};




// ── Generic route definitions ─────────────────────────────────────────────────
const GENERIC_ROUTES = [
  // ['/campaigns',       'Campaigns',        'fa-rocket',          'Manage your marketing campaigns'      ], // Replaced by dedicated route
  // ['/email-marketing', 'Email Marketing',  'fa-envelope',        'Create and send email campaigns'      ], // Replaced by dedicated route
  // ['/social',          'Social Media',     'fa-share-alt',       'Manage social media activities'       ], // Replaced by dedicated route

  ['/data-model', 'Data Model', 'fa-project-diagram', 'View CRM data schema'],
];

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { currentUser, authChecked } = useCRM();
  const location = useLocation();
  const showAuthDebug = import.meta.env.DEV && import.meta.env.VITE_SHOW_AUTH_DEBUG === 'true';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const isPublicRoute = ['/', '/login', '/signup'].includes(location.pathname);
  const landingPath = roleLandingPath(currentUser?.role);

  useEffect(() => {
    setMobileSidebar(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebar) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileSidebar(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileSidebar]);

  // FIX: Don't redirect until auth check is complete
  if (!authChecked) {
    return (
      <div className="app-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <main className="page-content" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
        </main>
      </div>
    );
  }

  if (isPublicRoute) {
    return (
      <div className="app-root">
        <main className="page-content">
          <Routes>
            <Route
              path="/"
              element={currentUser ? <Navigate to={landingPath} replace /> : <AuthEntry />}
            />
            <Route
              path="/login"
              element={currentUser ? <Navigate to={landingPath} replace /> : <Login />}
            />
            <Route
              path="/signup"
              element={currentUser ? <Navigate to={landingPath} replace /> : <SignUp />}
            />
            <Route path="*" element={<Navigate to={currentUser ? landingPath : '/'} replace />} />
          </Routes>
        </main>
        <Toast />
        {showAuthDebug && <AuthDebugPanel />}
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessRoute(currentUser.role, location.pathname)) {
    return <Navigate to={landingPath} replace />;
  }

  return (
    <div className={`app-root${mobileSidebar ? ' sidebar-drawer-open' : ''}`}>
      <Sidebar
        collapsed={!sidebarOpen}
        mobileOpen={mobileSidebar}
        onToggle={() => setSidebarOpen(prev => !prev)}
        onMobileClose={() => setMobileSidebar(false)}
      />

      <div className={`main-wrapper${sidebarOpen ? '' : ' collapsed'}`}>
        <Topbar
          onCreateNew={() => setCreateOpen(true)}
          onMobileMenu={() => setMobileSidebar(prev => !prev)}
        />

        <main className="page-content">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/dashboards" element={<RoleDashboard />} />
            <Route path="/admin/home" element={<Home />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/admin/*" element={<Navigate to="/admin/home" replace />} />
            <Route path="/manager/*" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/user/*" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />

            <Route path="/contacts" element={<Contacts />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/helpdesk" element={<HelpDesk />} />
            <Route path="/target-accounts" element={<TargetAccounts />} />
            <Route path="/segments" element={<Segment />} />
            <Route path="/calls" element={<Calls view="calls" />} />
            <Route path="/inbox" element={<Inbox />} />

            <Route path="/user" element={<AddUser />} />
            <Route path="/manager" element={<AddManager />} />
            <Route path="/user-management" element={<UserManagement />} />

            <Route path="/meetings" element={<Calls view="meetings" />} />
            <Route path="/reports" element={<SalesAnalytics view="reports" />} />
            <Route path="/sales-analytics" element={<SalesAnalytics />} />
            <Route path="/commerce-analytics" element={<SalesAnalytics view="commerce" />} />
            <Route path="/service-analytics" element={<SalesAnalytics view="service" />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/forecast" element={<Forecast />} />

            <Route path="/commerce-overview" element={<Commerce view="overview" />} />
            <Route path="/quotes" element={<Commerce view="quotes" />} />
            <Route path="/products" element={<Commerce view="products" />} />
            <Route path="/orders" element={<Commerce view="orders" />} />
            <Route path="/invoices" element={<Commerce view="invoices" />} />
            <Route path="/payments" element={<Commerce view="payments" />} />
            <Route path="/subscriptions" element={<Commerce view="subscriptions" />} />

            <Route path="/playbooks" element={<SalesTools view="playbooks" />} />
            <Route path="/message-templates" element={<SalesTools view="templates" />} />
            <Route path="/snippets" element={<SalesTools view="snippets" />} />
            <Route path="/documents" element={<SalesTools view="documents" />} />
            <Route path="/coaching-playlists" element={<Coaching />} />
            <Route path="/activity-feed" element={<SalesTools view="activity" />} />
            <Route path="/sales-workspace" element={<SalesWorkspace />} />
            <Route path="/sequences" element={<Sequences />} />

            <Route path="/breeze-studio" element={<BreezePages view="studio" />} />
            <Route path="/knowledge-vaults" element={<BreezePages view="vaults" />} />
            <Route path="/prospecting-agent" element={<BreezePages view="prospecting" />} />
            <Route path="/customer-agent" element={<BreezePages view="customer" />} />
            <Route path="/buyer-intent" element={<BuyerIntend />} />

            <Route path="/data-agent" element={<DataManagement view="agent" />} />
            <Route path="/data-integration" element={<DataIntegration />} />
            <Route path="/data-quality" element={<DataManagement view="quality" />} />
            <Route path="/data-enrichment" element={<DataEnrichment />} />

            <Route path="/marketplace-apps" element={<Integrations view="marketplace" />} />
            <Route path="/breeze-marketplace" element={<Integrations view="marketplace" />} />
            <Route path="/connected-apps" element={<Integrations view="connected" />} />

            <Route path="/blogs" element={<ContentHub view="blogs" />} />
            <Route path="/seo" element={<ContentHub view="seo" />} />
            <Route path="/brand" element={<ContentHub view="brand" />} />
            <Route path="/chat-flows" element={<ContentHub view="chatflows" />} />

            <Route path="/automation" element={<Automation />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/recent-activity" element={<RecentActivity />} />
            <Route path="/website-pages" element={<Webpages />} />
            <Route path="/landing-pages" element={<LandingPages />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/podcasts" element={<Podcast />} />
            <Route path="/podcast" element={<Navigate to="/podcasts" replace />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/design-manager" element={<DesignManager />} />
            <Route path="/added-agents" element={<AddedAgents />} />
            <Route path="/settings" element={<Settings view="settings" />} />
            <Route path="/profile" element={<Settings view="profile" />} />

            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/email-marketing" element={<EmailMarketing />} />
            <Route path="/social" element={<Social />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/events" element={<Events />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/lead-scoring" element={<LeadScoring />} />
            <Route path="/lead-scoring-page" element={<LeadScoringPage />} />

            {GENERIC_ROUTES.map(([path, title, icon, desc]) => (
              <Route
                key={path}
                path={path}
                element={<GenericPage title={title} icon={icon} description={desc} />}
              />
            ))}

            <Route path="*" element={<Navigate to={landingPath} replace />} />
          </Routes>
        </main>
      </div>

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <Toast />
      <BreezeWidget />
      {showAuthDebug && <AuthDebugPanel />}
    </div>
  );
}

function RoleDashboard() {
  const { currentUser } = useCRM();
  const role = currentUser?.role;

  if (role === 'manager') return <ManagerDashboard />;
  if (role === 'user') return <UserDashboard />;
  return <Dashboard />;
}

export default function App() {
  return (
    <CRMProvider>
      <AppShell />
    </CRMProvider>
  );
}
