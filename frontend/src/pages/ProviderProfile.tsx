import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'react-toastify';
import ProviderWorkspaceTopNav from '../components/provider/ProviderWorkspaceTopNav';
import api from '../config/api';
import {
  getBranchSubcategories,
  getRootCategories,
  getRootCategoryId,
  MarketplaceCategory,
} from '../lib/categories';
import {
  ALGERIA_WILAYAS,
  buildProviderCoverageLabel,
  expandCoverageSelectionsToWilayas,
  getWilayasForRegion,
  MARKET_REGIONS,
  ProviderCoverageMode,
  resolveRegionFromWilaya,
} from '../lib/algeria';
import '../styles/app-primitives.css';

type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
type ProviderPlan = 'basic' | 'pro' | 'business';

interface ProviderProfileResponse {
  id: string;
  companyName: string;
  description?: string | null;
  region?: string | null;
  wilaya?: string | null;
  city?: string | null;
  addressLine?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  primaryCategoryId?: string | null;
  yearsOfExperience: number;
  responseTimeMinutes: number;
  serviceCoverageMode?: ProviderCoverageMode;
  serviceCoverageRegions?: string[] | null;
  averageRating?: string | number;
  reviewsCount?: number;
  isVerified?: boolean;
  status?: ProviderStatus;
  createdAt?: string;
  services?: Array<{ id: string; status?: string | null }>;
  preference?: {
    selectedPlan?: ProviderPlan;
    featuredOnHomepage?: boolean;
    profileBadgeText?: string | null;
    autoReplyEnabled?: boolean;
  } | null;
  planFeatures?: {
    canUseProfileBadge?: boolean;
    canFeatureOnHomepage?: boolean;
    canFeatureServices?: boolean;
  } | null;
}

interface ProviderFormState {
  companyName: string;
  description: string;
  region: string;
  wilaya: string;
  city: string;
  addressLine: string;
  avatarUrl: string;
  coverUrl: string;
  primaryCategoryId: string;
  yearsOfExperience: number;
  responseTimeMinutes: number;
  serviceCoverageMode: ProviderCoverageMode;
  serviceCoverageRegions: string[];
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  href: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80';
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80';

const normalizeFormState = (form: ProviderFormState) =>
  JSON.stringify({
    ...form,
    serviceCoverageRegions: [...form.serviceCoverageRegions].sort(),
  });

const createFormState = (provider: Partial<ProviderProfileResponse>): ProviderFormState => ({
  companyName: provider.companyName || '',
  description: provider.description || '',
  region: provider.region || '',
  wilaya: provider.wilaya || '',
  city: provider.city || '',
  addressLine: provider.addressLine || '',
  avatarUrl: provider.avatarUrl || '',
  coverUrl: provider.coverUrl || '',
  primaryCategoryId: provider.primaryCategoryId || '',
  yearsOfExperience: provider.yearsOfExperience || 0,
  responseTimeMinutes: provider.responseTimeMinutes || 0,
  serviceCoverageMode: provider.serviceCoverageMode || 'wilaya_only',
  serviceCoverageRegions:
    provider.serviceCoverageMode === 'regional'
      ? expandCoverageSelectionsToWilayas(provider.serviceCoverageRegions || [])
      : provider.serviceCoverageRegions || [],
});

const getResponseStatus = (minutes: number) => {
  if (!minutes || minutes <= 0) {
    return {
      label: 'Not configured',
      toneClass: 'border-slate-200 bg-slate-100 text-slate-700',
      description: 'Customers do not yet see a committed response expectation on your public profile.',
    };
  }

  if (minutes <= 60) {
    return {
      label: 'Excellent',
      toneClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      description: 'Fast response expectations strengthen trust and improve discovery quality.',
    };
  }

  if (minutes <= 180) {
    return {
      label: 'Good',
      toneClass: 'border-sky-200 bg-sky-50 text-sky-700',
      description: 'The response promise is realistic, but a faster target would convert more leads.',
    };
  }

  return {
    label: 'Needs improvement',
    toneClass: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Slow public response expectations can weaken inquiry conversion before customers message you.',
  };
};

const getReadinessState = (score: number, status?: ProviderStatus) => {
  if (status === 'approved' && score >= 85) {
    return {
      label: 'Public ready',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      helper: 'The profile is strong enough to support discovery, trust, and direct customer action.',
    };
  }

  if (score >= 60) {
    return {
      label: 'Almost ready',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      helper: 'A few visible trust gaps still weaken how the provider appears before contact starts.',
    };
  }

  return {
    label: 'Needs work',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    helper: 'Public identity is still too incomplete to support strong marketplace trust.',
  };
};

const responseTimeOptions = [
  { value: 0, label: 'Not set yet' },
  { value: 15, label: 'Under 15 minutes' },
  { value: 30, label: 'Under 30 minutes' },
  { value: 60, label: 'Under 1 hour' },
  { value: 120, label: 'Under 2 hours' },
  { value: 240, label: 'Under 4 hours' },
  { value: 480, label: 'Same day' },
  { value: 1440, label: 'Within 24 hours' },
];

const experienceOptions = [
  { value: 0, label: 'Not set yet' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 5, label: '5+ years' },
  { value: 10, label: '10+ years' },
  { value: 15, label: '15+ years' },
  { value: 20, label: '20+ years' },
];

const ProviderProfile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [provider, setProvider] = useState<ProviderProfileResponse | null>(null);
  const [form, setForm] = useState<ProviderFormState>(createFormState({}));
  const [baseline, setBaseline] = useState<ProviderFormState | null>(null);
  const [regionalFocus, setRegionalFocus] = useState('');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [providerRes, categoriesRes] = await Promise.all([
          api.get('/providers/me'),
          api.get('/categories'),
        ]);

