import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Sparkles, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import {
  getBranchSubcategories,
  getRootCategories,
  getRootCategoryId,
  MarketplaceCategory,
} from '../lib/categories';
import '../styles/app-primitives.css';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price?: string | null;
  currencyCode: string;
  status: 'draft' | 'published' | 'paused';
  deliveryMode: 'online' | 'on_site' | 'hybrid';
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

const emptyForm = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  currencyCode: 'DZD',
  status: 'draft' as 'draft' | 'published' | 'paused',
  deliveryMode: 'on_site' as 'online' | 'on_site' | 'hybrid',
  responseTimeHours: 24,
  isFeatured: false,
  showPromoBadge: false,
  promoBadgeText: '',
};

const ProviderServices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [preferenceData, setPreferenceData] = useState<PreferencePayload | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'paused'>('all');
  const [form, setForm] = useState(emptyForm);

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

  const showcaseService = useMemo(() => {
    return (
      services.find((service) => service.status === 'published' && service.isFeatured) ||
      services.find((service) => service.status === 'published') ||
      services[0] ||
      null
    );
  }, [services]);

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[240px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[340px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{editingId ? 'Edit service' : 'Create service'}</h2>
              <div className="psp-surface__sub">
                Services should be concrete, customer-facing, and easy to request.
              </div>
            </div>
          </div>

          <div className="mb-5 grid gap-3 rounded-[24px] bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-600">
              Current plan:{' '}
              <strong className="text-slate-900">
                {preferenceData?.preference.selectedPlan || 'basic'}
              </strong>
            </div>
            <div className="text-sm text-slate-600">
              Featured services:{' '}
              {preferenceData?.planFeatures.canFeatureServices
                ? 'available'
                : 'requires Pro or Business'}
            </div>
            <div className="text-sm text-slate-600">
              Promo badges:{' '}
              {preferenceData?.planFeatures.canUseServicePromoBadge
                ? 'available'
                : 'requires Pro or Business'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Service name</div>
              <input name="name" value={form.name} onChange={handleChange} className="psp-input" />
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Description</div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="psp-textarea"
                placeholder="Explain what the customer gets, what is included, and the expected result."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Main category</div>
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
                <div className="mb-2 text-sm font-bold text-slate-700">Subcategory</div>
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
                        : 'No subcategories under this main category'}
                  </option>
                  {branchSubcategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_120px]">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Price</div>
                <input name="price" value={form.price} onChange={handleChange} className="psp-input" />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Currency</div>
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
                <div className="mb-2 text-sm font-bold text-slate-700">Status</div>
                <select name="status" value={form.status} onChange={handleChange} className="psp-select">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="paused">paused</option>
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Delivery mode</div>
                <select
                  name="deliveryMode"
                  value={form.deliveryMode}
                  onChange={handleChange}
                  className="psp-select"
                >
                  <option value="on_site">on_site</option>
                  <option value="online">online</option>
                  <option value="hybrid">hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Response time in hours</div>
              <input
                type="number"
                name="responseTimeHours"
                value={form.responseTimeHours}
                onChange={handleChange}
                className="psp-input"
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
              Mark this service as featured
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="showPromoBadge"
                checked={form.showPromoBadge}
                onChange={handleChange}
              />
              Show promo badge on service card
            </label>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Promo badge text</div>
              <input
                name="promoBadgeText"
                value={form.promoBadgeText}
                onChange={handleChange}
                className="psp-input"
                placeholder="Fast delivery / Limited offer / New"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="psp-button psp-button--primary">
                {saving ? 'Saving service...' : editingId ? 'Save changes' : 'Create service'}
              </button>
              <button type="button" className="psp-button psp-button--secondary" onClick={resetForm}>
                Reset form
              </button>
            </div>
          </form>
        </article>

        <div className="grid gap-6">
          <section className="psp-stat-grid">
            {[
              { label: 'Total', value: stats.total, icon: Layers3, caption: 'All services in the workspace.' },
              {
                label: 'Published',
                value: stats.published,
                icon: Sparkles,
                caption: 'Visible to customers right now.',
              },
              { label: 'Draft', value: stats.draft, icon: Tag, caption: 'Needs refinement before publishing.' },
              {
                label: 'Featured',
                value: stats.featured,
                icon: Sparkles,
                caption: 'Promoted offers with stronger visibility.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{item.label}</div>
                  <div className="psp-stat-card__value">{item.value}</div>
                  <div className="psp-stat-card__caption">{item.caption}</div>
                </article>
              );
            })}
          </section>

          <section className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>Storefront services</h2>
                <div className="psp-surface__sub">
                  Services are the commercial layer of the provider account. Keep them request-ready and easy to compare.
                </div>
              </div>
            </div>

            <div className="mb-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Public storefront preview
                </div>
                {showcaseService ? (
                  <>
                    <div className="mt-3 text-[26px] font-black tracking-tight text-slate-900">
                      {showcaseService.name}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">
                      {showcaseService.description}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {showcaseService.category?.name || 'No category'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {showcaseService.deliveryMode}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        Reply in {showcaseService.responseTimeHours}h
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-sm text-slate-600">
                    Create the first service to preview how your offer will appear on the public profile.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 rounded-[24px] bg-slate-50 p-5">
                {[
                  ['all', 'All services'],
                  ['published', 'Published'],
                  ['draft', 'Drafts'],
                  ['paused', 'Paused'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key as 'all' | 'published' | 'draft' | 'paused')}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      filter === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {!services.length ? (
              <div className="psp-empty-state">
                No services exist yet. Create the first service to unlock customer requests.
              </div>
            ) : !filteredServices.length ? (
              <div className="psp-empty-state">No services match this filter right now.</div>
            ) : (
              <div className="psp-card-grid">
                {filteredServices.map((service) => (
                  <article key={service.id} className="psp-card">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="psp-card__title">{service.name}</h3>
                      {service.isFeatured ? (
                        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                          Featured
                        </span>
                      ) : null}
                      {service.showPromoBadge && service.promoBadgeText ? (
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                          {service.promoBadgeText}
                        </span>
                      ) : null}
                    </div>

                    <div className="psp-card__meta">
                      {service.category?.name || 'No category'} | {service.deliveryMode} | {service.status}
                    </div>
                    <div className="psp-card__description">{service.description}</div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {service.price ? `${service.price} ${service.currencyCode}` : 'Price on request'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Reply in {service.responseTimeHours}h
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="psp-button psp-button--secondary"
                        onClick={() => handleEdit(service)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="psp-button psp-button--danger"
                        onClick={() => handleDelete(service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};

export default ProviderServices;
