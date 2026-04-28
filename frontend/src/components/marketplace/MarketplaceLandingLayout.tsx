import React, { useMemo, useState } from 'react';
import { Menu, Sparkles, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { withRedirect } from '../../lib/auth-redirect';
import { getDefaultRouteByRole, getStoredUser } from '../../lib/role-routing';
import { useI18n } from '../../i18n';

interface MarketplaceLandingLayoutProps {
  children: React.ReactNode;
}

const MarketplaceLandingLayout: React.FC<MarketplaceLandingLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useMemo(() => getStoredUser(), []);
  const token = localStorage.getItem('accessToken');
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const isSignedIn = Boolean(token && currentUser);
  const dashboardRoute = getDefaultRouteByRole(currentUser?.role);

  const navLinks = [
    {
      label: t('Explore'),
      action: () => navigate('/explore'),
    },
    {
      label: t('Categories'),
      action: () => {
        if (location.pathname === '/') {
          document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        navigate('/#categories');
      },
    },
    {
      label: t('For Providers'),
      action: () => navigate('/join/provider'),
    },
  ];

  const authButtons = isSignedIn
    ? [
        {
          label: t('Explore'),
          variant: 'ghost' as const,
          action: () => navigate('/explore'),
        },
        {
          label: t('Dashboard'),
          variant: 'primary' as const,
          action: () => navigate(dashboardRoute),
        },
      ]
    : [
        {
          label: t('Sign In'),
          variant: 'ghost' as const,
          action: () => navigate(withRedirect('/login', currentPath)),
        },
        {
          label: t('Get Started'),
          variant: 'primary' as const,
          action: () => navigate('/join/provider'),
        },
      ];

  const footerGroups = [
    {
      title: t('For Customers'),
      links: [
        { label: t('Find Providers'), action: () => navigate('/explore') },
        {
          label: t('Messages'),
          action: () =>
            navigate(
              isSignedIn ? '/customer/messages' : withRedirect('/login', '/customer/messages')
            ),
        },
        {
          label: t('Requests'),
          action: () =>
            navigate(
              isSignedIn ? '/customer/orders' : withRedirect('/login', '/customer/orders')
            ),
        },
      ],
    },
    {
      title: t('For Providers'),
      links: [
        { label: t('Join as Provider'), action: () => navigate('/join/provider') },
        {
          label: t('Portfolio'),
          action: () =>
            navigate(
              isSignedIn ? '/provider/portfolio' : withRedirect('/login', '/provider/portfolio')
            ),
        },
        {
          label: t('Inbox'),
          action: () =>
            navigate(
              isSignedIn ? '/provider/messages' : withRedirect('/login', '/provider/messages')
            ),
        },
      ],
    },
    {
      title: t('Company'),
      links: [
        { label: t('Marketplace'), action: () => navigate('/') },
        { label: t('Explore'), action: () => navigate('/explore') },
        { label: t('Sign In'), action: () => navigate(withRedirect('/login', currentPath)) },
      ],
    },
    {
      title: t('Trust & Discovery'),
      links: [
        { label: t('Categories'), action: () => navigate('/#categories') },
        { label: t('Public profiles'), action: () => navigate('/explore') },
        { label: t('Stories'), action: () => navigate('/explore') },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-950">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-950">Marketplace</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.action}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {authButtons.map((button) => (
              <button
                key={button.label}
                type="button"
                onClick={button.action}
                className={
                  button.variant === 'primary'
                    ? 'inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800'
                    : 'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'
                }
              >
                {button.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('Close menu') : t('Open menu')}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div
          className={`overflow-hidden border-t border-slate-200 transition-all duration-200 ease-in-out md:hidden ${
            mobileMenuOpen ? 'max-h-80' : 'max-h-0 border-t-0'
          }`}
        >
          <div className="space-y-1 px-4 pb-4 pt-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  link.action();
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {authButtons.map((button) => (
                <button
                  key={button.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    button.action();
                  }}
                  className={
                    button.variant === 'primary'
                      ? 'inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800'
                      : 'inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                  }
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={link.action}
                        className="text-left text-sm text-slate-500 transition hover:text-slate-900"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Marketplace. {t('All rights reserved.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceLandingLayout;
