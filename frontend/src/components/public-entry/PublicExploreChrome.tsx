import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { withRedirect } from '../../lib/auth-redirect';
import { getDefaultRouteByRole, getStoredUser } from '../../lib/role-routing';
import '../../styles/app-primitives.css';

interface PublicExploreChromeProps {
  children: React.ReactNode;
}

const PublicExploreChrome: React.FC<PublicExploreChromeProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);
  const token = localStorage.getItem('accessToken');
  const currentPublicPath = `${location.pathname}${location.search}${location.hash}`;

  const isSignedIn = Boolean(token && currentUser);
  const dashboardRoute = getDefaultRouteByRole(currentUser?.role);

  const navLinks = [
    { to: '/explore', label: t('Explore') },
    { to: '/#categories', label: t('Categories') },
    { to: '/join/provider', label: t('Become a Provider') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="psp-desktop-frame flex h-16 items-center justify-between">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">ProServices</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isSignedIn ? (
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all hover:border-blue-200 hover:text-slate-900"
                onClick={() => navigate(dashboardRoute)}
              >
                {t('My Dashboard')}
              </button>
            ) : (
              <>
                <Link
                  to={withRedirect('/login', currentPublicPath)}
                  className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                >
                  {t('Sign In')}
                </Link>
                <Link
                  to={withRedirect('/join/customer', currentPublicPath)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {t('Get Started')}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('Close menu') : t('Open menu')}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out md:hidden ${
            mobileMenuOpen ? 'max-h-80' : 'max-h-0'
          }`}
        >
          <div className="space-y-1 border-t border-slate-200 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(link.to);
                }}
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {isSignedIn ? (
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(dashboardRoute);
                  }}
                >
                  {t('My Dashboard')}
                </button>
              ) : (
                <>
                  <Link
                    to={withRedirect('/login', currentPublicPath)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('Sign In')}
                  </Link>
                  <Link
                    to={withRedirect('/join/customer', currentPublicPath)}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('Get Started')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-100/60">
        <div className="psp-desktop-frame py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('For Customers')}</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/explore" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Find Providers')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/join/customer"
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    {t('Create customer account')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Sign In')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('For Providers')}</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/join/provider" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Join as service provider')}
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Explore')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Sign In')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('Marketplace')}</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Home')}
                  </Link>
                </li>
                <li>
                  <Link to="/explore" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Browse marketplace')}
                  </Link>
                </li>
                <li>
                  <Link to="/join/provider" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Become a Provider')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('Account')}</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Sign In')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/join/customer"
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    {t('Create customer account')}
                  </Link>
                </li>
                <li>
                  <Link to="/join/provider" className="text-sm text-slate-500 hover:text-slate-900">
                    {t('Join as service provider')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} ProServices. {t('All rights reserved.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicExploreChrome;
