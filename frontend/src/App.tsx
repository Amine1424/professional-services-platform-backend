import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import LanguageSwitcher from './components/LanguageSwitcher';
import { store } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import RoleShell from './components/RoleShell';
import { AUTH_REQUIRED_EVENT } from './config/api';
import { LanguageProvider } from './i18n';
import { AppRole } from './lib/role-routing';
import Login from './pages/Login';
import CustomerRegister from './pages/CustomerRegister';
import ProviderRegister from './pages/ProviderRegister';
import Home from './pages/Home';
import CustomerExplore from './pages/CustomerExplore';
import PublicProviderPage from './pages/PublicProviderPage';
import CustomerOrders from './pages/CustomerOrders';
import ProviderRequests from './pages/ProviderRequests';
import CustomerHome from './pages/CustomerHome';
import CustomerFavorites from './pages/CustomerFavorites';
import CustomerProfile from './pages/CustomerProfile';
import CustomerSubscriptions from './pages/CustomerSubscriptions';
import CustomerReviews from './pages/CustomerReviews';
import CustomerNotifications from './pages/CustomerNotifications';
import CustomerMessages from './pages/CustomerMessages';
import ProviderNotifications from './pages/ProviderNotifications';
import ProviderDashboard from './pages/ProviderDashboard';
import ProviderProfile from './pages/ProviderProfile';
import ProviderServices from './pages/ProviderServices';
import ProviderPortfolio from './pages/ProviderPortfolio';
import ProviderMessages from './pages/ProviderMessages';
import ProviderSubscription from './pages/ProviderSubscription';
import ProviderSettings from './pages/ProviderSettings';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewerPending from './pages/ReviewerPending';
import ReviewerHistory from './pages/ReviewerHistory';
import ReviewerInbox from './pages/ReviewerInbox';
import ReviewerProviderReview from './pages/ReviewerProviderReview';
import ReviewerProfile from './pages/ReviewerProfile';
import AdminDashboard from './pages/AdminDashboard';
import AdminProviders from './pages/AdminProviders';
import AdminCategories from './pages/AdminCategories';
import AdminReviewInbox from './pages/AdminReviewInbox';
import AdminRegions from './pages/AdminRegions';
import AdminReports from './pages/AdminReports';
import AdminUsers from './pages/AdminUsers';
import AdminContent from './pages/AdminContent';
import AdminReviewers from './pages/AdminReviewers';
import AdminSettings from './pages/AdminSettings';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import './styles/app-primitives.css';

type ShellLayout = 'default' | 'immersive';

interface ShellRouteConfig {
  path: string;
  role: AppRole;
  allowedRoles: string[];
  title: string;
  subtitle: string;
  element: React.ReactNode;
  layout?: ShellLayout;
}

const renderShellRoute = ({
  path,
  role,
  allowedRoles,
  title,
  subtitle,
  element,
  layout = 'default',
}: ShellRouteConfig) => (
  <Route
    key={path}
    path={path}
    element={
      <ProtectedRoute allowedRoles={allowedRoles}>
        <RoleShell role={role} title={title} subtitle={subtitle} layout={layout}>
          {element}
        </RoleShell>
      </ProtectedRoute>
    }
  />
);

const AuthRedirectBridge: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      const redirect = (event as CustomEvent<{ redirect?: string }>).detail?.redirect;
      const redirectQuery = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
      navigate(`/login${redirectQuery}`, { replace: true });
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);

    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handleAuthRequired);
    };
  }, [navigate]);

  return null;
};

const customerRoutes: ShellRouteConfig[] = [
  {
    path: '/customer/dashboard',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Customer Overview',
    subtitle: 'Track requests, favorites, messages, and next actions in one place.',
    element: <CustomerHome />,
  },
  {
    path: '/customer/explore',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Explore Providers',
    subtitle: 'Search providers by category, location, and quality signals.',
    element: <CustomerExplore />,
  },
  {
    path: '/customer/messages',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Messages',
    subtitle: 'Continue conversations and move directly from chat to request.',
    element: <CustomerMessages />,
    layout: 'immersive',
  },
  {
    path: '/customer/orders',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Requests',
    subtitle: 'Track service requests, quotes, and provider follow-up.',
    element: <CustomerOrders />,
  },
  {
    path: '/customer/favorites',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Favorites',
    subtitle: 'Return quickly to providers you saved for later.',
    element: <CustomerFavorites />,
  },
  {
    path: '/customer/notifications',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Notifications',
    subtitle: 'Messages, requests, comments, and provider activity in one feed.',
    element: <CustomerNotifications />,
  },
  {
    path: '/customer/reviews',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Reviews',
    subtitle: 'Manage ratings and feedback you published on provider profiles.',
    element: <CustomerReviews />,
  },
  {
    path: '/customer/subscriptions',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Subscription',
    subtitle: 'Review customer plan benefits and account preferences.',
    element: <CustomerSubscriptions />,
  },
  {
    path: '/customer/profile',
    role: 'customer',
    allowedRoles: ['customer'],
    title: 'Profile',
    subtitle: 'Update account details, location preferences, and password.',
    element: <CustomerProfile />,
  },
];

