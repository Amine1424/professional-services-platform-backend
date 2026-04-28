import React from 'react';
import { ArrowRight, Award, BadgeCheck, Clock, Star, Zap } from 'lucide-react';
import { useI18n } from '../../i18n';
import { MarketplaceProviderCardItem } from './types';

interface MarketplaceFeaturedProvidersProps {
  providers: MarketplaceProviderCardItem[];
  loading?: boolean;
  onOpenProvider: (providerId: string) => void;
  onExploreAll: () => void;
}

const badgeConfig = {
  verified: {
    icon: BadgeCheck,
    label: 'Verified',
    className: 'bg-blue-100 text-blue-700',
  },
  top_rated: {
    icon: Award,
    label: 'Top Rated',
    className: 'bg-emerald-100 text-emerald-700',
  },
  fast_response: {
    icon: Clock,
    label: 'Fast Response',
    className: 'bg-amber-100 text-amber-700',
  },
} as const;

const formatPrice = (value?: number | null) => {
  if (!value || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat('en-DZ', {
    maximumFractionDigits: 0,
  }).format(value);
};

const fallbackProviderImage =
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80';

const MarketplaceFeaturedProviders: React.FC<MarketplaceFeaturedProvidersProps> = ({
  providers,
  loading = false,
  onOpenProvider,
  onExploreAll,
}) => {
  const { t } = useI18n();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{t('Featured Providers')}</h2>
            <p className="mt-1 text-slate-500">{t('Top-rated professionals in your area')}</p>
          </div>
          <button
            type="button"
            onClick={onExploreAll}
            className="group hidden items-center gap-1 text-sm font-medium text-slate-900 hover:underline sm:inline-flex"
          >
            {t('See all providers')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={`provider-card-skeleton-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="aspect-[16/10] animate-pulse bg-slate-200" />
                  <div className="p-4">
                    <div className="mt-6 h-4 w-32 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-2 h-3 w-48 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-slate-200" />
                  </div>
                </div>
              ))
            : providers.slice(0, 6).map((provider) => {
                const displayBadges: Array<'verified' | 'top_rated' | 'fast_response'> =
                  provider.badges?.length
                    ? provider.badges
                    : provider.verified
                      ? ['verified']
                      : [];

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => onOpenProvider(provider.id)}
                    className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={provider.image || fallbackProviderImage}
                        alt={`${provider.companyName} - ${provider.headline || provider.role}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {provider.startingPrice ? (
                        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-sm font-medium text-slate-950 backdrop-blur-sm">
                          {t('From')} {formatPrice(provider.startingPrice)} DZD
                        </div>
                      ) : null}
                    </div>

                    <div className="relative p-4">
                      <div className="absolute -top-8 left-4">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full border-[3px] border-white bg-white shadow-md">
                          <img
                            src={provider.avatarUrl || provider.image || fallbackProviderImage}
                            alt={provider.companyName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-slate-950">{provider.companyName}</h3>
                          {provider.verified ? (
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                          {provider.headline || provider.role}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-slate-950">
                              {provider.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">
                            ({provider.reviews} {t('reviews')})
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="line-clamp-1 text-sm text-slate-500">
                            {provider.location}
                          </span>
                        </div>

                        {displayBadges.length ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {displayBadges.slice(0, 3).map((badgeKey) => {
                              const config = badgeConfig[badgeKey];
                              const Icon = config.icon;

                              return (
                                <span
                                  key={badgeKey}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.className}`}
                                >
                                  <Icon className="h-3 w-3" />
                                  {t(config.label)}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}

                        {provider.responseTimeLabel ? (
                          <p className="mt-3 text-xs text-slate-500">{provider.responseTimeLabel}</p>
                        ) : provider.yearsOfExperience ? (
                          <p className="mt-3 text-xs text-slate-500">
                            {provider.yearsOfExperience}+ {t('years of experience')}
                          </p>
                        ) : null}

                        <div className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50">
                          <Zap className="mr-2 h-4 w-4" />
                          {t('View Profile')}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <button
            type="button"
            onClick={onExploreAll}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline"
          >
            {t('See all providers')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceFeaturedProviders;
