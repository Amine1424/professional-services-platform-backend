import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Loader2,
  MessageSquare,
  Search,
  Shield,
  Star,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PublicAuthScene from '../components/public-entry/PublicAuthScene';
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

const COVERAGE_OPTIONS: Array<{
  id: ProviderCoverageMode;
  name: string;
  description: string;
}> = [
  {
    id: 'wilaya_only',
    name: 'Local Only',
    description: 'Serve only my primary wilaya',
  },
  {
    id: 'regional',
    name: 'Regional',
    description: 'Serve selected Algerian regions',
  },
  {
    id: 'nationwide',
    name: 'National',
    description: 'Serve all Algeria',
  },
];

export const ProviderRegister: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading } = useAuth();
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
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

  const sections = useMemo(
    () => [
      {
        id: 'identity',
        title: t('Business Identity'),
        fields: ['companyName', 'firstName', 'lastName', 'phone'],
      },
      {
        id: 'placement',
        title: t('Marketplace Placement'),
        fields: ['primaryCategoryId', 'region', 'wilaya', 'city', 'yearsOfExperience'],
      },
      {
        id: 'coverage',
        title: t('Service Coverage'),
        fields: ['serviceCoverageMode', 'serviceCoverageRegions'],
      },
      {
        id: 'summary',
        title: t('Business Summary'),
        fields: ['description'],
      },
      {
        id: 'security',
        title: t('Account Security'),
        fields: ['email', 'password', 'confirmPassword', 'acceptTerms'],
      },
    ],
    [t]
  );

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

  const buildAllErrors = () => {
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
    if (!formData.yearsOfExperience) {
      nextErrors.yearsOfExperience = t('Years of experience is required.');
    } else if (Number(formData.yearsOfExperience) < 0) {
      nextErrors.yearsOfExperience = t('Years of experience must be zero or more.');
    }

    if (formData.serviceCoverageMode === 'regional' && !formData.serviceCoverageRegions.length) {
      nextErrors.serviceCoverageRegions = t('Select at least one served region.');
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

    return nextErrors;
  };

  const validateCurrentSection = () => {
    const nextErrors = buildAllErrors();
    const currentFields = sections[currentSection].fields;
    const scopedErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([key]) => currentFields.includes(key))
    );

    setErrors(scopedErrors);
    return Object.keys(scopedErrors).length === 0;
  };

  const updateField = (name: keyof ProviderFormState, value: string | boolean | string[]) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));
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

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection((current) => Math.min(current + 1, sections.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentSection((current) => Math.max(current - 1, 0));
  };

  const goToFirstErrorSection = (nextErrors: Record<string, string>) => {
    const firstErrorIndex = sections.findIndex((section) =>
      section.fields.some((field) => nextErrors[field])
    );

    if (firstErrorIndex >= 0) {
      setCurrentSection(firstErrorIndex);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = buildAllErrors();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      goToFirstErrorSection(nextErrors);
      return;
    }

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

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Business name')}
              </label>
              <input
                value={formData.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder={t('Amine Services')}
                disabled={isLoading}
                autoFocus
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              {errors.companyName ? (
                <div className="mt-1 text-xs text-red-600">{errors.companyName}</div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {t('First name')}
                </label>
                <input
                  value={formData.firstName}
                  onChange={(event) => updateField('firstName', event.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                {errors.lastName ? (
                  <div className="mt-1 text-xs text-red-600">{errors.lastName}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Phone number')}
              </label>
              <input
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="0555555555"
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              {errors.phone ? <div className="mt-1 text-xs text-red-600">{errors.phone}</div> : null}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Primary category')}
              </label>
              <select
                value={formData.primaryCategoryId}
                onChange={(event) => updateField('primaryCategoryId', event.target.value)}
                disabled={isLoading || categoriesLoading}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">{t('Select category')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesError ? <div className="mt-1 text-xs text-red-600">{categoriesError}</div> : null}
              {errors.primaryCategoryId ? (
                <div className="mt-1 text-xs text-red-600">{errors.primaryCategoryId}</div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {t('Marketplace region')}
                </label>
                <select
                  value={formData.region}
                  onChange={(event) => updateField('region', event.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">{t('Select region')}</option>
                  {MARKET_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {t(region)}
                    </option>
                  ))}
                </select>
                {errors.region ? <div className="mt-1 text-xs text-red-600">{errors.region}</div> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {t('Wilaya')}
                </label>
                <select
                  value={formData.wilaya}
                  onChange={(event) => updateField('wilaya', event.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">{t('Select wilaya')}</option>
                  {ALGERIA_WILAYAS.map((wilaya) => (
                    <option key={wilaya} value={wilaya}>
                      {t(wilaya)}
                    </option>
                  ))}
                </select>
                {errors.wilaya ? <div className="mt-1 text-xs text-red-600">{errors.wilaya}</div> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {t('City')}
                </label>
                <input
                  value={formData.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  placeholder={t('Bab Ezzouar, Oran Centre, Constantine...')}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                {errors.city ? <div className="mt-1 text-xs text-red-600">{errors.city}</div> : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {t('Years of experience')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.yearsOfExperience}
                  onChange={(event) => updateField('yearsOfExperience', event.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                {errors.yearsOfExperience ? (
                  <div className="mt-1 text-xs text-red-600">{errors.yearsOfExperience}</div>
                ) : null}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            {COVERAGE_OPTIONS.map((option) => {
              const active = formData.serviceCoverageMode === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    active ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceCoverageMode"
                    value={option.id}
                    checked={active}
                    onChange={(event) =>
                      updateField('serviceCoverageMode', event.target.value as ProviderCoverageMode)
                    }
                    className="sr-only"
                  />
                  <div
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      active ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                    }`}
                  >
                    {active ? <Check className="h-3 w-3 text-white" /> : null}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t(option.name)}</div>
                    <div className="mt-0.5 text-sm text-slate-500">{t(option.description)}</div>
                  </div>
                </label>
              );
            })}

            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-500">
              {t(
                'This controls where the provider can appear in discovery and what travel expectation the customer sees.'
              )}
            </div>

            {formData.serviceCoverageMode === 'regional' ? (
              <div className="pt-2">
                <div className="mb-2 text-sm font-medium text-slate-900">{t('Served regions')}</div>
                <div className="flex flex-wrap gap-2">
                  {MARKET_REGIONS.map((region) => {
                    const active = formData.serviceCoverageRegions.includes(region);
                    return (
                      <button
                        key={region}
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          active
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-slate-900'
                        }`}
                        onClick={() => toggleCoverageRegion(region)}
                      >
                        {t(region)}
                      </button>
                    );
                  })}
                </div>
                {errors.serviceCoverageRegions ? (
                  <div className="mt-2 text-xs text-red-600">{errors.serviceCoverageRegions}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Business summary')}
              </label>
              <textarea
                value={formData.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder={t(
                  'Describe what you do, who you serve, and what makes your work reliable.'
                )}
                rows={5}
                disabled={isLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {t(
                    'Optional but recommended. It helps the public profile look real immediately after signup.'
                  )}
                </span>
                <span>{formData.description.length}</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Professional email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder={t('you@example.com')}
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              {errors.email ? <div className="mt-1 text-xs text-red-600">{errors.email}</div> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                {t('Create password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder={t('At least 8 characters')}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? t('Hide password') : t('Show password')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                value={formData.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder={t('StrongPass1!')}
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              {errors.confirmPassword ? (
                <div className="mt-1 text-xs text-red-600">{errors.confirmPassword}</div>
              ) : null}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PublicAuthScene accent="teal">
      <main className="psp-desktop-frame py-8">
        <div className="grid gap-8 xl:grid-cols-[0.94fr_1.26fr] xl:gap-14">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                <BriefcaseBusiness className="h-3 w-3" />
                {t('For Service Professionals')}
              </div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {t('Build your professional presence')}
              </h1>
              <p className="text-balance text-slate-500">
                {describeRedirectIntent(redirectTarget) ||
                  t(
                    'Join verified service providers. Create a credible profile that helps customers find and trust you from day one.'
                  )}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                  <Search className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('Appear in search results')}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t('Get discovered by customers searching for your services')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                  <Star className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('Build trust with reviews')}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t('Collect verified reviews from satisfied customers')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
                  <MessageSquare className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('Direct customer messaging')}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t('Communicate directly and manage service requests')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-100/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                <BadgeCheck className="h-4 w-4 text-teal-600" />
                {t('Quality-first marketplace')}
              </div>
              <p className="text-xs leading-6 text-slate-500">
                {t(
                  'All provider profiles are reviewed before appearing in search results. Complete profiles are approved faster.'
                )}
              </p>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{t('Moderation readiness')}</span>
                  <span>{onboardingReadiness}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${onboardingReadiness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="xl:min-w-0">
            <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-lg backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-1">
                  {sections.map((section, index) => (
                    <div key={section.id} className="flex flex-1 items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          index <= currentSection ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {index < currentSection ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      {index < sections.length - 1 ? (
                        <div
                          className={`mx-1 h-0.5 flex-1 ${
                            index < currentSection ? 'bg-teal-600' : 'bg-slate-200'
                          }`}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {sections[currentSection].title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {t('Step')} {currentSection + 1} {t('of')} {sections.length}
                  </p>
                </div>

                <div className="min-h-[320px]">{renderCurrentSection()}</div>

                {currentSection === sections.length - 1 ? (
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(event) => updateField('acceptTerms', event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-200"
                      />
                      <span className="cursor-pointer select-none text-sm leading-snug text-slate-500">
                        {t(
                          'I agree to the marketplace terms, provider moderation process, and communication policies.'
                        )}
                      </span>
                    </label>
                    {errors.acceptTerms ? (
                      <div className="text-xs text-red-600">{errors.acceptTerms}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  {currentSection > 0 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                    >
                      {t('Back')}
                    </button>
                  ) : null}
                  {currentSection < sections.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      {t('Continue')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoading || categoriesLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('Creating provider account...')}
                        </>
                      ) : (
                        t('Join as service provider')
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-500">{t('Already have an account?')}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={withRedirect('/login', redirectTarget)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-900 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  {t('Sign In')}
                </Link>
                <Link
                  to={withRedirect('/join/customer', redirectTarget)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-900 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
                >
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>{t('Create customer account')}</span>
                </Link>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              <div className="inline-flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                <span>{t('Need help? Contact support.')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicAuthScene>
  );
};

export default ProviderRegister;
