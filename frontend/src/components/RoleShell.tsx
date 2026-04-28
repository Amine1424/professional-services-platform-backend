import React, { useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppRole,
  getDefaultRouteByRole,
  getNavByRole,
  getRoleDisplayName,
  getStoredUser,
} from '../lib/role-routing';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import '../styles/app-shell.css';

type RoleShellLayout = 'default' | 'immersive' | 'standalone' | 'fullbleed';

interface RoleShellProps {
  role: AppRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  layout?: RoleShellLayout;
}

const roleThemes: Record<
  AppRole,
  {
    eyebrow: string;
    mission: string;
    focusTitle: string;
    focusItems: string[];
    quickLinks: Array<{ label: string; to: string }>;
  }
> = {
  customer: {
    eyebrow: 'Discovery mode',
    mission: 'Move quickly from search to trust, then from conversation to request.',
    focusTitle: 'Customer priorities',
    focusItems: ['Explore faster', 'Keep trusted providers close', 'Convert chats into requests'],
    quickLinks: [
      { label: 'Explore', to: '/customer/explore' },
      { label: 'Messages', to: '/customer/messages' },
      { label: 'Requests', to: '/customer/orders' },
    ],
  },
  service_provider: {
    eyebrow: 'Growth operations',
    mission: 'Operate the pipeline, keep response time low, and strengthen trust signals.',
    focusTitle: 'Provider priorities',
    focusItems: ['Answer fast', 'Publish stronger proof of work', 'Convert leads into booked work'],
    quickLinks: [
      { label: 'Requests', to: '/provider/requests' },
      { label: 'Inbox', to: '/provider/messages' },
      { label: 'Portfolio', to: '/provider/portfolio' },
    ],
  },
  reviewer: {
    eyebrow: 'Moderation queue',
    mission: 'Review provider submissions with clarity, consistency, and defensible decisions.',
    focusTitle: 'Reviewer priorities',
    focusItems: ['Clear decisions', 'Low queue time', 'Reliable moderation notes'],
    quickLinks: [
      { label: 'Pending reviews', to: '/reviewer/pending' },
      { label: 'Review Inbox', to: '/reviewer/inbox' },
      { label: 'History', to: '/reviewer/history' },
      { label: 'Public home', to: '/' },
    ],
  },
  admin: {
    eyebrow: 'Operations desk',
    mission:
      'Run moderation, discovery controls, reviewer throughput, and marketplace hygiene like an internal working system.',
    focusTitle: 'Admin priorities',
    focusItems: ['Clear pending queue', 'Watch trust signals', 'Keep discovery clean'],
    quickLinks: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Review Inbox', to: '/admin/review-inbox' },
      { label: 'Providers', to: '/admin/providers' },
      { label: 'Content', to: '/admin/content' },
      { label: 'Reports', to: '/admin/reports' },
    ],
  },
  super_admin: {
    eyebrow: 'Operations desk',
    mission:
      'Run moderation, discovery controls, reviewer throughput, and marketplace hygiene like an internal working system.',
    focusTitle: 'Admin priorities',
    focusItems: ['Clear pending queue', 'Watch trust signals', 'Keep discovery clean'],
    quickLinks: [
      { label: 'Dashboard', to: '/admin/dashboard' },
      { label: 'Review Inbox', to: '/admin/review-inbox' },
      { label: 'Providers', to: '/admin/providers' },
      { label: 'Content', to: '/admin/content' },
      { label: 'Reports', to: '/admin/reports' },
    ],
  },
};

const routeDescriptions: Record<string, string> = {
  '/customer/dashboard':
    'Track activity, saved providers, requests, and the next actions in one place.',
  '/customer/explore':
    'Search providers by category, location, quality signals, and featured ranking.',
  '/customer/messages':
    'Continue conversations, review unread threads, and move from chat to request.',
  '/customer/orders':
    'Follow every request from first contact to quote, acceptance, and closure.',
  '/customer/favorites': 'Quick access to the providers you follow most closely.',
  '/customer/notifications': 'Review messages, request updates, comments, and provider activity.',
  '/customer/reviews': 'Manage ratings and feedback you published on provider profiles.',
  '/customer/subscriptions': 'Control your plan and preference-based account options.',
  '/customer/profile': 'Update account details, interests, location preferences, and password.',
  '/provider/dashboard':
    'See business health, account status, services, and the next operational priorities.',
  '/provider/profile':
    'Manage business identity, category, response speed, and public profile content.',
  '/provider/services':
    'Create, update, publish, and position the services customers can request.',
  '/provider/portfolio':
    'Publish proof of work, moderate comments, and organize media visibility.',
  '/provider/requests':
    'Process leads, send quotes, and convert inbound demand into active work.',
  '/provider/messages':
    'Run the shared inbox and generate faster replies with AI support.',
  '/provider/notifications':
    'Monitor request, message, comment, and favorite-provider activity.',
  '/provider/subscription':
    'Control plan capabilities, homepage featuring, and profile badge visibility.',
  '/provider/settings': 'Update personal info, privacy rules, and account security.',
  '/reviewer/dashboard':
    'Track pending providers, review throughput, and decision quality signals.',
  '/reviewer/pending': 'Open pending provider submissions and move them to a decision.',
  '/reviewer/inbox':
    'Handle review assignments, context exchange, and decisions in one thread view.',
  '/reviewer/history': 'Audit past moderation decisions and reviewer actions.',
  '/reviewer/profile': 'View reviewer identity and moderation workload stats.',
  '/reviewer/providers':
    'Review provider content, moderation history, and public proof before deciding.',
  '/admin/dashboard': 'Monitor platform-wide health, moderation volume, and marketplace growth.',
  '/admin/users': 'Search users, update activation state, and manage role assignments.',
  '/admin/providers': 'Control provider status, verification, and featured visibility.',
  '/admin/categories': 'Maintain taxonomy and service discovery structure.',
  '/admin/review-inbox':
    'Send cases to reviewers, discuss profiles, and receive decisions in-thread.',
  '/admin/regions': 'Manage geographic coverage used by search and provider profiles.',
  '/admin/reports': 'Inspect marketplace reporting and exportable operational metrics.',
  '/admin/content': 'Moderate public content and remove problematic comments.',
  '/admin/reviewers': 'Manage reviewer access and staffing coverage.',
  '/admin/settings': 'Control platform-level settings and operational toggles.',
};

