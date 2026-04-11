import React, { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppRole,
  getDefaultRouteByRole,
  getNavByRole,
  getRoleDisplayName,
  getStoredUser,
} from '../lib/role-routing';
import { useAuth } from '../hooks/useAuth';
import '../styles/app-shell.css';

interface RoleShellProps {
  role: AppRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const routeDescriptions: Record<string, string> = {
  '/customer/dashboard': 'Track activity, saved providers, requests, and the next actions in one place.',
  '/customer/explore': 'Search providers by category, location, quality signals, and featured ranking.',
  '/customer/messages': 'Continue conversations, review unread threads, and move from chat to request.',
  '/customer/orders': 'Follow every request from first contact to quote, acceptance, and closure.',
  '/customer/favorites': 'Quick access to the providers you follow most closely.',
  '/customer/notifications': 'Review messages, request updates, comments, and provider activity.',
  '/customer/reviews': 'Manage ratings and feedback you published on provider profiles.',
  '/customer/subscriptions': 'Control your plan and preference-based account options.',
  '/customer/profile': 'Update account details, interests, location preferences, and password.',
  '/provider/dashboard': 'See business health, account status, services, and the next operational priorities.',
  '/provider/profile': 'Manage business identity, category, response speed, and public profile content.',
  '/provider/services': 'Create, update, publish, and position the services customers can request.',
  '/provider/portfolio': 'Publish proof of work, moderate comments, and organize media visibility.',
  '/provider/requests': 'Process leads, send quotes, and convert inbound demand into active work.',
  '/provider/messages': 'Run the shared inbox and generate faster replies with AI support.',
  '/provider/notifications': 'Monitor request, message, comment, and favorite-provider activity.',
  '/provider/subscription': 'Control plan capabilities, homepage featuring, and profile badge visibility.',
  '/provider/settings': 'Update personal info, privacy rules, and account security.',
  '/reviewer/dashboard': 'Track pending providers, review throughput, and decision quality signals.',
  '/reviewer/pending': 'Open pending provider submissions and move them to a decision.',
  '/reviewer/history': 'Audit past moderation decisions and reviewer actions.',
  '/reviewer/profile': 'View reviewer identity and moderation workload stats.',
  '/admin/dashboard': 'Monitor platform-wide health, moderation volume, and marketplace growth.',
  '/admin/users': 'Search users, update activation state, and manage role assignments.',
  '/admin/providers': 'Control provider status, verification, and featured visibility.',
  '/admin/categories': 'Maintain taxonomy and service discovery structure.',
  '/admin/regions': 'Manage geographic coverage used by search and provider profiles.',
  '/admin/reports': 'Inspect marketplace reporting and exportable operational metrics.',
  '/admin/content': 'Moderate public content and remove problematic comments.',
  '/admin/reviewers': 'Manage reviewer access and staffing coverage.',
  '/admin/settings': 'Control platform-level settings and operational toggles.',
};

export const RoleShell: React.FC<RoleShellProps> = ({ role, title, subtitle, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = getStoredUser();
  const items = getNavByRole(role);

  const activeItem = useMemo(
    () =>
      items.find(
        (item) =>
          location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
      ) || null,
    [items, location.pathname]
  );

  const headingTitle = activeItem?.label || title || getRoleDisplayName(role);
  const headingSubtitle =
    routeDescriptions[activeItem?.path || ''] || subtitle || getRoleDisplayName(role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="psp-app-shell">
      <div className="psp-app-shell__layout">
        <aside className="psp-app-shell__sidebar">
          <div className="psp-app-shell__brand">
            <div className="psp-app-shell__brand-mark">PS</div>
            <div className="psp-app-shell__brand-copy">
              <strong>ProServices</strong>
              <span>{getRoleDisplayName(role)}</span>
            </div>
          </div>

          <div className="psp-app-shell__user">
            <div className="psp-app-shell__user-label">Signed In</div>
            <strong>{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account'}</strong>
            <span>{user?.email || getRoleDisplayName(role)}</span>
          </div>

          <nav className="psp-app-shell__nav">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `psp-app-shell__nav-link ${
                    isActive ? 'psp-app-shell__nav-link--active' : ''
                  }`
                }
              >
                <span>{item.label}</span>
                <span>›</span>
              </NavLink>
            ))}
          </nav>

          <div className="psp-app-shell__sidebar-footer">
            <button
              type="button"
              onClick={() => navigate(getDefaultRouteByRole(role))}
              className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--ghost"
            >
              Go To Overview
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--ghost"
            >
              Open Marketplace
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="psp-app-shell__sidebar-button psp-app-shell__sidebar-button--danger"
            >
              Sign Out
            </button>
          </div>
        </aside>

        <main className="psp-app-shell__main">
          <div className="psp-app-shell__topbar">
            <div className="psp-app-shell__heading-card">
              <div className="psp-app-shell__eyebrow">{getRoleDisplayName(role)}</div>
              <h1>{headingTitle}</h1>
              <p>{headingSubtitle}</p>
            </div>

            <div className="psp-app-shell__quick-links">
              {role === 'customer' ? (
                <>
                  <NavLink className="psp-app-shell__quick-link" to="/customer/messages">
                    Messages
                  </NavLink>
                  <NavLink className="psp-app-shell__quick-link" to="/customer/notifications">
                    Notifications
                  </NavLink>
                </>
              ) : null}

              {role === 'service_provider' ? (
                <>
                  <NavLink className="psp-app-shell__quick-link" to="/provider/requests">
                    Requests
                  </NavLink>
                  <NavLink className="psp-app-shell__quick-link" to="/provider/messages">
                    Inbox
                  </NavLink>
                </>
              ) : null}

              {(role === 'reviewer' || role === 'admin' || role === 'super_admin') ? (
                <NavLink className="psp-app-shell__quick-link" to="/">
                  Public Home
                </NavLink>
              ) : null}
            </div>
          </div>

          <div className="psp-app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default RoleShell;