        if (!active) {
          return;
        }

        const nextProvider: ProviderProfileResponse = providerRes.data?.data || {};
        const nextForm = createFormState(nextProvider);

        setCategories(categoriesRes.data?.data || []);
        setProvider(nextProvider);
        setForm(nextForm);
        setBaseline(nextForm);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load the provider profile.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const selectedRootCategoryId = useMemo(
    () => getRootCategoryId(categories, form.primaryCategoryId) || '',
    [categories, form.primaryCategoryId]
  );
  const branchSubcategories = useMemo(
    () => (selectedRootCategoryId ? getBranchSubcategories(categories, selectedRootCategoryId) : []),
    [categories, selectedRootCategoryId]
  );
  const selectedRootCategory = useMemo(
    () => rootCategories.find((category) => category.id === selectedRootCategoryId) || null,
    [rootCategories, selectedRootCategoryId]
  );
  const selectedSubcategory =
    form.primaryCategoryId && form.primaryCategoryId !== selectedRootCategoryId
      ? branchSubcategories.find((category) => category.id === form.primaryCategoryId) || null
      : null;

  useEffect(() => {
    if (form.serviceCoverageMode !== 'regional') {
      return;
    }

    const nextFocus =
      regionalFocus ||
      resolveRegionFromWilaya(form.serviceCoverageRegions[0]) ||
      form.region ||
      MARKET_REGIONS[0];

    if (nextFocus && nextFocus !== regionalFocus) {
      setRegionalFocus(nextFocus);
    }
  }, [form.region, form.serviceCoverageMode, form.serviceCoverageRegions, regionalFocus]);

  const isWelcomeFlow = searchParams.get('welcome') === '1';
  const hasUnsavedChanges = baseline
    ? normalizeFormState(form) !== normalizeFormState(baseline)
    : false;

  const coverageSummary = useMemo(
    () =>
      buildProviderCoverageLabel(form.serviceCoverageMode, {
        wilaya: form.wilaya,
        region: form.region,
        regions: form.serviceCoverageRegions,
      }),
    [form.region, form.serviceCoverageMode, form.serviceCoverageRegions, form.wilaya]
  );