const normalizePath = (path: string) => {
  if (!path) return '/';
  return path.replace(/\/+$/, '') || '/';
};

const isRouteMatch = (pathname: string, itemPath: string) => {
  const current = normalizePath(pathname);
  const target = normalizePath(itemPath);

  if (target.includes('/:')) {
    const staticBase = normalizePath(target.split('/:')[0] || '/');
    return current === staticBase || current.startsWith(`${staticBase}/`);
  }

  return current === target || current.startsWith(`${target}/`);
};

export const RoleShell: React.FC<RoleShellProps> = ({
  role,
  title,
  subtitle,
  children,
  layout = 'default',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { locale, t } = useI18n();
  const user = getStoredUser();
  const items = getNavByRole(role);
  const theme = roleThemes[role];
  const roleClassName = role.replace('_', '-');
  const isImmersive = layout === 'immersive';
  const isStandalone = layout === 'standalone';
  const isFullbleed = layout === 'fullbleed';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  const activeItem = useMemo(
    () => items.find((item) => isRouteMatch(location.pathname, item.path)) || null,
    [items, location.pathname]
  );

  const headingTitle = activeItem?.label || title || getRoleDisplayName(role);

  const routeDescriptionKey = activeItem
    ? normalizePath(activeItem.path.includes('/:') ? activeItem.path.split('/:')[0] : activeItem.path)
    : '';

  const headingSubtitle =
    routeDescriptions[routeDescriptionKey] || subtitle || getRoleDisplayName(role);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date()),
    [locale]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className={`psp-app-shell psp-app-shell--${roleClassName} ${
        isStandalone ? 'psp-app-shell--standalone' : ''
      } ${
        isFullbleed ? 'psp-app-shell--fullbleed' : ''
      }`}
    >
      <div className="psp-app-shell__layout">
        {!isStandalone && !isFullbleed ? (
          <aside className="psp-app-shell__sidebar">
            <div className="psp-app-shell__brand">
              <div className="psp-app-shell__brand-mark">PS</div>
              <div className="psp-app-shell__brand-copy">
                <strong>ProServices</strong>
                <span>{t(getRoleDisplayName(role))}</span>
              </div>
            </div>

            <div className="psp-app-shell__user">
              <div className="psp-app-shell__user-label">{t('Signed In')}</div>
              <strong>
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account'}
              </strong>
              <span>{user?.email || t(getRoleDisplayName(role))}</span>
              <div className="psp-app-shell__user-meta">
                <span className="psp-app-shell__role-chip">{t(theme.eyebrow)}</span>
                <span className="psp-app-shell__date-chip">{todayLabel}</span>
              </div>
            </div>

            <nav className="psp-app-shell__nav">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `psp-app-shell__nav-link ${
                      isActive || isRouteMatch(location.pathname, item.path)
                        ? 'psp-app-shell__nav-link--active'
                        : ''
                    }`
                  }
                >
                  <span>{t(item.label)}</span>
                  <span>{'>'}</span>
                </NavLink>
              ))}
            </nav>

            <div className="psp-app-shell__spotlight">
              <div className="psp-app-shell__spotlight-title">{t(theme.focusTitle)}</div>
              <p className="psp-app-shell__spotlight-copy">{t(theme.mission)}</p>
              <div className="psp-app-shell__spotlight-list">
                {theme.focusItems.map((item) => (
                  <div key={item} className="psp-app-shell__spotlight-item">
                    {t(item)}
                  </div>
                ))}
              </div>
            </div>

            <div className="psp-app-shell__sidebar-footer">
              <button
                type="button"
                onClick={() => navigate(getDefaultRouteByRole(role))}
                className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--ghost"
              >
                {t('Go To Overview')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--ghost"
              >
                {t('Open Marketplace')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--danger"
              >
                {t('Sign Out')}
              </button>
            </div>
          </aside>
        ) : null}

        <main className="psp-app-shell__main">
          {!isImmersive && !isStandalone && !isFullbleed ? (
            <div className="psp-app-shell__topbar">
              <div className="psp-app-shell__heading-card">
                <div className="psp-app-shell__eyebrow">{t(getRoleDisplayName(role))}</div>
                <div className="psp-app-shell__heading-meta">
                  <span className="psp-app-shell__heading-pill">{t(theme.eyebrow)}</span>
                  <span className="psp-app-shell__heading-pill">{todayLabel}</span>
                  {activeItem ? (
                    <span className="psp-app-shell__heading-pill">{t(activeItem.label)}</span>
                  ) : null}
                </div>
                <h1>{t(headingTitle)}</h1>
                <p>{t(headingSubtitle)}</p>
              </div>

              <div className="psp-app-shell__quick-links">
                {theme.quickLinks.map((item) => (
                  <NavLink key={item.to} className="psp-app-shell__quick-link" to={item.to}>
                    {t(item.label)}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}

          <div
            className="psp-app-shell__content"
            style={isImmersive || isFullbleed ? { paddingTop: 0 } : undefined}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleShell;
