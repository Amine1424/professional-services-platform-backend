import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BadgeCheck,
  Grid3X3,
  List,
  MapPin,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import CustomerWorkspaceTopNav from '../components/customer/CustomerWorkspaceTopNav';
import PublicExploreChrome from '../components/public-entry/PublicExploreChrome';
import {
  getBranchSubcategories,
  getCategoryLookup,
  getRootCategories,
  getRootCategoryId,
  MarketplaceCategory,
  normalizeCategoryValue,
  resolveCategoryId as resolveMarketplaceCategoryId,
} from '../lib/categories';
import { ALGERIA_WILAYAS, MARKET_REGIONS } from '../lib/algeria';
import { useI18n } from '../i18n';
import { getStoredUser } from '../lib/role-routing';

type ProviderResult = {
  id: string;
  companyName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  averageRating?: number | string | null;
  reviewsCount?: number | string | null;
  isVerified?: boolean;
  yearsOfExperience?: number | null;
  responseTimeMinutes?: number | null;
  profileBadgeText?: string | null;
  featuredOnHomepage?: boolean;
  primaryCategory?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  servicesPreview?: Array<{
    id: string;
    name: string;
    price?: string | null;
    currencyCode?: string | null;
    promoBadgeText?: string | null;
    showPromoBadge?: boolean;
  }>;
  serviceCoverage?: {
    mode: 'wilaya_only' | 'regional' | 'nationwide';
    label: string;
    regions: string[];
  };
};

type ExploreFilters = {
  query: string;
  city: string;
  region: string;
  wilaya: string;
  category: string;
  sort: 'featured' | 'verified' | 'rating';
};

const defaultFilters: ExploreFilters = {
  query: '',
  city: '',
  region: '',
  wilaya: '',
  category: '',
  sort: 'featured',
};

const readFiltersFromParams = (searchParams: URLSearchParams): ExploreFilters => ({
  query: searchParams.get('q') || searchParams.get('query') || '',
  city: searchParams.get('city') || searchParams.get('loc') || searchParams.get('location') || '',
  region: searchParams.get('region') || '',
  wilaya: searchParams.get('wilaya') || '',
  category: searchParams.get('category') || searchParams.get('cat') || '',
  sort:
    searchParams.get('sort') === 'verified' || searchParams.get('sort') === 'rating'
      ? (searchParams.get('sort') as ExploreFilters['sort'])
      : 'featured',
});

const buildSearchParams = (filters: ExploreFilters) => {
  const params = new URLSearchParams();

  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.city.trim()) params.set('city', filters.city.trim());
  if (filters.region.trim()) params.set('region', filters.region.trim());
  if (filters.wilaya.trim()) params.set('wilaya', filters.wilaya.trim());
  if (filters.category.trim()) params.set('category', filters.category.trim());
  if (filters.sort !== 'featured') params.set('sort', filters.sort);

  return params;
};

const getProviderIntentLink = (providerId: string, intent: 'message' | 'request') =>
  `/providers/${providerId}?intent=${intent}`;

