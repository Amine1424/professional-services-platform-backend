import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Compass,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { withRedirect } from '../../lib/auth-redirect';
import { getDefaultRouteByRole, getStoredUser } from '../../lib/role-routing';

interface PublicProviderTopNavProps {
  providerName: string;
  hasStories?: boolean;
}

const PublicProviderTopNav: React.FC<PublicProviderTopNavProps> = ({
  providerName,
  hasStories = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useI18n();
  const token = localStorage.getItem('accessToken');
  const user = useMemo(() => getStoredUser(), []);
  const isSignedIn = Boolean(token && user);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const currentPublicPath = `${location.pathname}${location.search}${location.hash}`;
  const dashboardRoute = getDefaultRouteByRole(user?.role);
  const notificationsRoute =
    user?.role === 'service_provider'
      ? '/provider/notifications'
      : user?.role === 'customer'
        ? '/customer/notifications'
        : dashboardRoute;
  const messagesRoute =
    user?.role === 'service_provider'
      ? '/provider/messages'
      : user?.role === 'customer'
        ? '/customer/messages'
        : dashboardRoute;

  const quickLinks = [
    { href: '#provider-services', label: t('Services') },
    ...(hasStories ? [{ href: '#provider-stories', label: t('Recent Updates') }] : []),
    { href: '#provider-portfolio', label: t('Portfolio') },
    { href: '#provider-reviews', label: t('Reviews') },
    { href: '#provider-support', label: t('Business Details') },
  ];

  const profileName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('Profile');
  const profileInitials =
    profileName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'PS';

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

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/explore');
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-3 z-40 mb-6 rounded-[28px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_18px_55px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label={t('Back')}
          >
            <ArrowLeft size={17} />
          </button>

          <div className="hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Compass size={15} />
                <span>{t('Explore')}</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="truncate font-semibold text-slate-900">{providerName}</span>
            </div>
            <div className="mt-1 truncate text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              {t('Provider page')}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 xl:items-end">
          <nav className="flex min-w-0 max-w-full items-center gap-2 overflow-x-auto pb-1 xl:justify-end xl:pb-0">
            {quickLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 self-end">
            {isSignedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(messagesRoute)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label={t('Messages')}
                >
                  <MessageCircle size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(notificationsRoute)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label={t('Notifications')}
                >
                  <Bell size={16} />
                </button>

                <Link
                  to={dashboardRoute}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <LayoutDashboard size={15} />
                  {t('Dashboard')}
                </Link>

                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    aria-label={t('Profile')}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                      {profileInitials}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[240px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="rounded-xl bg-slate-50 px-3 py-3">
                        <div className="text-sm font-semibold text-slate-950">{profileName}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {user?.email || t('Customer Workspace')}
                        </div>
                      </div>

                      <div className="mt-2 grid gap-1">
                        <Link
                          to={dashboardRoute}
                          onClick={() => setProfileMenuOpen(false)}
                          className="inline-flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <span className="inline-flex items-center gap-2">
                            <LayoutDashboard size={16} />
                            {t('Dashboard')}
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
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate(withRedirect('/login', currentPublicPath))}
                className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {t('Sign In')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicProviderTopNav;
