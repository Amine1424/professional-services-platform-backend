import React from 'react';
import { BadgeCheck, MapPin, Search, Star } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  MarketplaceCategorySelectItem,
  MarketplaceProviderCardItem,
} from './types';

interface MarketplaceHeroProps {
  serviceQuery: string;
  selectedRootCategoryId: string;
  selectedSubcategoryId: string;
  selectedRegion: string;
  selectedWilaya: string;
  rootCategories: MarketplaceCategorySelectItem[];
  subcategories: MarketplaceCategorySelectItem[];
  regions: string[];
  wilayas: string[];
  heroProvider?: MarketplaceProviderCardItem | null;
  onServiceQueryChange: (value: string) => void;
  onRootCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onWilayaChange: (value: string) => void;
  onSearch: () => void;
  onOpenHeroProvider?: () => void;
}

const fallbackHeroImage =
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80';

const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({
  serviceQuery,
  selectedRootCategoryId,
  selectedSubcategoryId,
  selectedRegion,
  selectedWilaya,
  rootCategories,
  subcategories,
  regions,
  wilayas,
  heroProvider,
  onServiceQueryChange,
  onRootCategoryChange,
  onSubcategoryChange,
  onRegionChange,
  onWilayaChange,
  onSearch,
  onOpenHeroProvider,
}) => {
  const { t } = useI18n();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/60 to-white pb-16 pt-12 lg:pb-24 lg:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {t('Find trusted local service providers')}
              </h1>
              <p className="max-w-lg text-lg text-slate-500">
                {t(
                  'Connect with verified professionals, compare trust signals, explore stories, and move into messaging or requests with confidence.'
                )}
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_1fr]">
                <div className="relative lg:col-span-3">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('What service do you need?')}
                    value={serviceQuery}
                    onChange={(event) => onServiceQueryChange(event.target.value)}
                    className="h-12 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedRootCategoryId}
                    onChange={(event) => onRootCategoryChange(event.target.value)}
                    className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  >
                    <option value="">{t('All Categories')}</option>
                    {rootCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {t(category.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={selectedSubcategoryId}
                    onChange={(event) => onSubcategoryChange(event.target.value)}
                    disabled={!selectedRootCategoryId || subcategories.length === 0}
                    className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {selectedRootCategoryId ? t('All Subcategories') : t('Select category first')}
                    </option>
                    {subcategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {t(category.label || category.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedRegion}
                    onChange={(event) => onRegionChange(event.target.value)}
                    className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  >
                    <option value="">{t('All Regions')}</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedWilaya}
                    onChange={(event) => onWilayaChange(event.target.value)}
                    disabled={!selectedRegion || wilayas.length === 0}
                    className="h-12 w-full appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {selectedRegion ? t('All Wilayas') : t('Select region first')}
                    </option>
                    {wilayas.map((wilaya) => (
                      <option key={wilaya} value={wilaya}>
                        {wilaya}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-slate-900 px-8 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {t('Search')}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="h-5 w-5 text-sky-600" />
                <span>{t('Verified providers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span>{t('Top-rated professionals')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-900">Marketplace</span>
                <span>{t('search -> trust -> conversation -> request')}</span>
              </div>
            </div>
          </div>

          {heroProvider ? (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={onOpenHeroProvider}
                className="group block w-full overflow-hidden rounded-2xl text-left shadow-2xl transition-transform hover:scale-[1.02]"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={heroProvider.image || fallbackHeroImage}
                    alt={`${heroProvider.companyName} - ${heroProvider.headline || heroProvider.role}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg">
                        <img
                          src={heroProvider.avatarUrl || heroProvider.image || fallbackHeroImage}
                          alt={heroProvider.companyName}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-white">
                            {heroProvider.companyName}
                          </h3>
                          {heroProvider.verified ? (
                            <BadgeCheck className="h-5 w-5 shrink-0 text-blue-400" />
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-white/80">
                          {heroProvider.headline || heroProvider.role}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-white">
                              {heroProvider.rating.toFixed(1)}
                            </span>
                            <span className="text-sm text-white/60">({heroProvider.reviews})</span>
                          </div>
                          <span className="text-white/40">|</span>
                          <span className="truncate text-sm text-white/80">
                            {heroProvider.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {heroProvider.badges?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {heroProvider.badges.slice(0, 3).map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                          >
                            {badge.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>

              <div className="absolute -right-4 -top-4 -z-10 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 -z-10 h-64 w-64 rounded-full bg-slate-100 blur-3xl" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceHero;