  const checklistItems = useMemo<ChecklistItem[]>(() => {
    const descriptionLength = form.description.trim().length;
    return [
      {
        id: 'name',
        label: 'Business name is present',
        completed: Boolean(form.companyName.trim()),
        weight: 15,
        href: '#identity',
      },
      {
        id: 'description',
        label: 'Professional description is strong',
        completed: descriptionLength >= 100,
        weight: 20,
        href: '#identity',
      },
      {
        id: 'category',
        label: 'Category and specialization are set',
        completed: Boolean(form.primaryCategoryId),
        weight: 10,
        href: '#identity',
      },
      {
        id: 'avatar',
        label: 'Avatar is uploaded',
        completed: Boolean(form.avatarUrl),
        weight: 10,
        href: '#visual',
      },
      {
        id: 'cover',
        label: 'Cover image is uploaded',
        completed: Boolean(form.coverUrl),
        weight: 10,
        href: '#visual',
      },
      {
        id: 'location',
        label: 'Location is complete',
        completed: Boolean(form.region.trim() && form.wilaya.trim() && form.city.trim()),
        weight: 10,
        href: '#service-area',
      },
      {
        id: 'coverage',
        label: 'Service coverage is clear',
        completed:
          form.serviceCoverageMode === 'nationwide' ||
          form.serviceCoverageMode === 'wilaya_only' ||
          form.serviceCoverageRegions.length > 0,
        weight: 10,
        href: '#service-area',
      },
      {
        id: 'experience',
        label: 'Experience is defined',
        completed: form.yearsOfExperience > 0,
        weight: 5,
        href: '#identity',
      },
      {
        id: 'response',
        label: 'Response promise is configured',
        completed: form.responseTimeMinutes > 0,
        weight: 10,
        href: '#operations',
      },
    ];
  }, [
    form.avatarUrl,
    form.city,
    form.companyName,
    form.coverUrl,
    form.description,
    form.primaryCategoryId,
    form.region,
    form.responseTimeMinutes,
    form.serviceCoverageMode,
    form.serviceCoverageRegions.length,
    form.wilaya,
    form.yearsOfExperience,
  ]);

