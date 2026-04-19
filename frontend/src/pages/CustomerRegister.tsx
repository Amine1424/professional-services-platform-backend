import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, MessageCircle, Search, ShieldCheck } from 'lucide-react';
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;

    setFormData((current) => ({
      ...current,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }));

    setErrors((current) => ({
      ...current,
      [target.name]: '',
    }));
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

  return (
    <AuthShell
      badge={t('Customer onboarding')}
      title={t('Create a customer account that is ready to act')}
      subtitle={t(
        'The goal is not just account creation. It is getting the user into discovery, messaging, and requests with minimal friction.'
      )}
      asideTitle={t('Customers should convert from search to request without setup fatigue')}
      asideDescription={t(
        'This signup stays short but still captures the essentials needed for smoother provider follow-up and account continuity.'
      )}
      intentNote={describeRedirectIntent(redirectTarget)}
      highlights={[
        {
          icon: Search,
          title: t('Explore faster'),
          value: t('Discovery'),
          description: t(
            'Search providers, compare trust signals, and keep the shortlist moving.'
          ),
        },
        {
          icon: MessageCircle,
          title: t('Message directly'),
          value: t('Chat ready'),
          description: t('Open provider conversations immediately after signup.'),
        },
        {
          icon: Heart,
          title: t('Save the shortlist'),
          value: t('Favorites'),
          description: t(
            'Keep providers worth returning to without restarting the search.'
          ),
        },
      ]}
      footer={
        <div className="auth-footer-grid">
          <div>
            {t('Already have an account?')}{' '}
            <Link to={withRedirect('/login', redirectTarget)}>{t('Sign in')}</Link>
          </div>
          <div>
            {t('Running a business?')}{' '}
            <Link to={withRedirect('/join/provider', redirectTarget)}>
              {t('Join as provider')}
            </Link>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form-grid">
        <div className="auth-form-grid auth-form-grid--two">
          <div className="auth-field">
            <label>{t('First name')}</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
            />
            {errors.firstName ? <div className="auth-error">{errors.firstName}</div> : null}
          </div>

          <div className="auth-field">
            <label>{t('Last name')}</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
            />
            {errors.lastName ? <div className="auth-error">{errors.lastName}</div> : null}
          </div>
        </div>

        <div className="auth-form-grid auth-form-grid--two">
          <div className="auth-field">
            <label>{t('Email address')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
            />
            {errors.email ? <div className="auth-error">{errors.email}</div> : null}
          </div>

          <div className="auth-field">
            <label>{t('Phone number')}</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
              placeholder="0555555555"
            />
            <div className="auth-field__hint">
              {t(
                'Optional now, but useful when providers need a faster follow-up channel.'
              )}
            </div>
          </div>
        </div>

        <div className="auth-form-grid auth-form-grid--two">
          <div className="auth-field">
            <label>{t('Password')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
              placeholder={t('StrongPass1!')}
            />
            {errors.password ? <div className="auth-error">{errors.password}</div> : null}
          </div>

          <div className="auth-field">
            <label>{t('Confirm password')}</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
              placeholder={t('StrongPass1!')}
            />
            {errors.confirmPassword ? <div className="auth-error">{errors.confirmPassword}</div> : null}
          </div>
        </div>

        <div className="auth-inline-note">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <MapPin size={15} />
            {t('What happens next')}
          </div>
          <div className="mt-2 text-sm">
            {t(
              'After signup, the customer account goes directly into the dashboard or returns to the saved action if this signup started from a provider page.'
            )}
          </div>
        </div>

        <label className="auth-checkbox">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <span className="auth-checkbox__text">
            <strong>{t('Terms and privacy')}</strong>
            {t(
              'I agree to the marketplace terms, privacy rules, and communication policies.'
            )}
            {errors.acceptTerms ? <span className="auth-error">{errors.acceptTerms}</span> : null}
          </span>
        </label>

        <button type="submit" className="psp-button psp-button--primary w-full" disabled={isLoading}>
          {isLoading ? t('Creating account...') : t('Create customer account')}
        </button>

        <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Search size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Search and compare')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t('Browse public providers first, then take action only when needed.')}
            </div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Protected continuity')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t(
                'Redirect-aware authentication avoids losing the request or message the customer started.'
              )}
            </div>
          </div>
        </div>
      </form>
    </AuthShell>
  );
};

export default CustomerRegister;
