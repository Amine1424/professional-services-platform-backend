import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Bot, BriefcaseBusiness, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthShell from '../components/auth/AuthShell';
import api from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { ALGERIA_WILAYAS, MARKET_REGIONS, ProviderCoverageMode } from '../lib/algeria';
import {
  describeRedirectIntent,
  getSafeRedirectTarget,
  withRedirect,
} from '../lib/auth-redirect';
import { useI18n } from '../i18n';
import { getDefaultRouteByRole, getStoredUser } from '../lib/role-routing';
import '../styles/auth.css';

interface Category {
  id: string;
  name: string;
}

type ProviderFormState = {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  primaryCategoryId: string;
  region: string;
  wilaya: string;
  city: string;
  yearsOfExperience: string;
  description: string;
  serviceCoverageMode: ProviderCoverageMode;
  serviceCoverageRegions: string[];
  acceptTerms: boolean;
};

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

export const ProviderRegister: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading } = useAuth();
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormState>({
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    primaryCategoryId: '',
    region: '',
    wilaya: '',
    city: '',
    yearsOfExperience: '',
    description: '',
    serviceCoverageMode: 'wilaya_only',
    serviceCoverageRegions: [],
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
      navigate(getDefaultRouteByRole(user.role), { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (!active) return;
        setCategories(response.data?.data || []);
        setCategoriesError(null);
      } catch (requestError: any) {
        if (!active) return;
        setCategories([]);
        setCategoriesError(
          requestError.response?.data?.message ||
            t('Failed to load categories for provider onboarding.')
        );
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, [t]);

  const onboardingReadiness = useMemo(() => {
    const checks = [
      Boolean(formData.firstName.trim()),
      Boolean(formData.lastName.trim()),
      Boolean(formData.companyName.trim()),
      Boolean(formData.phone.trim()),
      Boolean(formData.email.trim()),
      Boolean(formData.password),
      Boolean(formData.confirmPassword),
      Boolean(formData.primaryCategoryId),
      Boolean(formData.region),
      Boolean(formData.wilaya),
      Boolean(formData.city.trim()),
      Boolean(formData.yearsOfExperience),
      formData.serviceCoverageMode === 'regional'
        ? formData.serviceCoverageRegions.length > 0
        : true,
      Boolean(formData.description.trim()),
      formData.acceptTerms,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = t('First name is required.');
    if (!formData.lastName.trim()) nextErrors.lastName = t('Last name is required.');
    if (!formData.companyName.trim()) nextErrors.companyName = t('Business name is required.');
    if (!formData.phone.trim()) nextErrors.phone = t('Phone number is required.');
    if (!formData.email.trim()) nextErrors.email = t('Email is required.');
    if (!formData.primaryCategoryId) nextErrors.primaryCategoryId = t('Primary category is required.');
    if (!formData.region) nextErrors.region = t('Region is required.');
    if (!formData.wilaya) nextErrors.wilaya = t('Wilaya is required.');
    if (!formData.city.trim()) nextErrors.city = t('City is required.');
    if (formData.serviceCoverageMode === 'regional' && !formData.serviceCoverageRegions.length) {
      nextErrors.serviceCoverageRegions = t('Select at least one served region.');
    }
    if (!formData.yearsOfExperience) {
      nextErrors.yearsOfExperience = t('Years of experience is required.');
    } else if (Number(formData.yearsOfExperience) < 0) {
      nextErrors.yearsOfExperience = t('Years of experience must be zero or more.');
    }

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

  const toggleCoverageRegion = (region: string) => {
    setFormData((current) => {
      const hasRegion = current.serviceCoverageRegions.includes(region);
      return {
        ...current,
        serviceCoverageRegions: hasRegion
          ? current.serviceCoverageRegions.filter((item) => item !== region)
          : [...current.serviceCoverageRegions, region],
      };
    });

    setErrors((current) => ({
      ...current,
      serviceCoverageRegions: '',
    }));
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;

    setFormData((current) => ({
      ...current,
      [target.name]: target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value,
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
        companyName: formData.companyName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: 'service_provider',
        acceptTerms: formData.acceptTerms,
        primaryCategoryId: formData.primaryCategoryId,
        region: formData.region,
        wilaya: formData.wilaya,
        city: formData.city.trim(),
        yearsOfExperience: Number(formData.yearsOfExperience),
        description: formData.description.trim() || undefined,
        serviceCoverageMode: formData.serviceCoverageMode,
        serviceCoverageRegions:
          formData.serviceCoverageMode === 'regional' ? formData.serviceCoverageRegions : [],
      });

      toast.success(t('Provider account created successfully.'));
      navigate('/provider/profile?welcome=1', { replace: true });
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors[0]?.msg) {
        toast.error(apiErrors[0].msg);
        return;
      }

      toast.error(error.response?.data?.message || t('Failed to create provider account.'));
    }
  };

  return (
    <AuthShell
      badge={t('Provider onboarding')}
      title={t('Join as a service provider with enough context to look real on day one')}
      subtitle={t(
        'Provider signup should not create empty profiles. This flow captures the minimum viable business identity required for a credible marketplace launch.'
      )}
      asideTitle={t(
        'A provider account should start with real business context, not blank placeholders'
      )}
      asideDescription={t(
        'The platform becomes more unique when providers are locally grounded from the first minute: category, wilaya, city, experience, and business summary.'
      )}
      intentNote={describeRedirectIntent(redirectTarget)}
      highlights={[
        {
          icon: BadgeCheck,
          title: t('Moderation ready'),
          value: `${onboardingReadiness}%`,
          description: t(
            'Higher onboarding completeness makes review and approval more meaningful immediately.'
          ),
        },
        {
          icon: BriefcaseBusiness,
          title: t('Discovery placement'),
          value: formData.primaryCategoryId ? t('Categorized') : t('Pending'),
          description: t(
            'Category and location help the marketplace rank the provider more intelligently.'
          ),
        },
        {
          icon: Bot,
          title: t('Inbox growth path'),
          value: t('AI assisted'),
          description: t(
            'The provider account is prepared for the AI-assisted messaging workflow after signup.'
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
            {t('Looking for services instead?')}{' '}
            <Link to={withRedirect('/join/customer', redirectTarget)}>
              {t('Create customer account')}
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
            <label>{t('Business name')}</label>
            <input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
              placeholder={t('Amine Services')}
            />
            {errors.companyName ? <div className="auth-error">{errors.companyName}</div> : null}
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
            {errors.phone ? <div className="auth-error">{errors.phone}</div> : null}
          </div>
        </div>

        <div className="auth-field">
          <label>{t('Professional email')}</label>
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

        <div className="auth-form-grid auth-form-grid--two">
          <div className="auth-field">
            <label>{t('Primary category')}</label>
            <select
              name="primaryCategoryId"
              value={formData.primaryCategoryId}
              onChange={handleChange}
              disabled={isLoading || categoriesLoading}
              className="psp-select"
            >
              <option value="">{t('Select category')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesError ? <div className="auth-error">{categoriesError}</div> : null}
            {errors.primaryCategoryId ? <div className="auth-error">{errors.primaryCategoryId}</div> : null}
          </div>

          <div className="auth-field">
            <label>{t('Years of experience')}</label>
            <input
              type="number"
              min="0"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-input"
            />
            {errors.yearsOfExperience ? <div className="auth-error">{errors.yearsOfExperience}</div> : null}
          </div>
        </div>

        <div className="auth-form-grid auth-form-grid--two">
          <div className="auth-field">
            <label>{t('Marketplace region')}</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-select"
            >
              <option value="">{t('Select region')}</option>
              {MARKET_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {errors.region ? <div className="auth-error">{errors.region}</div> : null}
          </div>

          <div className="auth-field">
            <label>{t('Wilaya')}</label>
            <select
              name="wilaya"
              value={formData.wilaya}
              onChange={handleChange}
              disabled={isLoading}
              className="psp-select"
            >
              <option value="">{t('Select wilaya')}</option>
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya} value={wilaya}>
                  {wilaya}
                </option>
              ))}
            </select>
            {errors.wilaya ? <div className="auth-error">{errors.wilaya}</div> : null}
          </div>
        </div>

        <div className="auth-field">
          <label>{t('City')}</label>
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={isLoading}
            className="psp-input"
            placeholder={t('Bab Ezzouar, Oran Centre, Constantine...')}
          />
          {errors.city ? <div className="auth-error">{errors.city}</div> : null}
        </div>

        <div className="auth-field">
          <label>{t('Service coverage')}</label>
          <select
            name="serviceCoverageMode"
            value={formData.serviceCoverageMode}
            onChange={handleChange}
            disabled={isLoading}
            className="psp-select"
          >
            <option value="wilaya_only">{t('Serve only my wilaya')}</option>
            <option value="regional">{t('Serve selected Algerian regions')}</option>
            <option value="nationwide">{t('Serve all Algeria')}</option>
          </select>
          <div className="auth-field__hint">
            {t(
              'This controls where the provider can appear in discovery and what travel expectation the customer sees.'
            )}
          </div>
        </div>

        {formData.serviceCoverageMode === 'regional' ? (
          <div className="auth-field">
            <label>{t('Served regions')}</label>
            <div className="psp-chip-row">
              {MARKET_REGIONS.map((region) => {
                const active = formData.serviceCoverageRegions.includes(region);
                return (
                  <button
                    key={region}
                    type="button"
                    className={`psp-chip ${active ? 'psp-chip--active' : ''}`}
                    onClick={() => toggleCoverageRegion(region)}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            {errors.serviceCoverageRegions ? (
              <div className="auth-error">{errors.serviceCoverageRegions}</div>
            ) : null}
          </div>
        ) : null}

        <div className="auth-field">
          <label>{t('Business summary')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isLoading}
            className="psp-textarea"
            placeholder={t(
              'Describe what you do, who you serve, and what makes your work reliable.'
            )}
          />
          <div className="auth-field__hint">
            {t(
              'This is optional but strongly recommended. It helps the provider profile avoid looking empty immediately after signup.'
            )}
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
            {t('Why this onboarding is different')}
          </div>
          <div className="mt-2 text-sm">
            {t(
              'New provider accounts will already know their category, location, and experience level. That means moderation, discovery, and profile completion start with real signal instead of blank state cleanup.'
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
            <strong>{t('Terms and moderation rules')}</strong>
            {t(
              'I agree to the marketplace terms, provider moderation process, and communication policies.'
            )}
            {errors.acceptTerms ? <span className="auth-error">{errors.acceptTerms}</span> : null}
          </span>
        </label>

        <button type="submit" className="psp-button psp-button--primary w-full" disabled={isLoading || categoriesLoading}>
          {isLoading ? t('Creating provider account...') : t('Join as service provider')}
        </button>

        <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Local-first positioning')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t(
                'Wilaya and city are captured from the start to improve local matching inside the Algerian marketplace.'
              )}
            </div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Review readiness')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t(
                'Better initial context means the reviewer and admin workflows start with more useful provider data.'
              )}
            </div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-4 md:col-span-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <MapPin size={18} />
            </div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight text-slate-900">
              {t('Delivery reach is explicit')}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600">
              {t(
                'Providers can declare whether they only serve their wilaya, selected regions, or all Algeria. This becomes a real ranking and visibility signal in search.'
              )}
            </div>
          </div>
        </div>
      </form>
    </AuthShell>
  );
};

export default ProviderRegister;