  const profileScore = useMemo(() => {
    const completedWeight = checklistItems
      .filter((item) => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    const totalWeight = checklistItems.reduce((sum, item) => sum + item.weight, 0);

    return totalWeight ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }, [checklistItems]);

  const readinessState = getReadinessState(profileScore, provider?.status);
  const responseStatus = getResponseStatus(form.responseTimeMinutes);
  const previewHref = provider?.id ? `/providers/${provider.id}` : undefined;
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const incompleteChecklist = checklistItems.filter((item) => !item.completed);
  const visibleRegionalWilayas = useMemo(
    () => getWilayasForRegion(regionalFocus),
    [regionalFocus]
  );
  const selectedRegionalWilayas = useMemo(
    () =>
      form.serviceCoverageRegions.filter((wilaya) =>
        visibleRegionalWilayas.includes(wilaya)
      ),
    [form.serviceCoverageRegions, visibleRegionalWilayas]
  );

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === 'yearsOfExperience' || name === 'responseTimeMinutes' ? Number(value) : value,
    }));
  };

  const handleRootCategoryChange = (rootCategoryId: string) => {
    setForm((current) => ({
      ...current,
      primaryCategoryId: rootCategoryId,
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setForm((current) => ({
      ...current,
      primaryCategoryId: subcategoryId || selectedRootCategoryId,
    }));
  };

  const toggleCoverageRegion = (region: string) => {
    setForm((current) => {
      const isActive = current.serviceCoverageRegions.includes(region);

      return {
        ...current,
        serviceCoverageRegions: isActive
          ? current.serviceCoverageRegions.filter((item) => item !== region)
          : [...current.serviceCoverageRegions, region],
      };
    });
  };

  const addAllFocusedWilayas = () => {
    if (!visibleRegionalWilayas.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      serviceCoverageRegions: Array.from(
        new Set([...current.serviceCoverageRegions, ...visibleRegionalWilayas])
      ),
    }));
  };

  const clearFocusedWilayas = () => {
    if (!visibleRegionalWilayas.length) {
      return;
    }

    setForm((current) => ({
      ...current,
      serviceCoverageRegions: current.serviceCoverageRegions.filter(
        (wilaya) => !visibleRegionalWilayas.includes(wilaya)
      ),
    }));
  };

  const uploadProfileMedia = async (fieldName: 'avatarFile' | 'coverFile', file: File) => {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (fieldName === 'avatarFile') {
      setUploadingAvatar(true);
    } else {
      setUploadingCover(true);
    }

    try {
      const response = await api.post('/providers/me/media', formData);
      const uploaded = response.data?.data || {};

      setForm((current) => ({
        ...current,
        avatarUrl: uploaded.avatarUrl || current.avatarUrl,
        coverUrl: uploaded.coverUrl || current.coverUrl,
      }));
      setBaseline((current) =>
        current
          ? {
              ...current,
              avatarUrl: uploaded.avatarUrl || current.avatarUrl,
              coverUrl: uploaded.coverUrl || current.coverUrl,
            }
          : current
      );

      toast.success(fieldName === 'avatarFile' ? 'Avatar uploaded.' : 'Cover uploaded.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload the image.');
    } finally {
      if (fieldName === 'avatarFile') {
        setUploadingAvatar(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleMediaFileChange =
    (fieldName: 'avatarFile' | 'coverFile') =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      await uploadProfileMedia(fieldName, file);
      event.target.value = '';
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.companyName.trim()) {
      toast.error('Business name is required.');
      return;
    }

    if (form.serviceCoverageMode === 'regional' && !form.serviceCoverageRegions.length) {
      toast.error('Select at least one served wilaya for regional coverage.');
      return;
    }

    try {
      setSaving(true);

      await api.put('/providers/me', {
        companyName: form.companyName,
        description: form.description,
        region: form.region,
        wilaya: form.wilaya,
        city: form.city,
        addressLine: form.addressLine,
        avatarUrl: form.avatarUrl || null,
        coverUrl: form.coverUrl || null,
        primaryCategoryId: form.primaryCategoryId || null,
        yearsOfExperience: form.yearsOfExperience,
        responseTimeMinutes: form.responseTimeMinutes,
        serviceCoverageMode: form.serviceCoverageMode,
        serviceCoverageRegions:
          form.serviceCoverageMode === 'regional' ? form.serviceCoverageRegions : [],
      });

      setBaseline(form);
      toast.success('Provider profile saved successfully.');

      if (isWelcomeFlow) {
        const next = new URLSearchParams(searchParams);
        next.delete('welcome');
        setSearchParams(next, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save the provider profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ProviderWorkspaceTopNav currentPage="profile" fluid />

      <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {loading ? (
          <div className="grid gap-6">
            <div className="h-[188px] animate-pulse rounded-[30px] bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.06)]" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-6">
                <div className="h-[320px] animate-pulse rounded-[28px] bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.06)]" />
                <div className="h-[340px] animate-pulse rounded-[28px] bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.06)]" />
                <div className="h-[320px] animate-pulse rounded-[28px] bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.06)]" />
              </div>
              <div className="h-[460px] animate-pulse rounded-[28px] bg-white/90 shadow-[0_24px_55px_rgba(15,23,42,0.06)]" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            {isWelcomeFlow ? (
              <section className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(255,255,255,0.98))] px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                      Provider onboarding
                    </div>
                    <div className="mt-2 text-[24px] font-black tracking-tight text-slate-950">
                      Finish the public profile before moderation and discovery scale up.
                    </div>
                    <div className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Business identity, visuals, coverage, and response speed all shape whether customers trust the profile enough to message or request.
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                    {profileScore}% readiness
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Public Profile
                    </div>
                    <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-slate-950 sm:text-[38px]">
                      {form.companyName || 'Your business profile'}
                    </h1>
                  </div>

                  <div
                    className={`inline-flex items-center gap-3 rounded-[16px] border px-4 py-3 ${readinessState.className}`}
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-current">
                        {profileScore >= 85 ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{readinessState.label}</div>
                      <div className="mt-0.5 text-xs opacity-80">
                        {provider?.status === 'approved'
                          ? 'Your profile is complete and visible to customers'
                          : readinessState.helper}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        Profile Score
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-slate-950">
                        {profileScore}%
                      </div>
                    </div>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          profileScore >= 85 ? 'bg-emerald-500' : profileScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${profileScore}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      {completedChecklistCount}/{checklistItems.length} complete
                    </div>
                  </div>

                  {previewHref ? (
                    <Link
                      to={previewHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      Preview Public Profile
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <section id="identity" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionHeading
                    icon={<Building2 size={18} />}
                    title="Business identity"
                    subtitle="How customers recognize the business, understand the expertise, and decide whether the provider feels credible."
                  />

                  <div className="mt-6 grid gap-5">
                    <div>
                      <FieldLabel>Business name</FieldLabel>
                      <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleFieldChange}
                        className="psp-input"
                        placeholder="Your business or professional name"
                      />
                      <FieldHint>This is your primary public identity across discovery, requests, and messages.</FieldHint>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <FieldLabel>Professional description</FieldLabel>
                        <span className={`text-xs font-bold ${form.description.trim().length >= 100 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {form.description.length}/500
                        </span>
                      </div>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleFieldChange}
                        className="psp-textarea"
                        maxLength={500}
                        placeholder="Describe what you do, who you serve, and why customers can trust the way you work."
                      />
                      <div className="mt-3 flex items-start gap-2 rounded-[20px] border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-7 text-slate-600">
                        <Sparkles size={16} className="mt-1 shrink-0 text-sky-700" />
                        A clear description with specific expertise and service quality cues usually converts better than vague marketing language.
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
                      <div>
                        <FieldLabel>Main category</FieldLabel>
                        <select
                          value={selectedRootCategoryId}
                          onChange={(event) => handleRootCategoryChange(event.target.value)}
                          className="psp-select"
                        >
                          <option value="">Select main category</option>
                          {rootCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Specialization</FieldLabel>
                        <select
                          value={selectedSubcategory?.id || ''}
                          onChange={(event) => handleSubcategoryChange(event.target.value)}
                          className="psp-select"
                          disabled={!selectedRootCategoryId}
                        >
                          <option value="">
                            {branchSubcategories.length
                              ? 'Keep only the main category'
                              : 'No specialization under this category'}
                          </option>
                          {branchSubcategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <FieldLabel>Years of experience</FieldLabel>
                        <select
                          name="yearsOfExperience"
                          value={String(form.yearsOfExperience)}
                          onChange={handleFieldChange}
                          className="psp-select"
                        >
                          {experienceOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="visual" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionHeading
                    icon={<ImageIcon size={18} />}
                    title="Visual presence"
                    subtitle="The avatar and cover shape first impressions immediately on the public profile and in discovery contexts."
                  />

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMediaFileChange('avatarFile')}
                  />
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMediaFileChange('coverFile')}
                  />

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_320px]">
                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-slate-950">Cover image</div>
                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              Wide image for the public profile header and trust snapshot.
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="psp-button psp-button--secondary"
                              onClick={() => coverInputRef.current?.click()}
                              disabled={uploadingCover}
                            >
                              <Upload size={16} />
                              {uploadingCover ? 'Uploading...' : form.coverUrl ? 'Change cover' : 'Upload cover'}
                            </button>
                            {form.coverUrl ? (
                              <button
                                type="button"
                                className="psp-button psp-button--ghost"
                                onClick={() => setForm((current) => ({ ...current, coverUrl: '' }))}
                              >
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 relative aspect-[3/1] overflow-hidden rounded-[22px] border border-dashed border-slate-300 bg-white">
                          <img
                            src={form.coverUrl || DEFAULT_COVER}
                            alt={form.companyName || 'Provider cover'}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.46))]" />
                          <div className="absolute left-4 top-4 rounded-full bg-white/14 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
                            Public header
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-black text-slate-950">Avatar image</div>
                              <div className="mt-1 text-xs font-semibold text-slate-500">
                                Logo or professional portrait shown across the marketplace.
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col items-center gap-4">
                            <div className="h-28 w-28 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                              <img
                                src={form.avatarUrl || DEFAULT_AVATAR}
                                alt={form.companyName || 'Provider avatar'}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                className="psp-button psp-button--secondary"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                              >
                                <Camera size={16} />
                                {uploadingAvatar ? 'Uploading...' : form.avatarUrl ? 'Change avatar' : 'Upload avatar'}
                              </button>
                              {form.avatarUrl ? (
                                <button
                                  type="button"
                                  className="psp-button psp-button--ghost"
                                  onClick={() => setForm((current) => ({ ...current, avatarUrl: '' }))}
                                >
                                  Clear
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                          <div className="text-sm font-black text-slate-950">How customers see you</div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            This preview mirrors the public trust snapshot without leaving the editor.
                          </div>

                          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
                            <div className="relative h-28">
                              <img
                                src={form.coverUrl || DEFAULT_COVER}
                                alt={form.companyName || 'Cover preview'}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.54))]" />
                            </div>
                            <div className="relative px-5 pb-5 pt-0">
                              <div className="mt-[-32px] flex items-end gap-3">
                                <div className="h-20 w-20 overflow-hidden rounded-[24px] border-4 border-white bg-slate-100 shadow-lg">
                                  <img
                                    src={form.avatarUrl || DEFAULT_AVATAR}
                                    alt={form.companyName || 'Avatar preview'}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="pb-2">
                                  <div className="text-[22px] font-black tracking-tight text-slate-950">
                                    {form.companyName || 'Business name'}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                                    {selectedRootCategory ? <span>{selectedRootCategory.name}</span> : null}
                                    {form.city || form.wilaya || form.region ? (
                                      <>
                                        <span>•</span>
                                        <span>{[form.city, form.wilaya, form.region].filter(Boolean).join(', ')}</span>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {coverageSummary}
                                </span>
                                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${responseStatus.toneClass}`}>
                                  {form.responseTimeMinutes > 0 ? `Replies in ${form.responseTimeMinutes} min` : 'Response time not set'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-5">
                      <div className="text-sm font-black text-slate-950">Visual quality notes</div>
                      <div className="mt-3 grid gap-3">
                        {[
                          'Use a clear logo or a professional portrait for the avatar.',
                          'Choose a cover that represents real service quality, not a decorative stock photo.',
                          'Strong visuals reduce drop-off before the customer reads the profile copy.',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                            <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                              <CheckCircle2 size={14} />
                            </span>
                            <div className="text-sm leading-7 text-slate-600">{item}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section id="service-area" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionHeading
                    icon={<MapPin size={18} />}
                    title="Location and service area"
                    subtitle="Where customers can find you, where you operate, and what travel expectation they should infer before contact."
                  />

                  <div className="mt-6 grid gap-5">
                    <div className="grid gap-5 lg:grid-cols-3">
                      <div>
                        <FieldLabel>Marketplace region</FieldLabel>
                        <select name="region" value={form.region} onChange={handleFieldChange} className="psp-select">
                          <option value="">Select region</option>
                          {MARKET_REGIONS.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Wilaya</FieldLabel>
                        <select name="wilaya" value={form.wilaya} onChange={handleFieldChange} className="psp-select">
                          <option value="">Select wilaya</option>
                          {ALGERIA_WILAYAS.map((wilaya) => (
                            <option key={wilaya} value={wilaya}>
                              {wilaya}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>City / commune</FieldLabel>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleFieldChange}
                          className="psp-input"
                          placeholder="City / commune"
                        />
                      </div>
                    </div>

                    <div>
                      <FieldLabel>Address line</FieldLabel>
                      <input
                        name="addressLine"
                        value={form.addressLine}
                        onChange={handleFieldChange}
                        className="psp-input"
                        placeholder="Street address or operating address"
                      />
                      <FieldHint>Keep it specific enough for trust, but remember this detail is lower priority than your public service area.</FieldHint>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                      <div className="text-sm font-black text-slate-950">Coverage mode</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        This determines where you appear in discovery and what travel expectations customers infer.
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {[
                          {
                            value: 'wilaya_only' as ProviderCoverageMode,
                            label: 'Only inside my wilaya',
                            description: 'Best for local providers who serve primarily inside one wilaya.',
                          },
                          {
                            value: 'regional' as ProviderCoverageMode,
                            label: 'Selected Algerian regions',
                            description: 'Useful when the business can operate across several regional clusters.',
                          },
                          {
                            value: 'nationwide' as ProviderCoverageMode,
                            label: 'Anywhere in Algeria',
                            description: 'Best when logistics and delivery allow national service coverage.',
                          },
                        ].map((option) => {
                          const active = form.serviceCoverageMode === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setForm((current) => ({
                                  ...current,
                                  serviceCoverageMode: option.value,
                                }));

                                if (option.value === 'regional') {
                                  setRegionalFocus(
                                    resolveRegionFromWilaya(form.serviceCoverageRegions[0]) ||
                                      form.region ||
                                      MARKET_REGIONS[0]
                                  );
                                }
                              }}
                              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                                active
                                  ? 'border-emerald-200 bg-emerald-50/80 shadow-[0_16px_30px_rgba(16,185,129,0.09)]'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="text-sm font-black text-slate-950">{option.label}</div>
                              <div className="mt-2 text-sm leading-7 text-slate-600">{option.description}</div>
                            </button>
                          );
                        })}
                      </div>

                      {form.serviceCoverageMode === 'regional' ? (
                        <div className="mt-5">
                          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                              <div className="text-sm font-black text-slate-950">Focused Algerian region</div>
                              <div className="mt-1 text-xs font-semibold text-slate-500">
                                Choose one regional cluster, then mark the wilayas you can actively serve inside it.
                              </div>
                              <div className="mt-4">
                                <select
                                  value={regionalFocus}
                                  onChange={(event) => setRegionalFocus(event.target.value)}
                                  className="psp-select"
                                >
                                  {MARKET_REGIONS.map((region) => (
                                    <option key={region} value={region}>
                                      {region}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="mt-4 grid gap-3">
                                <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                                    Selected in this region
                                  </div>
                                  <div className="mt-2 text-[24px] font-black tracking-tight text-slate-950">
                                    {selectedRegionalWilayas.length}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="psp-button psp-button--secondary"
                                    onClick={addAllFocusedWilayas}
                                  >
                                    Select all visible wilayas
                                  </button>
                                  <button
                                    type="button"
                                    className="psp-button psp-button--ghost"
                                    onClick={clearFocusedWilayas}
                                  >
                                    Clear this region
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-black text-slate-950">
                                    Wilayas served inside {regionalFocus || 'the selected region'}
                                  </div>
                                  <div className="mt-1 text-xs font-semibold text-slate-500">
                                    This matches the template behavior: choose a regional cluster first, then mark the exact wilayas you serve.
                                  </div>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {visibleRegionalWilayas.length} wilayas
                                </span>
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {visibleRegionalWilayas.map((wilaya) => {
                                  const active = form.serviceCoverageRegions.includes(wilaya);
                                  return (
                                    <button
                                      key={wilaya}
                                      type="button"
                                      onClick={() => toggleCoverageRegion(wilaya)}
                                      className={`flex items-center justify-between rounded-[18px] border px-3 py-3 text-left transition ${
                                        active
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span className="text-sm font-semibold">{wilaya}</span>
                                      <span
                                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                                          active
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-slate-300 bg-white text-transparent'
                                        }`}
                                      >
                                        <CheckCircle2 size={12} />
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-black text-slate-950">Selected served wilayas</div>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                {form.serviceCoverageRegions.length}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {form.serviceCoverageRegions.length ? (
                                form.serviceCoverageRegions.map((wilaya) => (
                                  <button
                                    key={wilaya}
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"
                                    onClick={() => toggleCoverageRegion(wilaya)}
                                  >
                                    {wilaya}
                                    <span className="text-emerald-600">×</span>
                                  </button>
                                ))
                              ) : (
                                <div className="text-sm text-slate-500">
                                  Select one or more wilayas from the focused region above.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-4 py-4">
                        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                          Public coverage label
                        </div>
                        <div className="mt-2 text-[18px] font-black tracking-tight text-slate-950">
                          {coverageSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="operations" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionHeading
                    icon={<Clock3 size={18} />}
                    title="Response and operational credibility"
                    subtitle="Customers judge reliability quickly. Use realistic operating signals that you can consistently meet in live demand."
                  />

                  <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className={`rounded-[24px] border px-5 py-5 ${responseStatus.toneClass}`}>
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 text-current">
                          {form.responseTimeMinutes > 0 && form.responseTimeMinutes <= 60 ? (
                            <BadgeCheck size={20} />
                          ) : (
                            <AlertCircle size={20} />
                          )}
                        </span>
                        <div>
                          <div className="text-[20px] font-black tracking-tight">{responseStatus.label}</div>
                          <div className="mt-2 text-sm leading-7 opacity-90">{responseStatus.description}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5">
                      <div>
                        <FieldLabel>Committed response time</FieldLabel>
                        <select
                          name="responseTimeMinutes"
                          value={String(form.responseTimeMinutes)}
                          onChange={handleFieldChange}
                          className="psp-select"
                        >
                          {responseTimeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <FieldHint>This promise is visible on the public profile. Set a response time you can consistently honor.</FieldHint>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                        <div className="text-sm font-black text-slate-950">Why this matters</div>
                        <div className="mt-3 grid gap-3">
                          {[
                            'Customers trust providers more when the response expectation is explicit.',
                            'Operational credibility often decides whether the lead becomes a message or a request.',
                            'Fast response expectations strengthen discovery, trust, and first-contact momentum.',
                          ].map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                <CheckCircle2 size={14} />
                              </span>
                              <div className="text-sm leading-7 text-slate-600">{item}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="sticky bottom-0 z-20 -mx-1">
                  <div className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
                    <div className="text-sm text-slate-500">
                      {hasUnsavedChanges ? (
                        <span className="flex items-center gap-2 font-medium text-slate-600">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Unsaved changes
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600">All changes saved</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving || uploadingAvatar || uploadingCover || !hasUnsavedChanges}
                        className="inline-flex min-w-[160px] items-center justify-center rounded-[14px] bg-[#87d6d4] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#76c9c6] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {saving ? 'Saving profile...' : 'Save profile'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="hidden lg:block lg:sticky lg:top-[88px] lg:self-start">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <div className="text-base font-semibold tracking-tight text-slate-950">Profile Completeness</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[30px] font-bold tracking-tight text-slate-950">{profileScore}%</div>
                      <div className="text-sm text-slate-500">
                        {completedChecklistCount}/{checklistItems.length} complete
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          profileScore >= 85 ? 'bg-emerald-500' : profileScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${profileScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-1.5">
                    {incompleteChecklist.length ? (
                      incompleteChecklist.map((item) => (
                        <a
                          key={item.id}
                          href={item.href}
                          className="group flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                              <AlertCircle size={12} />
                            </span>
                            <span className="text-xs text-slate-700">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                        </a>
                      ))
                    ) : (
                      <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
                        All major trust basics are already in place. The profile is structurally ready for customers.
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-4">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
      {icon}
    </span>
    <div>
      <div className="text-base font-semibold tracking-tight text-slate-950">{title}</div>
      <div className="mt-1 text-xs leading-6 text-slate-500">{subtitle}</div>
    </div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-2 text-sm font-black text-slate-800">{children}</div>
);

const FieldHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-2 text-xs leading-6 text-slate-500">{children}</div>
);

export default ProviderProfile;
