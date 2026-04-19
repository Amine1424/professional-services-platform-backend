import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, LockKeyhole, MessageCircle, Search, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../hooks/useAuth';
import {
  describeRedirectIntent,
  getSafeRedirectTarget,
  withRedirect,
} from '../lib/auth-redirect';
import { useI18n } from '../i18n';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';
import '../styles/auth.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = useMemo(
    () => getSafeRedirectTarget(location.search, location.state),
    [location.search, location.state]
  );

  const intentNote = useMemo(
    () => describeRedirectIntent(redirectTarget),
    [redirectTarget]
  );

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem('accessToken');

    if (token && user) {
      navigate(redirectTarget || getDefaultRouteByRole(user.role), { replace: true });
    }
  }, [navigate, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error(t('Please enter your email and password.'));
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      toast.success(t('Logged in successfully.'));
      navigate(redirectTarget || getDefaultRouteByRole(result.data?.user.role), {
        replace: true,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Login failed.'));
    }
  };

  return (
    <AuthShell
      badge={t('Access your workspace')}
      title={t('Sign in and continue from the exact point you stopped')}
      subtitle={t(
        'Messages, requests, provider actions, and public intent are preserved when a redirect target exists.'
      )}
      asideTitle={t('A production marketplace needs zero-friction authentication')}
      asideDescription={t(
        'Authentication should not break discovery or conversion. This flow keeps the user inside the same journey instead of forcing a fresh start.'
      )}
      intentNote={intentNote}
      highlights={[
        {
          icon: Search,
          title: t('Discovery-safe'),
          value: t('Public-first'),
          description: t(
            'Guests can browse first, then authenticate only when an action needs it.'
          ),
        },
        {
          icon: MessageCircle,
          title: t('Intent preserved'),
          value: redirectTarget ? t('Yes') : t('Default'),
          description: t(
            'Protected actions send the user back to the correct page after sign in.'
          ),
        },
        {
          icon: ShieldCheck,
          title: t('Role aware'),
          value: t('Customer / Provider'),
          description: t(
            'Successful sign in lands the user in the correct workspace automatically.'
          ),
        },
      ]}
      footer={
        <div className="auth-footer-grid">
          <div>
            {t('Need a customer account?')}{' '}
            <Link to={withRedirect('/join/customer', redirectTarget)}>
              {t('Create customer account')}
            </Link>
          </div>
          <div>
            {t('Running a business?')}{' '}
            <Link to={withRedirect('/join/provider', redirectTarget)}>
              {t('Join as service provider')}
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form-grid">
        <div className="auth-field">
          <label>{t('Email')}</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('you@example.com')}
            disabled={isLoading}
            className="psp-input"
          />
        </div>

        <div className="auth-field">
          <label>{t('Password')}</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('StrongPass1!')}
            disabled={isLoading}
            className="psp-input"
          />
        </div>

        <div className="auth-inline-note">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <LockKeyhole size={15} />
            {t('Authentication note')}
          </div>
          <div className="mt-2 text-sm">
            {t(
              'Provider and customer accounts use the same secure entry point, then split into role-specific workspaces after authentication.'
            )}
          </div>
        </div>

        <button type="submit" className="psp-button psp-button--primary w-full" disabled={isLoading}>
          {isLoading ? t('Signing in...') : t('Sign In')}
        </button>

        <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-2">
          <Link to={withRedirect('/join/customer', redirectTarget)} className="rounded-[20px] border border-slate-200 bg-white p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50/50">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Search size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Customer account')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t('Search, shortlist, message providers, and create requests.')}
            </div>
          </Link>
          <Link to={withRedirect('/join/provider', redirectTarget)} className="rounded-[20px] border border-slate-200 bg-white p-4 no-underline transition hover:border-blue-200 hover:bg-blue-50/50">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BriefcaseBusiness size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Provider account')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t('Publish services, manage requests, and use AI-assisted communication.')}
            </div>
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default Login;
