import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Filter,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import PublicMarketplaceLayout from '../components/PublicMarketplaceLayout';
import {
  getBranchSubcategories,
  getCategoryLookup,
  getRootCategories,
  getRootCategoryId,
  MarketplaceCategory,
  normalizeCategoryValue,
  resolveCategoryId as resolveMarketplaceCategoryId,
} from '../lib/categories';
import {
  ALGERIA_WILAYAS,
  buildGoogleMapsSearchUrl,
  MARKET_REGIONS,
} from '../lib/algeria';
import '../styles/app-primitives.css';
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
  const currentUser = useMemo(() => getStoredUser(), []);
  const isStandalone = !location.pathname.startsWith('/customer/');

  const activeFilters = useMemo(() => readFiltersFromParams(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState<ExploreFilters>(activeFilters);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(requestError.response?.data?.message || 'Failed to load discovery results.');
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
  }, [activeFilters, categories, loadingCategories]);

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

  const selectedCategoryName = useMemo(() => {
    return categoryLookup.get(activeCategoryId)?.name || '';
  }, [activeCategoryId, categoryLookup]);

  const activeLocationLabel = [activeFilters.city, activeFilters.wilaya, activeFilters.region]
    .filter(Boolean)
    .join(', ');

  const executeSearch = (filters: ExploreFilters) => {
    setSearchParams(buildSearchParams(filters));
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setSearchParams(new URLSearchParams());
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

  const pageContent = (
    <div className={isStandalone ? 'grid gap-8 pt-8' : 'psp-page-stack'}>
      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
            <Sparkles size={14} />
            Local-first Algerian discovery
          </div>
          <h1 className="mt-4 text-[32px] font-black tracking-tight text-slate-900 md:text-[44px]">
            Search providers with local precision
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-8 text-slate-500">
            Discovery is now structured around Algeria-specific geography. Search by service need,
            city, region, wilaya, and category without losing deep-linking or ranking quality.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.85fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={draftFilters.query}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, query: event.target.value }))
                }
                placeholder="Search by service, skill, or category"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <MapPin size={18} className="text-slate-400" />
              <input
                value={draftFilters.city}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, city: event.target.value }))
                }
                placeholder="City / Commune / Locality"
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={draftRootCategoryId}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">All categories</option>
              {rootCategories.map((category) => (
                <option key={category.id} value={category.slug || category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => executeSearch(draftFilters)}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <select
              value={draftFilters.region}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, region: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">All marketplace regions</option>
              {MARKET_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={draftFilters.wilaya}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, wilaya: event.target.value }))
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">All wilayas</option>
              {ALGERIA_WILAYAS.map((wilaya) => (
                <option key={wilaya} value={wilaya}>
                  {wilaya}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Active search</h2>
              <div className="psp-surface__sub">
                The current URL already preserves filters and ranking. Adjust, search, and share
                the same state without losing context.
              </div>
            </div>
            <button
              type="button"
              className="psp-button psp-button--secondary"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          <div className="psp-detail-grid">
            <div className="psp-detail-item">
              <div className="psp-detail-item__label">Query</div>
              <div className="psp-detail-item__value">
                {activeFilters.query || 'Any service need'}
              </div>
            </div>
            <div className="psp-detail-item">
              <div className="psp-detail-item__label">Local focus</div>
              <div className="psp-detail-item__value">
                {activeLocationLabel || 'All Algeria'}
              </div>
            </div>
            <div className="psp-detail-item">
              <div className="psp-detail-item__label">Category</div>
              <div className="psp-detail-item__value">
                {selectedCategoryName || 'All categories'}
              </div>
            </div>
            <div className="psp-detail-item">
              <div className="psp-detail-item__label">Ranking</div>
              <div className="psp-detail-item__value capitalize">{activeFilters.sort}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Filters and ranking</h2>
            <div className="psp-surface__sub">
              Narrow the visible provider set first, then switch ranking once the shortlist is
              close to the right scope.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
            <Filter size={14} />
            {rankedProviders.length} provider{rankedProviders.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Categories
            </div>
            <div className="psp-chip-row">
              <button
                type="button"
                className={`psp-chip ${!activeCategoryId ? 'psp-chip--active' : ''}`}
                onClick={() => executeSearch({ ...activeFilters, category: '' })}
              >
                All categories
              </button>
              {rootCategories.map((category) => {
                const isActive = selectedRootCategoryId === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`psp-chip ${isActive ? 'psp-chip--active' : ''}`}
                    onClick={() =>
                      executeSearch({
                        ...activeFilters,
                        category: category.slug || category.id,
                      })
                    }
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>

            {selectedRootCategoryId && branchSubcategories.length ? (
              <>
                <div className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Subcategories
                </div>
                <div className="psp-chip-row">
                  <button
                    type="button"
                    className={`psp-chip ${
                      activeCategoryId === selectedRootCategoryId ? 'psp-chip--active' : ''
                    }`}
                    onClick={() =>
                      executeSearch({
                        ...activeFilters,
                        category: selectedRootCategoryId,
                      })
                    }
                  >
                    All in this main category
                  </button>
                  {branchSubcategories.map((category) => {
                    const isActive = activeCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={`psp-chip ${isActive ? 'psp-chip--active' : ''}`}
                        onClick={() =>
                          executeSearch({
                            ...activeFilters,
                            category: category.slug || category.id,
                          })
                        }
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>

          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Sort by
            </div>
            <div className="psp-chip-row">
              {[
                { key: 'featured', label: 'Featured first' },
                { key: 'verified', label: 'Verified first' },
                { key: 'rating', label: 'Highest rated' },
              ].map((sortOption) => (
                <button
                  key={sortOption.key}
                  type="button"
                  className={`psp-chip ${
                    activeFilters.sort === sortOption.key ? 'psp-chip--active' : ''
                  }`}
                  onClick={() =>
                    executeSearch({
                      ...activeFilters,
                      sort: sortOption.key as ExploreFilters['sort'],
                    })
                  }
                >
                  {sortOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="psp-page-stack">
        {loadingResults ? (
          <div className="psp-card-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`explore-skeleton-${index}`}
                className="h-[320px] animate-pulse rounded-[28px] bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.06)]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="psp-error-state">
            <div className="font-bold">Discovery search failed.</div>
            <div>{error}</div>
            <button
              type="button"
              className="psp-button psp-button--primary mt-4"
              onClick={() => executeSearch(activeFilters)}
            >
              Retry search
            </button>
          </div>
        ) : rankedProviders.length === 0 ? (
          <div className="psp-empty-state">
            <div className="font-bold text-slate-700">No providers matched the current filters.</div>
            <div>
              Try removing the local filters or search with broader service terms.
            </div>
            <button
              type="button"
              className="psp-button psp-button--secondary mt-4"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="psp-card-grid">
            {rankedProviders.map((provider) => (
              <article key={provider.id} className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_24px_45px_rgba(15,23,42,0.08)]">
                <div className="relative h-[210px]">
                  <img
                    src={
                      provider.coverUrl ||
                      provider.avatarUrl ||
                      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80'
                    }
                    alt={provider.companyName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.64))]" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {provider.featuredOnHomepage ? (
                      <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                        Featured
                      </span>
                    ) : null}
                    {provider.profileBadgeText ? (
                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        {provider.profileBadgeText}
                      </span>
                    ) : null}
                  </div>
                </div>

                  <div className="grid gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[24px] font-black tracking-tight text-slate-900">
                        {provider.companyName}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={14} />
                          {[provider.city, provider.wilaya, provider.region]
                            .filter(Boolean)
                            .join(', ') || 'Algeria'}
                        </span>
                        {provider.serviceCoverage?.label ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                            {provider.serviceCoverage.label}
                          </span>
                        ) : null}
                        {provider.isVerified ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                            <BadgeCheck size={14} />
                            Verified
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Rating
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-lg font-black text-slate-900">
                        <Star size={16} fill="currentColor" className="text-amber-400" />
                        {Number(provider.averageRating || 0).toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="psp-summary-strip">
                    <span className="psp-summary-chip">
                      <strong>{provider.primaryCategory?.name || 'General services'}</strong>
                      category
                    </span>
                    <span className="psp-summary-chip">
                      <strong>{Number(provider.reviewsCount || 0)}</strong>
                      reviews
                    </span>
                    <span className="psp-summary-chip">
                      <Clock3 size={14} />
                      <strong>{provider.responseTimeMinutes || 0} min</strong>
                      first reply
                    </span>
                    <span className="psp-summary-chip">
                      <strong>{provider.serviceCoverage?.label || 'Declared on profile'}</strong>
                      reach
                    </span>
                    <span className="psp-summary-chip">
                      <strong>{provider.yearsOfExperience || 0} years</strong>
                      experience
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Service preview
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(provider.servicesPreview?.length
                        ? provider.servicesPreview
                        : [{ id: `${provider.id}-fallback`, name: 'Open provider profile for services' }]
                      ).map((service) => (
                        <span key={service.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link to={`/providers/${provider.id}`} className="psp-button psp-button--primary">
                      View profile
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      type="button"
                      className="psp-button psp-button--secondary"
                      onClick={() => openIntentFlow(provider.id, 'message')}
                    >
                      <MessageCircle size={16} />
                      Message
                    </button>
                    <button
                      type="button"
                      className="psp-button psp-button--secondary"
                      onClick={() => openIntentFlow(provider.id, 'request')}
                    >
                      Request service
                    </button>
                    <a
                      href={buildGoogleMapsSearchUrl(
                        `${provider.companyName} ${provider.city || ''} ${provider.wilaya || ''} Algeria`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="psp-control-pill"
                    >
                      Open map
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  if (isStandalone) {
    return <PublicMarketplaceLayout activeNav="explore">{pageContent}</PublicMarketplaceLayout>;
  }

  return pageContent;
};

export default CustomerExplore;
