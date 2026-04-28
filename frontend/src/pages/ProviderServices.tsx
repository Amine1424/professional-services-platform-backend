import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Pencil,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
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
import '../styles/app-primitives.css';

type ServiceStatus = 'draft' | 'published' | 'paused';
type DeliveryMode = 'online' | 'on_site' | 'hybrid';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price?: string | null;
  currencyCode: string;
  status: ServiceStatus;
  deliveryMode: DeliveryMode;
  responseTimeHours: number;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

interface PreferencePayload {
  preference: { selectedPlan: 'basic' | 'pro' | 'business' };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

interface ServiceFormState {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  currencyCode: string;
  status: ServiceStatus;
  deliveryMode: DeliveryMode;
  responseTimeHours: number;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText: string;
}

const emptyForm: ServiceFormState = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  currencyCode: 'DZD',
  status: 'draft',
  deliveryMode: 'on_site',
  responseTimeHours: 24,
  isFeatured: false,
  showPromoBadge: false,
  promoBadgeText: '',
};

const FILTERS: Array<{ id: 'all' | ServiceStatus; label: string }> = [
  { id: 'all', label: 'All services' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'paused', label: 'Paused' },
];

const formatPlanLabel = (plan?: 'basic' | 'pro' | 'business') => {
  if (plan === 'business') return 'BUSINESS';
  if (plan === 'pro') return 'PRO';
  return 'BASIC';
};

const formatDeliveryMode = (value: DeliveryMode) => {
  if (value === 'on_site') return 'On-site';
  if (value === 'online') return 'Online';
  return 'Hybrid';
};

