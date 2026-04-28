import React, { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  Loader2,
  LockKeyhole,
  Search,
  Shield,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PublicAuthScene from '../components/public-entry/PublicAuthScene';
import { useAuth } from '../hooks/useAuth';
import {
  describeRedirectIntent,
  getSafeRedirectTarget,
  withRedirect,
} from '../lib/auth-redirect';
import { useI18n } from '../i18n';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
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

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = t('Email is required.');
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      nextErrors.email = t('Please enter a valid email.');
    }

    if (!password.trim()) {
      nextErrors.password = t('Password is required.');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const result = await login({
        email: email.trim(),
        password,
      });

      if (!rememberMe) {
        sessionStorage.setItem('psp_session_only', 'true');
      }

      toast.success(t('Logged in successfully.'));
      navigate(redirectTarget || getDefaultRouteByRole(result.data?.user.role), {
        replace: true,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || t('Login failed.');
      setErrors({ form: message });
      toast.error(message);
    }
  };

  return (
    <PublicAuthScene accent="blue">
      <main className="psp-desktop-frame flex min-h-[calc(100vh-57px)] items-center py-12">
        <div className="grid w-full gap-8 xl:grid-cols-[0.96fr_0.78fr] xl:gap-14">
          <div className="space-y-6 xl:pr-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                <Sparkles className="h-3 w-3" />
                {intentNote ? t('Saved intent') : t('Your progress is saved')}
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {t('Welcome back')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                {intentNote ||
                  t(
                    'Sign in to continue where you left off. Your searches, conversations, and requests are waiting.'
                  )}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Search className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{t('Customer account')}</div>
                <div className="mt-2 text-sm leading-7 text-slate-500">
                  {t('Search, shortlist, message providers, and create requests.')}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{t('Provider account')}</div>
                <div className="mt-2 text-sm leading-7 text-slate-500">
                  {t('Publish services, manage requests, and use AI-assisted communication.')}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Shield className="h-4 w-4 text-teal-600" />
                <span>{t('Why sign in now')}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {t('Reopen saved providers and active conversations without losing context.')}
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {t('Return to the same search and request flow you were already following.')}
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {t('Keep your marketplace activity secure with one account across all surfaces.')}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full xl:max-w-[680px] xl:justify-self-end">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-lg backdrop-blur-sm sm:p-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-900">
                        {t('Email')}
                      </label>
                      <input
                        type="email"
                        placeholder={t('you@example.com')}
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setErrors((current) => ({ ...current, email: '', form: '' }));
                        }}
                        aria-invalid={Boolean(errors.email)}
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      {errors.email ? (
                        <div className="mt-1 text-xs text-red-600">{errors.email}</div>
                      ) : null}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-slate-900">
                          {t('Password')}
                        </label>
                        <a
                          href="mailto:support@proservices.dz?subject=Password%20help"
                          className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                        >
                          {t('Forgot password?')}
                        </a>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('Enter your password')}
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            setErrors((current) => ({ ...current, password: '', form: '' }));
                          }}
                          aria-invalid={Boolean(errors.password)}
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                          aria-label={showPassword ? t('Hide password') : t('Show password')}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <div className="mt-1 text-xs text-red-600">{errors.password}</div>
                      ) : null}
                    </div>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                      />
                      <span className="text-sm text-slate-500">
                        {t('Remember me on this device')}
                      </span>
                    </label>
                  </div>

                  {errors.form ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {errors.form}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('Signing in...')}
                      </>
                    ) : (
                      t('Sign In')
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Shield className="h-3.5 w-3.5 text-teal-600" />
                  <span>{t('Secure, encrypted connection')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-center text-sm text-slate-500">{t("Don't have an account?")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={withRedirect('/join/customer', redirectTarget)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-900 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
                  >
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    <span>{t('Create customer account')}</span>
                  </Link>
                  <Link
                    to={withRedirect('/join/provider', redirectTarget)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-900 transition-all hover:border-teal-200 hover:bg-white hover:shadow-sm"
                  >
                    <BriefcaseBusiness className="h-4 w-4 text-teal-600" />
                    <span>{t('Join as service provider')}</span>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <LockKeyhole className="h-3.5 w-3.5" />
                <span>{t('Need help signing in? Contact support.')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicAuthScene>
  );
};

export default Login;
