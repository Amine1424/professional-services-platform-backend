import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Heart, Loader2, MessageCircle, Search } from 'lucide-react';
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

type CustomerFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading } = useAuth();
  const { t } = useI18n();

  const [formData, setFormData] = useState<CustomerFormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const redirectTarget = useMemo(
    () => getSafeRedirectTarget(location.search, location.state),
    [location.search, location.state]
  );

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem('accessToken');

    if (token && user) {
      navigate(redirectTarget || getDefaultRouteByRole(user.role), { replace: true });
    }
  }, [navigate, redirectTarget]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = t('First name is required.');
    if (!formData.lastName.trim()) nextErrors.lastName = t('Last name is required.');
    if (!formData.email.trim()) nextErrors.email = t('Email is required.');
    if (!formData.password) {
      nextErrors.password = t('Password is required.');
    } else if (!strongPasswordRegex.test(formData.password)) {
      nextErrors.password =
        t('Use at least 8 characters with uppercase, lowercase, number, and special character.');
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = t('Please confirm your password.');
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = t('Passwords do not match.');
    }

    if (!formData.acceptTerms) {
      nextErrors.acceptTerms = t('You must accept the terms.');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'customer',
        acceptTerms: formData.acceptTerms,
      });

      toast.success(t('Customer account created successfully.'));
      navigate(redirectTarget || '/customer/dashboard', { replace: true });
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors[0]?.msg) {
        toast.error(apiErrors[0].msg);
        return;
      }

      toast.error(error.response?.data?.message || t('Failed to create customer account.'));
    }
  };

  const updateField = (name: keyof CustomerFormState, value: string | boolean) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  return (
    <PublicAuthScene accent="blue">
      <main className="psp-desktop-frame flex min-h-[calc(100vh-57px)] items-center py-8">
        <div className="grid w-full gap-8 xl:grid-cols-[0.96fr_0.8fr] xl:gap-14">
          <div className="space-y-6 xl:pr-8">
            <div className="space-y-3">
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {t('Find the right professional, fast')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                {describeRedirectIntent(redirectTarget) ||
                  t('Create your free account to get started')}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('After you sign up')}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Search className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Heart className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm leading-7 text-slate-500">
                  {t('Browse providers, save favorites, and send messages')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Search className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{t('Explore')}</div>
                <div className="mt-2 text-sm leading-7 text-slate-500">
                  {t('Search with categories, regions, and provider trust signals.')}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{t('Favorites')}</div>
                <div className="mt-2 text-sm leading-7 text-slate-500">
                  {t('Keep trusted providers close and return quickly when you are ready.')}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900">{t('Requests')}</div>
                <div className="mt-2 text-sm leading-7 text-slate-500">
                  {t('Move from trust and conversation into a real service request.')}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-sm text-slate-500">
                {t('Already have an account?')}{' '}
                <Link
                  to={withRedirect('/login', redirectTarget)}
                  className="font-medium text-slate-900 underline-offset-4 hover:underline"
                >
                  {t('Sign in')}
                </Link>
              </p>

              <div className="h-px w-full bg-slate-200/70" />

              <Link
                to={withRedirect('/join/provider', redirectTarget)}
                className="group flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
              >
                <span>{t('Want to offer services instead?')}</span>
                <span className="flex items-center gap-1 font-medium text-teal-600 group-hover:text-teal-500">
                  {t('Join as provider')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </div>

          <div className="w-full xl:max-w-[700px] xl:justify-self-end">
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-lg backdrop-blur-sm sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      {t('First name')}
                    </label>
                    <input
                      value={formData.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      disabled={isLoading}
                      autoFocus
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.firstName ? (
                      <div className="mt-1 text-xs text-red-600">{errors.firstName}</div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      {t('Last name')}
                    </label>
                    <input
                      value={formData.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      disabled={isLoading}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {errors.lastName ? (
                      <div className="mt-1 text-xs text-red-600">{errors.lastName}</div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {t('Email')}
                  </label>
                  <input
                    type="email"
                    placeholder={t('you@example.com')}
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.email ? (
                    <div className="mt-1 text-xs text-red-600">{errors.email}</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {t('Phone number')}
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    disabled={isLoading}
                    placeholder="0555555555"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    {t('Optional now, but useful when providers need a faster follow-up channel.')}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {t('Create password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('At least 8 characters')}
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.password ? (
                    <div className="mt-1 text-xs text-red-600">{errors.password}</div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {t('Confirm password')}
                  </label>
                  <input
                    type="password"
                    placeholder={t('StrongPass1!')}
                    value={formData.confirmPassword}
                    onChange={(event) => updateField('confirmPassword', event.target.value)}
                    disabled={isLoading}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.confirmPassword ? (
                    <div className="mt-1 text-xs text-red-600">{errors.confirmPassword}</div>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(event) => updateField('acceptTerms', event.target.checked)}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    <span className="cursor-pointer select-none text-sm leading-snug text-slate-500">
                      {t('I agree to the marketplace terms, privacy rules, and communication policies.')}
                    </span>
                  </label>
                  {errors.acceptTerms ? (
                    <div className="text-xs text-red-600">{errors.acceptTerms}</div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('Creating account...')}
                    </>
                  ) : (
                    t('Create customer account')
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </PublicAuthScene>
  );
};

export default CustomerRegister;