const getStatusMeta = (status: ServiceStatus) => {
  if (status === 'published') {
    return {
      label: 'Published',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (status === 'paused') {
    return {
      label: 'Paused',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Draft',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  };
};

const ProviderServices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [preferenceData, setPreferenceData] = useState<PreferencePayload | null>(null);
  const [filter, setFilter] = useState<'all' | ServiceStatus>('all');
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const editorRef = useRef<HTMLElement | null>(null);

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const selectedRootCategoryId = useMemo(
    () => getRootCategoryId(categories, form.categoryId) || '',
    [categories, form.categoryId]
  );
  const branchSubcategories = useMemo(
    () =>
      selectedRootCategoryId
        ? getBranchSubcategories(categories, selectedRootCategoryId)
        : [],
    [categories, selectedRootCategoryId]
  );
  const selectedSubcategoryId =
    form.categoryId && form.categoryId !== selectedRootCategoryId ? form.categoryId : '';

  const loadData = async () => {
    try {
      const [servicesRes, categoriesRes, preferencesRes] = await Promise.all([
        api.get('/providers/me/services'),
        api.get('/categories'),
        api.get('/providers/me/preferences'),
      ]);

      setServices(servicesRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
      setPreferenceData(preferencesRes.data?.data || null);
    } catch {
      toast.error('Failed to load provider services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target as HTMLInputElement;
    const { name, value, type } = target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? target.checked
          : name === 'responseTimeHours'
            ? Number(value)
            : value,
    }));
  };

  const handleRootCategoryChange = (rootCategoryId: string) => {
    setForm((current) => ({
      ...current,
      categoryId: rootCategoryId,
    }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setForm((current) => ({
      ...current,
      categoryId: subcategoryId || selectedRootCategoryId,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error('Service name is required.');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Service description is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        categoryId: form.categoryId || null,
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price ? Number(form.price) : null,
        currencyCode: form.currencyCode,
        status: form.status,
        deliveryMode: form.deliveryMode,
        responseTimeHours: Number(form.responseTimeHours) || 24,
        isFeatured: form.isFeatured,
        showPromoBadge: form.showPromoBadge,
        promoBadgeText: form.promoBadgeText.trim() || null,
      };

      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast.success('Service updated successfully.');
      } else {
        await api.post('/services', payload);
        toast.success('Service created successfully.');
      }

      resetForm();
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Service action failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setForm({
      categoryId: service.categoryId || '',
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      currencyCode: service.currencyCode || 'DZD',
      status: service.status,
      deliveryMode: service.deliveryMode,
      responseTimeHours: service.responseTimeHours || 24,
      isFeatured: service.isFeatured,
      showPromoBadge: service.showPromoBadge,
      promoBadgeText: service.promoBadgeText || '',
    });

    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this service?');
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deleted successfully.');
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to delete the service.');
    }
  };

  const stats = useMemo(
    () => ({
      total: services.length,
      published: services.filter((service) => service.status === 'published').length,
      draft: services.filter((service) => service.status === 'draft').length,
      paused: services.filter((service) => service.status === 'paused').length,
      featured: services.filter((service) => service.isFeatured).length,
    }),
    [services]
  );

  const filteredServices = useMemo(() => {
    if (filter === 'all') {
      return services;
    }

    return services.filter((service) => service.status === filter);
  }, [filter, services]);

  const showcaseService = useMemo(
    () =>
      services.find((service) => service.status === 'published' && service.isFeatured) ||
      services.find((service) => service.status === 'published') ||
      services[0] ||
      null,
    [services]
  );

  const planLabel = formatPlanLabel(preferenceData?.preference.selectedPlan);
  const canFeatureServices = Boolean(preferenceData?.planFeatures.canFeatureServices);
  const canUsePromoBadge = Boolean(preferenceData?.planFeatures.canUseServicePromoBadge);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ProviderWorkspaceTopNav currentPage="services" fluid />
        <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid gap-6">
            <div className="h-[200px] animate-pulse rounded-[28px] bg-white shadow-sm" />
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="h-[640px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              <div className="grid gap-6">
                <div className="h-[140px] animate-pulse rounded-[28px] bg-white shadow-sm" />
                <div className="h-[520px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ProviderWorkspaceTopNav currentPage="services" fluid />

      <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Service storefront
                </div>
                <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950 sm:text-[36px]">
                  Shape the offers customers compare, message, and request.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Each service should read like a concrete offer with a clear outcome, delivery mode,
                  and realistic response promise. This is the commercial layer customers inspect before
                  requests start.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Current plan
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{planLabel}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {canFeatureServices
                      ? 'Featured services are available on this plan.'
                      : 'Feature upgrades are locked until Pro or Business.'}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Storefront health
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    {stats.published} published
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {stats.draft + stats.paused > 0
                      ? `${stats.draft + stats.paused} services still need refinement or reactivation.`
                      : 'All current services are ready for discovery.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total services',
                value: stats.total,
                caption: 'Everything currently in the workspace.',
                icon: BriefcaseBusiness,
                iconClass: 'bg-sky-50 text-sky-700',
              },
              {
                label: 'Published',
                value: stats.published,
                caption: 'Offers customers can request today.',
                icon: Store,
                iconClass: 'bg-emerald-50 text-emerald-700',
              },
              {
                label: 'Drafts',
                value: stats.draft,
                caption: 'Offers that still need polish.',
                icon: Tag,
                iconClass: 'bg-amber-50 text-amber-700',
              },
              {
                label: 'Featured',
                value: stats.featured,
                caption: 'Promoted services with stronger visibility.',
                icon: Star,
                iconClass: 'bg-violet-50 text-violet-700',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-slate-500">{item.label}</div>
                  <div className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{item.caption}</div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside ref={editorRef} className="xl:sticky xl:top-24 xl:self-start">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Service editor
                    </div>
                    <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-950">
                      {editingId ? 'Refine this offer' : 'Create a new service'}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Keep service names concrete, descriptions outcome-based, and delivery details easy
                      for customers to compare.
                    </p>
                  </div>

                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <CirclePlus size={16} />
                      New
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600">Featured placements</span>
                    <span className={`font-semibold ${canFeatureServices ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {canFeatureServices ? 'Enabled' : 'Upgrade required'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600">Promo badge support</span>
                    <span className={`font-semibold ${canUsePromoBadge ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {canUsePromoBadge ? 'Enabled' : 'Upgrade required'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Service name</div>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="psp-input"
                      placeholder="Emergency plumbing repairs"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-700">Description</div>
                      <span className="text-xs font-semibold text-slate-400">
                        {form.description.length}/600
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      maxLength={600}
                      className="psp-textarea min-h-[140px]"
                      placeholder="Explain what the customer gets, what is included, and how this service solves a real problem."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Main category</div>
                      <select
                        value={selectedRootCategoryId}
                        onChange={(event) => handleRootCategoryChange(event.target.value)}
                        className="psp-select"
                      >
                        <option value="">No category</option>
                        {rootCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Specialization</div>
                      <select
                        value={selectedSubcategoryId}
                        onChange={(event) => handleSubcategoryChange(event.target.value)}
                        className="psp-select"
                        disabled={!selectedRootCategoryId}
                      >
                        <option value="">
                          {!selectedRootCategoryId
                            ? 'Select main category first'
                            : branchSubcategories.length
                              ? 'Keep only the main category'
                              : 'No subcategories under this category'}
                        </option>
                        {branchSubcategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Price</div>
                      <input
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        className="psp-input"
                        placeholder="15000"
                      />
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Currency</div>
                      <input
                        name="currencyCode"
                        value={form.currencyCode}
                        onChange={handleChange}
                        className="psp-input"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Status</div>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="psp-select"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Delivery mode</div>
                      <select
                        name="deliveryMode"
                        value={form.deliveryMode}
                        onChange={handleChange}
                        className="psp-select"
                      >
                        <option value="on_site">On-site</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Response time in hours</div>
                    <input
                      type="number"
                      min={1}
                      name="responseTimeHours"
                      value={form.responseTimeHours}
                      onChange={handleChange}
                      className="psp-input"
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      disabled={!canFeatureServices}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Feature this service</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Boost visibility for stronger discovery. {canFeatureServices ? 'Enabled on your plan.' : 'Available on Pro or Business.'}
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="showPromoBadge"
                      checked={form.showPromoBadge}
                      onChange={handleChange}
                      disabled={!canUsePromoBadge}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Show a promo badge</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Highlight fast delivery, limited offers, or a clear commercial angle on the card.
                      </span>
                    </span>
                  </label>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Promo badge text</div>
                    <input
                      name="promoBadgeText"
                      value={form.promoBadgeText}
                      onChange={handleChange}
                      className="psp-input"
                      placeholder="Fast delivery / New / Popular"
                      disabled={!canUsePromoBadge || !form.showPromoBadge}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-[14px] bg-[#6e7bf6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5e6dec] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving ? 'Saving service...' : editingId ? 'Save changes' : 'Create service'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Reset form
                    </button>
                  </div>
                </form>
              </div>
            </aside>

            <div className="grid gap-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <Sparkles size={14} />
                      Storefront preview
                    </div>

                    {showcaseService ? (
                      <>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusMeta(showcaseService.status).className}`}>
                            {getStatusMeta(showcaseService.status).label}
                          </span>
                          {showcaseService.isFeatured ? (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                              Featured
                            </span>
                          ) : null}
                          {showcaseService.showPromoBadge && showcaseService.promoBadgeText ? (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {showcaseService.promoBadgeText}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 text-[28px] font-semibold tracking-tight text-slate-950">
                          {showcaseService.name}
                        </div>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                          {showcaseService.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {showcaseService.category?.name || 'No category'}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatDeliveryMode(showcaseService.deliveryMode)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            Reply in {showcaseService.responseTimeHours}h
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {showcaseService.price
                              ? `${showcaseService.price} ${showcaseService.currencyCode}`
                              : 'Price on request'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 text-sm leading-7 text-slate-600">
                        Create the first service to preview how your offer will appear across public discovery and provider detail pages.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <Clock3 size={14} />
                      Service health
                    </div>
                    <div className="mt-4 grid gap-3">
                      {[
                        {
                          title: 'Published offers',
                          value: `${stats.published}/${stats.total || 0}`,
                          body: stats.total
                            ? 'The more request-ready services you publish, the easier it is for customers to compare and contact you.'
                            : 'Start with one clear published offer to support discovery.',
                        },
                        {
                          title: 'Draft backlog',
                          value: String(stats.draft),
                          body:
                            stats.draft > 0
                              ? 'Draft services still need sharper copy, pricing clarity, or a better delivery promise before they convert.'
                              : 'No draft backlog right now.',
                        },
                        {
                          title: 'Paused offers',
                          value: String(stats.paused),
                          body:
                            stats.paused > 0
                              ? 'Paused services are not helping discovery until reactivated.'
                              : 'No paused services are slowing the storefront.',
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                            <div className="text-sm font-semibold text-slate-500">{item.value}</div>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-600">{item.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Service inventory
                    </div>
                    <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-950">
                      Keep every offer clear, publishable, and easy to act on.
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Customers compare services faster when each card has one clear promise, one delivery mode, and one believable response expectation.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {FILTERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilter(item.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          filter === item.id
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!services.length ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <CirclePlus size={20} />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-slate-950">
                      No services exist yet.
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">
                      Create the first service to unlock customer requests and make the provider profile commercially useful.
                    </div>
                  </div>
                ) : !filteredServices.length ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm leading-7 text-slate-600">
                    No services match this filter right now.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 xl:grid-cols-2">
                    {filteredServices.map((service) => {
                      const statusMeta = getStatusMeta(service.status);
                      return (
                        <article
                          key={service.id}
                          className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[22px] font-semibold tracking-tight text-slate-950">
                                  {service.name}
                                </h3>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                  {statusMeta.label}
                                </span>
                                {service.isFeatured ? (
                                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                    Featured
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                <span>{service.category?.name || 'No category'}</span>
                                <span>•</span>
                                <span>{formatDeliveryMode(service.deliveryMode)}</span>
                                <span>•</span>
                                <span>Reply in {service.responseTimeHours}h</span>
                              </div>
                            </div>

                            {service.showPromoBadge && service.promoBadgeText ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                {service.promoBadgeText}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {service.price
                                ? `${service.price} ${service.currencyCode}`
                                : 'Price on request'}
                            </span>
                            {service.isFeatured ? (
                              <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700">
                                Priority visibility
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              onClick={() => handleEdit(service)}
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProviderServices;