const CustomerExplore: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);
  const isStandalone = !location.pathname.startsWith('/customer/');

  const activeFilters = useMemo(() => readFiltersFromParams(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState<ExploreFilters>(activeFilters);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minimumRating, setMinimumRating] = useState('');

  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);
  const categoryLookup = useMemo(() => getCategoryLookup(categories), [categories]);
  const activeCategoryId = useMemo(
    () => resolveMarketplaceCategoryId(categories, activeFilters.category),
    [activeFilters.category, categories]
  );
  const selectedRootCategoryId = useMemo(
    () => getRootCategoryId(categories, activeCategoryId) || '',
    [activeCategoryId, categories]
  );
  const branchSubcategories = useMemo(
    () =>
      selectedRootCategoryId
        ? getBranchSubcategories(categories, selectedRootCategoryId)
        : [],
    [categories, selectedRootCategoryId]
  );
  const draftRootCategoryId = useMemo(
    () =>
      getRootCategoryId(
        categories,
        resolveMarketplaceCategoryId(categories, draftFilters.category)
      ) || '',
    [categories, draftFilters.category]
  );

  useEffect(() => {
    setDraftFilters(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const response = await api.get('/discovery/categories');
        if (!active) return;
        setCategories(response.data?.data || []);
      } catch {
        if (!active) return;
        setCategories([]);
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loadingCategories) return;

    let active = true;

    const loadResults = async () => {
      try {
        setLoadingResults(true);
        setError(null);

        const response = await api.get('/discovery/search', {
          params: {
            query: activeFilters.query.trim() || undefined,
            location: activeFilters.city.trim() || undefined,
            region: activeFilters.region.trim() || undefined,
            wilaya: activeFilters.wilaya.trim() || undefined,
            categoryId:
              resolveMarketplaceCategoryId(categories, activeFilters.category) || undefined,
          },
        });

        if (!active) return;
        setProviders(response.data?.data || []);
      } catch (requestError: any) {
        if (!active) return;
        setProviders([]);
        setError(requestError.response?.data?.message || t('Failed to load discovery results.'));
      } finally {
        if (active) {
          setLoadingResults(false);
        }
      }
    };

    void loadResults();

    return () => {
      active = false;
    };
  }, [activeFilters, categories, loadingCategories, t]);

  const rankedProviders = useMemo(() => {
    const results = [...providers];

    return results.sort((left, right) => {
      const leftFeatured = left.featuredOnHomepage ? 1 : 0;
      const rightFeatured = right.featuredOnHomepage ? 1 : 0;
      const leftVerified = left.isVerified ? 1 : 0;
      const rightVerified = right.isVerified ? 1 : 0;
      const leftRating = Number(left.averageRating || 0);
      const rightRating = Number(right.averageRating || 0);
      const leftReviews = Number(left.reviewsCount || 0);
      const rightReviews = Number(right.reviewsCount || 0);
      const leftResponse = Number(left.responseTimeMinutes || 9999);
      const rightResponse = Number(right.responseTimeMinutes || 9999);
      const leftWilayaBoost =
        activeFilters.wilaya &&
        normalizeCategoryValue(left.wilaya || '') ===
          normalizeCategoryValue(activeFilters.wilaya)
          ? 1
          : 0;
      const rightWilayaBoost =
        activeFilters.wilaya &&
        normalizeCategoryValue(right.wilaya || '') ===
          normalizeCategoryValue(activeFilters.wilaya)
          ? 1
          : 0;
      const leftRegionBoost =
        activeFilters.region &&
        normalizeCategoryValue(left.region || '') ===
          normalizeCategoryValue(activeFilters.region)
          ? 1
          : 0;
      const rightRegionBoost =
        activeFilters.region &&
        normalizeCategoryValue(right.region || '') ===
          normalizeCategoryValue(activeFilters.region)
          ? 1
          : 0;

      if (activeFilters.sort === 'verified') {
        return (
          rightWilayaBoost - leftWilayaBoost ||
          rightRegionBoost - leftRegionBoost ||
          rightVerified - leftVerified ||
          rightRating - leftRating ||
          rightReviews - leftReviews ||
          leftResponse - rightResponse
        );
      }

      if (activeFilters.sort === 'rating') {
        return (
          rightWilayaBoost - leftWilayaBoost ||
          rightRegionBoost - leftRegionBoost ||
          rightRating - leftRating ||
          rightReviews - leftReviews ||
          rightVerified - leftVerified ||
          leftResponse - rightResponse
        );
      }

      return (
        rightWilayaBoost - leftWilayaBoost ||
        rightRegionBoost - leftRegionBoost ||
        rightFeatured - leftFeatured ||
        rightVerified - leftVerified ||
        rightRating - leftRating ||
        rightReviews - leftReviews ||
        leftResponse - rightResponse
      );
    });
  }, [activeFilters.region, activeFilters.sort, activeFilters.wilaya, providers]);

  const filteredProviders = useMemo(
    () =>
      rankedProviders.filter((provider) => {
        const providerRating = Number(provider.averageRating || 0);
        if (verifiedOnly && !provider.isVerified) return false;
        if (featuredOnly && !provider.featuredOnHomepage) return false;
        if (minimumRating && providerRating < Number(minimumRating)) return false;
        return true;
      }),
    [featuredOnly, minimumRating, rankedProviders, verifiedOnly]
  );

  const executeSearch = (filters: ExploreFilters) => {
    setSearchParams(buildSearchParams(filters));
  };

  const resetAll = () => {
    setDraftFilters(defaultFilters);
    setSearchParams(new URLSearchParams());
    setVerifiedOnly(false);
    setFeaturedOnly(false);
    setMinimumRating('');
  };

  const openIntentFlow = (providerId: string, intent: 'message' | 'request') => {
    const target = getProviderIntentLink(providerId, intent);

    if (currentUser?.role === 'customer') {
      navigate(target);
      return;
    }

    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    navigate(`/providers/${providerId}`);
  };

  const activeFilterChips = [
    activeFilters.query ? { key: 'query', label: activeFilters.query, clear: () => executeSearch({ ...activeFilters, query: '' }) } : null,
    activeFilters.city ? { key: 'city', label: activeFilters.city, clear: () => executeSearch({ ...activeFilters, city: '' }) } : null,
    activeFilters.region ? { key: 'region', label: activeFilters.region, clear: () => executeSearch({ ...activeFilters, region: '' }) } : null,
    activeFilters.wilaya ? { key: 'wilaya', label: activeFilters.wilaya, clear: () => executeSearch({ ...activeFilters, wilaya: '' }) } : null,
    activeCategoryId
      ? {
          key: 'category',
          label: categoryLookup.get(activeCategoryId)?.name || activeFilters.category,
          clear: () => executeSearch({ ...activeFilters, category: '' }),
        }
      : null,
    verifiedOnly ? { key: 'verified', label: t('Verified only'), clear: () => setVerifiedOnly(false) } : null,
    featuredOnly ? { key: 'featured', label: t('Featured'), clear: () => setFeaturedOnly(false) } : null,
    minimumRating
      ? {
          key: 'rating',
          label: `${minimumRating}+ ${t('Stars')}`,
          clear: () => setMinimumRating(''),
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>;

  const renderProviderCard = (provider: ProviderResult) => {
    const headline = provider.primaryCategory?.name
      ? `${provider.primaryCategory.name}${provider.yearsOfExperience ? ` • ${provider.yearsOfExperience} ${t('years')}` : ''}`
      : t('Professional services');
    const locationLabel =
      [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') || t('Algeria');
    const displayPrice =
      provider.servicesPreview?.find((service) => service.price)?.price || null;
    const cardImage =
      provider.avatarUrl ||
      provider.coverUrl ||
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=300&q=80';

    if (viewMode === 'grid') {
      return (
        <article
          key={provider.id}
          className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div className="relative mb-4 h-44 overflow-hidden rounded-lg">
            <img src={cardImage} alt={provider.companyName} className="h-full w-full object-cover" />
            {provider.isVerified ? (
              <div className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {provider.companyName}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{headline}</p>
              </div>
              {displayPrice ? (
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-400">{t('From')}</p>
                  <p className="text-sm font-semibold text-slate-900">{displayPrice}</p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-slate-900">
                  {Number(provider.averageRating || 0).toFixed(1)}
                </span>
                <span className="text-slate-500">({Number(provider.reviewsCount || 0)})</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>{locationLabel}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {provider.profileBadgeText ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {provider.profileBadgeText}
                </span>
              ) : null}
              {provider.serviceCoverage?.label ? (
                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  {provider.serviceCoverage.label}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                to={`/providers/${provider.id}`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t('View profile')}
              </Link>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-slate-900"
                onClick={() => openIntentFlow(provider.id, 'message')}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" />
                {t('Message')}
              </button>
            </div>
          </div>
        </article>
      );
    }

    return (
      <article
        key={provider.id}
        className="group flex gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <img src={cardImage} alt={provider.companyName} className="h-full w-full object-cover" />
          {provider.isVerified ? (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-500">
              <BadgeCheck className="h-3.5 w-3.5 text-white" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900">{provider.companyName}</h3>
              <p className="mt-0.5 truncate text-sm text-slate-500">{headline}</p>
            </div>
            {displayPrice ? (
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400">{t('From')}</p>
                <p className="font-semibold text-slate-900">{displayPrice}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-900">
                {Number(provider.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-slate-500">({Number(provider.reviewsCount || 0)})</span>
            </div>

            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationLabel}</span>
            </div>

            {provider.responseTimeMinutes ? (
              <span className="hidden text-slate-500 sm:inline">
                {t('Reply in')} {provider.responseTimeMinutes} {t('min')}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {provider.profileBadgeText ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {provider.profileBadgeText}
              </span>
            ) : null}
            {(provider.servicesPreview?.length
              ? provider.servicesPreview.slice(0, 2).map((service) => service.name)
              : [provider.primaryCategory?.name || t('Services')]).map((item) => (
              <span
                key={`${provider.id}-${item}`}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to={`/providers/${provider.id}`}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('View profile')}
            </Link>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-slate-900"
              onClick={() => openIntentFlow(provider.id, 'message')}
            >
              <MessageSquare className="mr-1.5 h-4 w-4" />
              {t('Message')}
            </button>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              onClick={() => openIntentFlow(provider.id, 'request')}
            >
              {t('Request service')}
            </button>
          </div>
        </div>
      </article>
    );
  };

  const content = (
    <div className="min-h-screen bg-white">
      {!isStandalone ? <CustomerWorkspaceTopNav currentPage="explore" variant="v0" /> : null}

      <div className="border-b border-slate-200 bg-white/70">
        <div className="psp-desktop-frame py-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              executeSearch(draftFilters);
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder={t('What service do you need?')}
                value={draftFilters.query}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, query: event.target.value }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="relative sm:w-52">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={draftFilters.city}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, city: event.target.value }))
                }
                placeholder={t('All locations')}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:w-56">
              <select
                value={draftRootCategoryId}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, category: event.target.value }))
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">{t('All categories')}</option>
                {rootCategories.map((category) => (
                  <option key={category.id} value={category.slug || category.id}>
                    {t(category.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                {t('Search')}
              </button>
              <button
                type="button"
                className={`inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors ${
                  filtersOpen
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-slate-900'
                }`}
                onClick={() => setFiltersOpen((current) => !current)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('Filters')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="psp-desktop-frame py-6">
        <div className="flex gap-6">
          <aside
            className={`hidden shrink-0 lg:block lg:w-72 ${
              filtersOpen ? '' : 'lg:hidden'
            }`}
          >
            <div className="sticky top-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{t('Filters')}</h3>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {t('Reset')}
                </button>
              </div>

              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">{t('Categories')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {rootCategories.map((category) => {
                      const active = selectedRootCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-slate-900'
                          }`}
                          onClick={() =>
                            executeSearch({
                              ...activeFilters,
                              category: category.slug || category.id,
                            })
                          }
                        >
                          {t(category.name)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedRootCategoryId && branchSubcategories.length ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-900">{t('Subcategories')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {branchSubcategories.map((category) => {
                        const active = activeCategoryId === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-slate-900'
                            }`}
                            onClick={() =>
                              executeSearch({
                                ...activeFilters,
                                category: category.slug || category.id,
                              })
                            }
                          >
                            {t(category.label)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">{t('Location')}</h4>
                  <select
                    value={draftFilters.region}
                    onChange={(event) =>
                      setDraftFilters((current) => ({ ...current, region: event.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{t('All marketplace regions')}</option>
                    {MARKET_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {t(region)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={draftFilters.wilaya}
                    onChange={(event) =>
                      setDraftFilters((current) => ({ ...current, wilaya: event.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">{t('All wilayas')}</option>
                    {ALGERIA_WILAYAS.map((wilaya) => (
                      <option key={wilaya} value={wilaya}>
                        {t(wilaya)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    onClick={() => executeSearch(draftFilters)}
                  >
                    {t('Apply Filters')}
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">{t('Trust Signals')}</h4>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(event) => setVerifiedOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    {t('Verified only')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={featuredOnly}
                      onChange={(event) => setFeaturedOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                    />
                    {t('Featured')}
                  </label>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-900">{t('Minimum Rating')}</h4>
                  {['4.5', '4.0', '3.5'].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="minimumRating"
                        value={rating}
                        checked={minimumRating === rating}
                        onChange={(event) => setMinimumRating(event.target.value)}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-200"
                      />
                      {rating}+ {t('Stars')}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {filtersOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setFiltersOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 max-w-full overflow-y-auto bg-white p-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{t('Filters')}</h3>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(false)}
                      className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
                      onClick={() => {
                        resetAll();
                        setFiltersOpen(false);
                      }}
                    >
                      {t('Reset')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"
                      onClick={() => {
                        executeSearch(draftFilters);
                        setFiltersOpen(false);
                      }}
                    >
                      {t('Apply Filters')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {filteredProviders.length} {t(filteredProviders.length === 1 ? 'provider' : 'providers')} {t('found')}
                </h1>
                <p className="text-sm text-slate-500">{t('Showing results for your search')}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={activeFilters.sort}
                    onChange={(event) =>
                      executeSearch({
                        ...activeFilters,
                        sort: event.target.value as ExploreFilters['sort'],
                      })
                    }
                    className="h-9 rounded-md border border-slate-200 bg-white pl-8 pr-8 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="featured">{t('Most Relevant')}</option>
                    <option value="verified">{t('Verified first')}</option>
                    <option value="rating">{t('Highest rated')}</option>
                  </select>
                </div>

                <div className="hidden items-center rounded-md border border-slate-200 sm:flex">
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-r-none ${
                      viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-l-none ${
                      viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {activeFilterChips.length > 0 ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">{t('Active filters:')}</span>
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {chip.label}
                    <button type="button" onClick={chip.clear} className="rounded-full p-0.5 hover:bg-slate-200">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {t('Clear all')}
                </button>
              </div>
            ) : null}

            {loadingResults ? (
              <div
                className={
                  viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'
                }
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`explore-skeleton-${index}`}
                    className="h-36 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                <div className="font-semibold">{t('Discovery search failed.')}</div>
                <div className="mt-1">{error}</div>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  onClick={() => executeSearch(activeFilters)}
                >
                  {t('Retry search')}
                </button>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <div className="font-semibold text-slate-700">
                  {t('No providers matched the current filters.')}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {t('Try removing the local filters or search with broader service terms.')}
                </div>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:text-slate-900"
                  onClick={resetAll}
                >
                  {t('Clear filters')}
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}>
                  {filteredProviders.map((provider) => renderProviderCard(provider))}
                </div>

                <div className="mt-12 border-t border-slate-200 pt-8">
                  <h2 className="mb-3 text-sm font-medium text-slate-900">
                    {t('Browse by category')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {rootCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          executeSearch({
                            ...activeFilters,
                            category: category.slug || category.id,
                          })
                        }
                        className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                      >
                        {t(category.name)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return <PublicExploreChrome>{content}</PublicExploreChrome>;
  }

  return content;
};

export default CustomerExplore;
