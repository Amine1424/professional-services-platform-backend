import React, { useMemo } from 'react';
import { Bell, MessageCircle, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { withRedirect } from '../lib/auth-redirect';
import { useI18n } from '../i18n';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';

type PublicNavKey = 'explore' | 'categories' | 'provider';

interface PublicMarketplaceLayoutProps {
  activeNav?: PublicNavKey;
  children: React.ReactNode;
  backgroundImageUrl?: string;
}

const getNavButtonClasses = (active: boolean) =>
  `psp-control-pill ${active ? 'psp-control-pill--active' : ''}`;

const PublicMarketplaceLayout: React.FC<PublicMarketplaceLayoutProps> = ({
  activeNav = 'explore',
  children,
  backgroundImageUrl,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);
  const token = localStorage.getItem('accessToken');
  const currentPublicPath = `${location.pathname}${location.search}${location.hash}`;

  const isSignedIn = Boolean(token && currentUser);
  const dashboardRoute = getDefaultRouteByRole(currentUser?.role);
  const notificationsRoute =
    currentUser?.role === 'service_provider'
      ? '/provider/notifications'
      : currentUser?.role === 'customer'
        ? '/customer/notifications'
        : dashboardRoute;
  const messagesRoute =
    currentUser?.role === 'service_provider'
      ? '/provider/messages'
      : currentUser?.role === 'customer'
        ? '/customer/messages'
        : dashboardRoute;

  const navigateWithAuth = (path: string) => {
    navigate(isSignedIn ? path : `/login?redirect=${encodeURIComponent(path)}`);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#f7faff_0%,_#dfe9f7_42%,_#d0ddf0_100%)] text-slate-900">
      {backgroundImageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.16]"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,248,255,0.72),rgba(222,233,247,0.9))]" />
        </>
      ) : null}

      <div className="relative mx-auto max-w-[1540px] px-4 py-6 md:px-6 lg:px-10 xl:px-12">
        <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/70 shadow-[0_40px_90px_rgba(80,108,154,0.18)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(76,122,214,0.16),_transparent_28%),radial-gradient(circle_at_left,_rgba(208,223,240,0.55),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,248,255,0.98))]" />
          <div className="absolute -left-16 top-36 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute -right-20 bottom-24 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="relative z-10 p-5 md:p-8 lg:p-10">
            <header className="flex flex-col gap-5 border-b border-slate-200/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <button type="button" onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-[17px] font-extrabold tracking-tight text-slate-900">
                    ProServices
                  </div>
                  <div className="text-xs text-slate-500">{t('Trusted local professionals')}</div>
                </div>
              </button>

              <nav className="psp-control-bar psp-control-bar--compact flex-wrap text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className={getNavButtonClasses(activeNav === 'explore')}
                >
                  {t('Explore')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/explore#categories')}
                  className={getNavButtonClasses(activeNav === 'categories')}
                >
                  {t('Categories')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/join/provider')}
                  className={getNavButtonClasses(activeNav === 'provider')}
                >
                  {t('Become a Provider')}
                </button>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => navigate(dashboardRoute)}
                    className={getNavButtonClasses(false)}
                  >
                    {t('Dashboard')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigateWithAuth(messagesRoute)}
                  className={getNavButtonClasses(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle size={16} />
                    {t('Messages')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateWithAuth(notificationsRoute)}
                  className={getNavButtonClasses(false)}
                  aria-label="Notifications"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell size={16} />
                    {t('Alerts')}
                  </span>
                </button>
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => navigate(dashboardRoute)}
                    className="psp-button psp-button--secondary"
                  >
                    {t('My Dashboard')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(withRedirect('/login', currentPublicPath))}
                    className="psp-button psp-button--primary"
                  >
                    {t('Sign In')}
                  </button>
                )}
              </nav>
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMarketplaceLayout;
