import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Compass,
  ExternalLink,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Star,
  UserCircle2,
} from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { getStoredUser } from '../../lib/role-routing';
import { getRequestStatusMeta } from '../../lib/service-request';

type CustomerWorkspacePage =
  | 'dashboard'
  | 'explore'
  | 'messages'
  | 'requests'
  | 'favorites'
  | 'notifications'
  | 'reviews'
  | 'subscription'
  | 'profile';

interface CustomerWorkspaceTopNavProps {
  currentPage?: CustomerWorkspacePage;
  unreadMessagesCount?: number;
  activeRequestsCount?: number;
  unreadNotificationsCount?: number;
  refreshKey?: number;
  variant?: 'enhanced' | 'v0';
}

interface NavCounts {
  unreadMessages: number;
  activeRequests: number;
  unreadNotifications: number;
}

const NAV_ITEMS: Array<{
  id: CustomerWorkspacePage;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}> = [
  {
    id: 'dashboard',
    label: 'Overview',
    to: '/customer/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'explore',
    label: 'Explore',
    to: '/customer/explore',
    icon: Compass,
  },
  {
    id: 'messages',
    label: 'Messages',
    to: '/customer/messages',
    icon: MessageCircle,
  },
  {
    id: 'requests',
    label: 'Requests',
    to: '/customer/orders',
    icon: FileText,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    to: '/customer/favorites',
    icon: Heart,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    to: '/customer/notifications',
    icon: Bell,
  },
  {
    id: 'reviews',
    label: 'Reviews',
    to: '/customer/reviews',
    icon: Star,
  },
  {
    id: 'subscription',
    label: 'Subscription',
    to: '/customer/subscriptions',
    icon: UserCircle2,
  },
  {
    id: 'profile',
    label: 'Profile',
    to: '/customer/profile',
    icon: UserCircle2,
  },
];

const QUICK_ITEMS = NAV_ITEMS.filter((item) => ['explore', 'messages', 'requests'].includes(item.id));

const derivePageFromPathname = (pathname: string): CustomerWorkspacePage => {
  if (pathname.startsWith('/customer/explore')) return 'explore';
  if (pathname.startsWith('/customer/messages')) return 'messages';
  if (pathname.startsWith('/customer/orders')) return 'requests';
  if (pathname.startsWith('/customer/favorites')) return 'favorites';
  if (pathname.startsWith('/customer/notifications')) return 'notifications';
  if (pathname.startsWith('/customer/reviews')) return 'reviews';
  if (pathname.startsWith('/customer/subscriptions')) return 'subscription';
  if (pathname.startsWith('/customer/profile')) return 'profile';
  return 'dashboard';
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const countActiveRequests = (items: Array<{ status?: string | null }>) =>
  items.reduce((total, item) => {
    const meta = getRequestStatusMeta(item.status || undefined);
    const isOpen =
      item.status === 'new' || item.status === 'quoted' || meta.group === 'active';
    return total + (isOpen ? 1 : 0);
  }, 0);

export const CustomerWorkspaceTopNav: React.FC<CustomerWorkspaceTopNavProps> = ({
  currentPage,
  unreadMessagesCount,
  activeRequestsCount,
  unreadNotificationsCount,
  refreshKey = 0,
  variant = 'enhanced',
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
    unreadMessages: unreadMessagesCount ?? 0,
    activeRequests: activeRequestsCount ?? 0,
    unreadNotifications: unreadNotificationsCount ?? 0,
  });

  useEffect(() => {
    setCounts((current) => ({
      unreadMessages: unreadMessagesCount ?? current.unreadMessages,
      activeRequests: activeRequestsCount ?? current.activeRequests,
      unreadNotifications: unreadNotificationsCount ?? current.unreadNotifications,
    }));
  }, [activeRequestsCount, unreadMessagesCount, unreadNotificationsCount]);

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      const next: Partial<NavCounts> = {};

      try {
        if (unreadMessagesCount === undefined) {
          const response = await api.get('/messages/conversations');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.unreadMessages = items.reduce(
            (total: number, item: { unreadCount?: number }) => total + Number(item.unreadCount || 0),
            0
          );
        }

        if (activeRequestsCount === undefined) {
          const response = await api.get('/orders/customer');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.activeRequests = countActiveRequests(items);
        }

        if (unreadNotificationsCount === undefined) {
          const response = await api.get('/notifications/me');
          const items = Array.isArray(response.data?.data) ? response.data.data : [];
          next.unreadNotifications = items.filter(
            (item: { isRead?: boolean }) => !item.isRead
          ).length;
        }
      } catch (error) {
        console.error('Failed to hydrate customer workspace top nav', error);
      }

      if (!active) {
        return;
      }

      setCounts((current) => ({
        unreadMessages: unreadMessagesCount ?? next.unreadMessages ?? current.unreadMessages,
        activeRequests: activeRequestsCount ?? next.activeRequests ?? current.activeRequests,
        unreadNotifications:
          unreadNotificationsCount ?? next.unreadNotifications ?? current.unreadNotifications,
      }));
    };

    void fetchCounts();

    return () => {
      active = false;
    };
  }, [
    activeRequestsCount,
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
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('Customer');
  const profileInitials = getInitials(profileName || 'PS');

  const breadcrumbItems = useMemo(() => {
    if (derivedPage === 'dashboard') {
      return [NAV_ITEMS[0]];
    }

    return [NAV_ITEMS[0], currentItem];
  }, [currentItem, derivedPage]);

  const handleBack = () => {
    if (variant === 'v0') {
      navigate('/customer/dashboard');
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/customer/dashboard');
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white px-4">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {derivedPage !== 'dashboard' ? (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={t('Back')}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            </>
          ) : null}

          <nav className="flex min-w-0 items-center gap-1 text-sm">
            <Link
              to="/customer/dashboard"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors ${
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
                <span className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-950">
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
              item.id === 'messages'
                ? counts.unreadMessages
                : item.id === 'requests'
                  ? counts.activeRequests
                  : 0;

            return (
              <Link
                key={item.id}
                to={item.to}
                className={`relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 font-medium text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{t(item.label)}</span>
                {count > 0 && !isActive ? (
                  <span
                    className={`absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                      item.id === 'messages' ? 'bg-red-500' : 'bg-blue-600'
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
            to="/customer/notifications"
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={t('Notifications')}
          >
            <Bell size={16} />
            {counts.unreadNotifications > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-600" />
            ) : null}
          </Link>

          {variant === 'enhanced' ? (
            <div ref={dropdownRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="inline-flex h-8 items-center gap-2 rounded-md px-1.5 text-slate-700 transition hover:bg-slate-100"
                aria-label={t('Profile')}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                  {profileInitials}
                </span>
                <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-[240px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="rounded-lg bg-slate-50 px-3 py-3">
                    <div className="text-sm font-semibold text-slate-950">{profileName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {user?.email || t('Customer Workspace')}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1">
                    <Link
                      to="/customer/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="inline-flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserCircle2 size={16} />
                        {t('Profile')}
                      </span>
                      <ExternalLink size={14} className="text-slate-400" />
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setProfileMenuOpen(false)}
                      className="inline-flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      {t('Sign Out')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default CustomerWorkspaceTopNav;
