import React, { useEffect, useMemo, useState } from 'react';
import { Camera, MapPin, ShieldCheck, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  MARKET_REGIONS,
  ProviderCoverageMode,
} from '../lib/algeria';
import '../styles/app-primitives.css';

interface ProviderData {
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
}

const ProviderProfile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [form, setForm] = useState({
    companyName: '',
    description: '',
    region: '',
    wilaya: '',
    city: '',
    addressLine: '',
    avatarUrl: '',
    coverUrl: '',
    primaryCategoryId: '',
    yearsOfExperience: 0,
    responseTimeMinutes: 30,
    serviceCoverageMode: 'wilaya_only' as ProviderCoverageMode,
    serviceCoverageRegions: [] as string[],
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [providerRes, categoriesRes] = await Promise.all([
          api.get('/providers/me'),
          api.get('/categories'),
        ]);

        if (!active) return;

        const provider: ProviderData = providerRes.data?.data || {};
        setCategories(categoriesRes.data?.data || []);
        setForm({
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
          responseTimeMinutes: provider.responseTimeMinutes || 30,
          serviceCoverageMode: provider.serviceCoverageMode || 'wilaya_only',
          serviceCoverageRegions: provider.serviceCoverageRegions || [],
        });
      } catch {
        if (!active) return;
        toast.error('Failed to load the provider profile.');
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
    () =>
      selectedRootCategoryId
        ? getBranchSubcategories(categories, selectedRootCategoryId)
        : [],
    [categories, selectedRootCategoryId]
  );
  const selectedSubcategoryId =
    form.primaryCategoryId && form.primaryCategoryId !== selectedRootCategoryId
      ? form.primaryCategoryId
      : '';

  const handleChange = (
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

  const uploadProfileMedia = async (
    fieldName: 'avatarFile' | 'coverFile',
    file: File
  ) => {
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

      toast.success(fieldName === 'avatarFile' ? 'Avatar uploaded.' : 'Cover uploaded.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to upload the image.');
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

  const toggleCoverageRegion = (region: string) => {
    setForm((current) => {
      const active = current.serviceCoverageRegions.includes(region);
      return {
        ...current,
        serviceCoverageRegions: active
          ? current.serviceCoverageRegions.filter((item) => item !== region)
          : [...current.serviceCoverageRegions, region],
      };
    });
  };

  const completionStats = useMemo(() => {
    const checks = [
      Boolean(form.companyName.trim()),
      Boolean(form.description.trim()),
      Boolean(form.region.trim()),
      Boolean(form.wilaya.trim()),
      Boolean(form.city.trim()),
      form.serviceCoverageMode === 'regional' ? form.serviceCoverageRegions.length > 0 : true,
      Boolean(form.addressLine.trim()),
      Boolean(form.primaryCategoryId),
      form.yearsOfExperience > 0,
      Boolean(form.avatarUrl.trim()),
      Boolean(form.coverUrl.trim()),
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const isWelcomeFlow = searchParams.get('welcome') === '1';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.companyName.trim()) {
      toast.error('Business name is required.');
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
        avatarUrl: form.avatarUrl,
        coverUrl: form.coverUrl,
        primaryCategoryId: form.primaryCategoryId || null,
        yearsOfExperience: form.yearsOfExperience,
        responseTimeMinutes: form.responseTimeMinutes,
        serviceCoverageMode: form.serviceCoverageMode,
        serviceCoverageRegions:
          form.serviceCoverageMode === 'regional' ? form.serviceCoverageRegions : [],
      });
      toast.success('Provider profile saved successfully.');

      if (isWelcomeFlow) {
        const next = new URLSearchParams(searchParams);
        next.delete('welcome');
        setSearchParams(next, { replace: true });
      }
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to save the provider profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[260px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      {isWelcomeFlow ? (
        <section className="rounded-[26px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm">
          <div className="text-[18px] font-extrabold tracking-tight">Provider account created.</div>
          <div className="mt-2 text-sm leading-7">
            Finish the public profile now so moderation, discovery, and customer trust all start from stronger data.
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_24px_45px_rgba(15,23,42,0.08)]">
          <div className="relative h-[220px]">
            <img
              src={
                form.coverUrl ||
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
              }
              alt={form.companyName || 'Provider cover'}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.52))]" />
            <div className="absolute bottom-5 left-5 rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              Public preview
            </div>
          </div>
          <div className="p-6">
            <div className="mt-[-56px] flex items-end gap-4">
              <div className="h-28 w-28 overflow-hidden rounded-[28px] border-4 border-white bg-slate-100 shadow-xl">
                <img
                  src={
                    form.avatarUrl ||
                    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={form.companyName || 'Provider avatar'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pb-2">
                <div className="text-[28px] font-black tracking-tight text-slate-900">
                  {form.companyName || 'Business name'}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <MapPin size={14} />
                  {[form.city, form.wilaya, form.region].filter(Boolean).join(', ') || 'Add your location'}
                </div>
                <div className="mt-2 text-sm font-semibold text-emerald-700">
                  {buildProviderCoverageLabel(form.serviceCoverageMode, {
                    wilaya: form.wilaya,
                    region: form.region,
                    regions: form.serviceCoverageRegions,
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Completion
                </div>
                <div className="mt-2 text-[28px] font-black tracking-tight text-slate-900">
                  {completionStats}%
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${completionStats}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold tracking-tight text-slate-900">Local trust basics</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">
                      Category, Algerian service area, response speed, avatar, and cover image shape first impressions more than any other fields.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Provider profile editor</h2>
              <div className="psp-surface__sub">
                This is a production workspace. Keep the content clear, specific, and customer-facing.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Business name</div>
                <input name="companyName" value={form.companyName} onChange={handleChange} className="psp-input" />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Main category</div>
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
            </div>

            {selectedRootCategoryId ? (
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Subcategory</div>
                <select
                  value={selectedSubcategoryId}
                  onChange={(event) => handleSubcategoryChange(event.target.value)}
                  className="psp-select"
                >
                  <option value="">
                    {branchSubcategories.length
                      ? 'Keep only the main category'
                      : 'No subcategories under this main category'}
                  </option>
                  {branchSubcategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Professional description</div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="psp-textarea"
                placeholder="Describe what you do, who you serve, and what makes your service reliable."
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Marketplace region</div>
                <select name="region" value={form.region} onChange={handleChange} className="psp-select">
                  <option value="">Select region</option>
                  {MARKET_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Wilaya</div>
                <select name="wilaya" value={form.wilaya} onChange={handleChange} className="psp-select">
                  <option value="">Select wilaya</option>
                  {ALGERIA_WILAYAS.map((wilaya) => (
                    <option key={wilaya} value={wilaya}>
                      {wilaya}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">City / Commune</div>
                <input name="city" value={form.city} onChange={handleChange} className="psp-input" />
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Address line</div>
              <input name="addressLine" value={form.addressLine} onChange={handleChange} className="psp-input" />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-bold text-slate-700">Where can this provider serve?</div>
              <select
                name="serviceCoverageMode"
                value={form.serviceCoverageMode}
                onChange={handleChange}
                className="psp-select"
              >
                <option value="wilaya_only">Only inside my wilaya</option>
                <option value="regional">Selected Algerian regions</option>
                <option value="nationwide">Anywhere in Algeria</option>
              </select>
              <div className="mt-3 text-sm leading-7 text-slate-500">
                This affects where the provider appears in search and what travel expectation customers see on the public profile.
              </div>
              {form.serviceCoverageMode === 'regional' ? (
                <div className="mt-4 psp-chip-row">
                  {MARKET_REGIONS.map((region) => {
                    const active = form.serviceCoverageRegions.includes(region);
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
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Camera size={14} />
                  Avatar image
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>{uploadingAvatar ? 'Uploading avatar...' : 'Choose image from computer'}</span>
                  <Upload size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleMediaFileChange('avatarFile')} />
                </label>
                <div className="mt-3 text-xs leading-6 text-slate-500">
                  Upload a square or close-to-square image. The preview updates immediately after upload.
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Camera size={14} />
                  Cover image
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>{uploadingCover ? 'Uploading cover...' : 'Choose image from computer'}</span>
                  <Upload size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleMediaFileChange('coverFile')} />
                </label>
                <div className="mt-3 text-xs leading-6 text-slate-500">
                  Use a wide horizontal image for the public header and discovery cards.
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Years of experience</div>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  className="psp-input"
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Response time in minutes</div>
                <input
                  type="number"
                  name="responseTimeMinutes"
                  value={form.responseTimeMinutes}
                  onChange={handleChange}
                  className="psp-input"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || uploadingAvatar || uploadingCover}
                className="psp-button psp-button--primary"
              >
                {saving ? 'Saving profile...' : 'Save profile'}
              </button>
              <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                Public preview updates immediately after save.
              </div>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
};

export default ProviderProfile;
