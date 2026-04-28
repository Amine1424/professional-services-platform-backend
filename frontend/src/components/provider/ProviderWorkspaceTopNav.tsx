import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Compass,
  ExternalLink,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  UserCircle2,
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { getStoredUser } from '../../lib/role-routing';

type ProviderWorkspacePage =
  | 'dashboard'
  | 'profile'
  | 'services'
  | 'portfolio'
  | 'requests'
  | 'messages'
  | 'notifications'
  | 'subscription'
  | 'settings';

interface ProviderWorkspaceTopNavProps {
  currentPage?: ProviderWorkspacePage;
  pendingRequestsCount?: number;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  draftPortfolioCount?: number;
  refreshKey?: number;
  fluid?: boolean;
}

interface NavCounts {
  pendingRequests: number;
  unreadMessages: number;
  unreadNotifications: number;
  draftPortfolio: number;
}

const NAV_ITEMS: Array<{
  id: ProviderWorkspacePage;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}> = [
  {
    id: 'dashboard',
    label: 'Overview',
    to: '/provider/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'requests',
    label: 'Requests',
    to: '/provider/requests',
    icon: FileText,
  },
  {
    id: 'messages',
    label: 'Inbox',
    to: '/provider/messages',
    icon: MessageCircle,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    to: '/provider/portfolio',
    icon: Image,
  },
  {
    id: 'profile',
    label: 'Profile',
    to: '/provider/profile',
    icon: UserCircle2,
  },
  {
    id: 'services',
    label: 'Services',
    to: '/provider/services',
    icon: BriefcaseBusiness,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    to: '/provider/notifications',
    icon: Bell,
  },
  {
    id: 'subscription',
    label: 'Plans',
    to: '/provider/subscription',
    icon: Compass,
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/provider/settings',
    icon: Settings,
  },
];

const QUICK_ITEMS = NAV_ITEMS.filter((item) =>
  ['requests', 'messages', 'portfolio'].includes(item.id)
);

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const derivePageFromPathname = (pathname: string): ProviderWorkspacePage => {
  if (pathname.startsWith('/provider/profile')) return 'profile';
  if (pathname.startsWith('/provider/services')) return 'services';
  if (pathname.startsWith('/provider/portfolio')) return 'portfolio';
  if (pathname.startsWith('/provider/requests')) return 'requests';
  if (pathname.startsWith('/provider/messages')) return 'messages';
  if (pathname.startsWith('/provider/notifications')) return 'notifications';
  if (pathname.startsWith('/provider/subscription')) return 'subscription';
  if (pathname.startsWith('/provider/settings')) return 'settings';
  return 'dashboard';
};

const countPendingRequests = (items: Array<{ status?: string | null }>) =>
  items.filter((item) => ['new', 'reviewed'].includes(String(item.status || ''))).length;