const providerRoutes: ShellRouteConfig[] = [
  {
    path: '/provider/dashboard',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Provider Overview',
    subtitle: 'Monitor business health, moderation status, and growth signals.',
    element: <ProviderDashboard />,
  },
  {
    path: '/provider/profile',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Provider Profile',
    subtitle: 'Manage business identity, category, response speed, and public presence.',
    element: <ProviderProfile />,
  },
  {
    path: '/provider/services',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Services',
    subtitle: 'Create, publish, and position the services customers can request.',
    element: <ProviderServices />,
  },
  {
    path: '/provider/portfolio',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Portfolio',
    subtitle: 'Publish media, moderate comments, and strengthen proof of work.',
    element: <ProviderPortfolio />,
  },
  {
    path: '/provider/requests',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Requests',
    subtitle: 'Process incoming leads, quote faster, and update customer-facing status.',
    element: <ProviderRequests />,
  },
  {
    path: '/provider/messages',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Messages',
    subtitle: 'Run the shared inbox and use AI support for faster replies.',
    element: <ProviderMessages />,
    layout: 'immersive',
  },
  {
    path: '/provider/notifications',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Notifications',
    subtitle: 'Review request, message, comment, and favorite-provider activity.',
    element: <ProviderNotifications />,
  },
  {
    path: '/provider/subscription',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Plan and Visibility',
    subtitle: 'Control featured visibility, badges, and plan-dependent capabilities.',
    element: <ProviderSubscription />,
  },
  {
    path: '/provider/settings',
    role: 'service_provider',
    allowedRoles: ['service_provider'],
    title: 'Settings',
    subtitle: 'Update privacy, security, and personal account settings.',
    element: <ProviderSettings />,
  },
];

const reviewerRoutes: ShellRouteConfig[] = [
  {
    path: '/reviewer/dashboard',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Reviewer Overview',
    subtitle: 'Track pending providers, review throughput, and moderation quality.',
    element: <ReviewerDashboard />,
  },
  {
    path: '/reviewer/pending',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Pending Reviews',
    subtitle: 'Open provider submissions and move them to an explicit decision.',
    element: <ReviewerPending />,
  },
  {
    path: '/reviewer/history',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Review History',
    subtitle: 'Audit past moderation decisions with notes and provider status changes.',
    element: <ReviewerHistory />,
  },
  {
    path: '/reviewer/inbox',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Review Inbox',
    subtitle: 'Handle review assignments, context exchange, and decisions in one thread view.',
    element: <ReviewerInbox />,
    layout: 'immersive',
  },
  {
    path: '/reviewer/profile',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Reviewer Profile',
    subtitle: 'Inspect reviewer identity, workload, and approval volume.',
    element: <ReviewerProfile />,
  },
  {
    path: '/reviewer/providers/:id',
    role: 'reviewer',
    allowedRoles: ['reviewer'],
    title: 'Provider Review',
    subtitle: 'Review provider content, public proof, and moderation history before deciding.',
    element: <ReviewerProviderReview />,
  },
];

const adminRoutes: ShellRouteConfig[] = [
  {
    path: '/admin/dashboard',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Admin Overview',
    subtitle: 'Monitor marketplace health, moderation volume, and growth signals.',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/users',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Users',
    subtitle: 'Search users, manage activation state, and control role assignments.',
    element: <AdminUsers />,
  },
  {
    path: '/admin/providers',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Providers',
    subtitle: 'Control provider status, verification, and featured visibility.',
    element: <AdminProviders />,
  },
  {
    path: '/admin/categories',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Categories',
    subtitle: 'Maintain marketplace taxonomy and discovery structure.',
    element: <AdminCategories />,
  },
  {
    path: '/admin/review-inbox',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Review Inbox',
    subtitle: 'Send cases to reviewers, discuss profiles, and receive decisions in-thread.',
    element: <AdminReviewInbox />,
    layout: 'immersive',
  },
  {
    path: '/admin/regions',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Regions',
    subtitle: 'Manage geographic coverage used in discovery and provider profiles.',
    element: <AdminRegions />,
  },
  {
    path: '/admin/reports',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Reports',
    subtitle: 'Inspect operational metrics and exportable platform reporting.',
    element: <AdminReports />,
  },
  {
    path: '/admin/content',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Content Moderation',
    subtitle: 'Review public content and remove problematic comments or media.',
    element: <AdminContent />,
  },
  {
    path: '/admin/reviewers',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Reviewers',
    subtitle: 'Manage reviewer access, staffing, and moderation coverage.',
    element: <AdminReviewers />,
  },
  {
    path: '/admin/settings',
    role: 'admin',
    allowedRoles: ['admin', 'super_admin'],
    title: 'Settings',
    subtitle: 'Control platform-level operational settings and maintenance toggles.',
    element: <AdminSettings />,
  },
];

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Provider store={store}>
        <Router>
          <AuthRedirectBridge />
          <LanguageSwitcher />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<CustomerExplore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/join/customer" replace />} />
            <Route path="/signup" element={<Navigate to="/join/customer" replace />} />
            <Route
              path="/customer-dashboard"
              element={<Navigate to="/customer/dashboard" replace />}
            />
            <Route
              path="/provider-dashboard"
              element={<Navigate to="/provider/dashboard" replace />}
            />
            <Route path="/join/customer" element={<CustomerRegister />} />
            <Route path="/join/provider" element={<ProviderRegister />} />
            <Route path="/providers/:id" element={<PublicProviderPage />} />

            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/provider" element={<Navigate to="/provider/dashboard" replace />} />
            <Route path="/reviewer" element={<Navigate to="/reviewer/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {customerRoutes.map(renderShellRoute)}
            {providerRoutes.map(renderShellRoute)}
            {reviewerRoutes.map(renderShellRoute)}
            {adminRoutes.map(renderShellRoute)}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </Provider>
    </LanguageProvider>
  );
};

export default App;