export const ProviderWorkspaceTopNav: React.FC<ProviderWorkspaceTopNavProps> = ({
  currentPage,
  pendingRequestsCount,
  unreadMessagesCount,
  unreadNotificationsCount,
  draftPortfolioCount,
  refreshKey = 0,
  fluid = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useI18n();
  const user = getStoredUser();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const derivedPage = currentPage || derivePageFromPathname(location.pathname);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [counts, setCounts] = useState<NavCounts>({
    pendingRequests: pendingRequestsCount ?? 0,
    unreadMessages: unreadMessagesCount ?? 0,
    unreadNotifications: unreadNotificationsCount ?? 0,
    draftPortfolio: draftPortfolioCount ?? 0,
  });

  useEffect(() => {
    setCounts((current) => ({
      pendingRequests: pendingRequestsCount ?? current.pendingRequests,
      unreadMessages: unreadMessagesCount ?? current.unreadMessages,
      unreadNotifications: unreadNotificationsCount ?? current.unreadNotifications,
      draftPortfolio: draftPortfolioCount ?? current.draftPortfolio,
    }));
  }, [
    draftPortfolioCount,
    pendingRequestsCount,
    unreadMessagesCount,
    unreadNotificationsCount,
  ]);

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      const next: Partial<NavCounts> = {};

      try {
        if (pendingRequestsCount === undefined) {
          const response = await api.get('/orders/provider');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.pendingRequests = countPendingRequests(items);
        }

        if (unreadMessagesCount === undefined) {
          const response = await api.get('/messages/conversations');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.unreadMessages = items.reduce(
            (total: number, item: { unreadCount?: number }) => total + Number(item.unreadCount || 0),
            0
          );
        }

        if (unreadNotificationsCount === undefined) {
          const response = await api.get('/notifications/me');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.unreadNotifications = items.filter(
            (item: { isRead?: boolean }) => !item.isRead
          ).length;
        }

        if (draftPortfolioCount === undefined) {
          const response = await api.get('/provider-media/me');
          const items = Array.isArray(response.data?.data?.items) ? response.data.data.items : [];
          next.draftPortfolio = items.filter(
            (item: { isPublished?: boolean }) => !item.isPublished
          ).length;
        }
      } catch (error) {
        console.error('Failed to hydrate provider workspace top nav', error);
      }

      if (!active) {
        return;
      }

      setCounts((current) => ({
        pendingRequests: pendingRequestsCount ?? next.pendingRequests ?? current.pendingRequests,
        unreadMessages: unreadMessagesCount ?? next.unreadMessages ?? current.unreadMessages,
        unreadNotifications:
          unreadNotificationsCount ?? next.unreadNotifications ?? current.unreadNotifications,
        draftPortfolio: draftPortfolioCount ?? next.draftPortfolio ?? current.draftPortfolio,
      }));
    };

    void fetchCounts();

    return () => {
      active = false;
    };
  }, [
    draftPortfolioCount,
    pendingRequestsCount,
    refreshKey,
    unreadMessagesCount,
    unreadNotificationsCount,
  ]);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [profileMenuOpen]);

  const currentItem =
    NAV_ITEMS.find((item) => item.id === derivedPage) ||
    NAV_ITEMS.find((item) => item.id === 'dashboard')!;

  const profileName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('Provider Workspace');
  const profileInitials = getInitials(profileName || 'PS');

  const breadcrumbItems = useMemo(() => {
    if (derivedPage === 'dashboard') {
      return [NAV_ITEMS[0]];
    }

    return [NAV_ITEMS[0], currentItem];
  }, [currentItem, derivedPage]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/provider/dashboard');
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/78">
      <div
        className={`flex h-16 items-center justify-between gap-3 px-0 ${
          fluid ? 'w-full px-0' : 'psp-desktop-frame'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {derivedPage !== 'dashboard' ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={t('Back')}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            </>
          ) : null}

          <nav className="flex min-w-0 items-center gap-1 text-sm">
            <Link
              to="/provider/dashboard"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                derivedPage === 'dashboard'
                  ? 'font-medium text-slate-950'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">{t('Overview')}</span>
            </Link>

            {breadcrumbItems.length > 1 ? (
              <>
                <span className="text-slate-300">/</span>
                <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-950">
                  {(() => {
                    const Icon = currentItem.icon;
                    return <Icon size={16} />;
                  })()}
                  <span>{t(currentItem.label)}</span>
                </span>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          {QUICK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentItem.id === item.id;
            const count =
              item.id === 'requests'
                ? counts.pendingRequests
                : item.id === 'messages'
                  ? counts.unreadMessages
                  : counts.draftPortfolio;

            return (
              <Link
                key={item.id}
                to={item.to}
                className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-50 font-medium text-emerald-900'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{t(item.label)}</span>
                {count > 0 && !isActive ? (
                  <span
                    className={`absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                      item.id === 'portfolio'
                        ? 'bg-amber-500'
                        : item.id === 'messages'
                          ? 'bg-red-500'
                          : 'bg-emerald-600'
                    }`}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

          <Link
            to="/provider/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t('Notifications')}
          >
            <Bell size={16} />
            {counts.unreadNotifications > 0 ? (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-600" />
            ) : null}
          </Link>

          <div ref={dropdownRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-1.5 text-slate-700 transition hover:bg-slate-100"
              aria-label={t('Profile')}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                {profileInitials}
              </span>
              <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
            </button>

            {profileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[250px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_48px_rgba(15,23,42,0.14)]">
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <div className="text-sm font-semibold text-slate-950">{profileName}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {user?.email || t('Provider Workspace')}
                  </div>
                </div>

                <div className="mt-2 grid gap-1">
                  <Link
                    to="/provider/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="inline-flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserCircle2 size={16} />
                      {t('Profile')}
                    </span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </Link>

                  <Link
                    to="/provider/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="inline-flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Settings size={16} />
                      {t('Settings')}
                    </span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </Link>

                  <Link
                    to="/"
                    onClick={() => setProfileMenuOpen(false)}
                    className="inline-flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Compass size={16} />
                      {t('Open Marketplace')}
                    </span>
                    <ExternalLink size={14} className="text-slate-400" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    {t('Sign Out')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProviderWorkspaceTopNav;
