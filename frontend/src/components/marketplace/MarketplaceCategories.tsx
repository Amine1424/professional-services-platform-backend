import React from 'react';
import {
  ArrowRight,
  Droplets,
  Home,
  Paintbrush,
  Sparkles,
  Thermometer,
  TreePine,
  Truck,
  Zap,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { MarketplaceCategoryCardItem } from './types';

interface MarketplaceCategoriesProps {
  categories: MarketplaceCategoryCardItem[];
  loading?: boolean;
  onOpenCategory: (category: MarketplaceCategoryCardItem) => void;
  onExploreAll: () => void;
}

const iconMap = [Droplets, Zap, Sparkles, Thermometer, TreePine, Paintbrush, Home, Truck];

const MarketplaceCategories: React.FC<MarketplaceCategoriesProps> = ({
  categories,
  loading = false,
  onOpenCategory,
  onExploreAll,
}) => {
  const { t } = useI18n();

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="bg-slate-100/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{t('Browse by Category')}</h2>
            <p className="mt-1 text-slate-500">{t('Find the right service for your needs')}</p>
          </div>
          <button
            type="button"
            onClick={onExploreAll}
            className="group hidden items-center gap-1 text-sm font-medium text-slate-900 hover:underline sm:inline-flex"
          >
            {t('View all categories')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`category-card-skeleton-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
                    <div className="min-w-0 flex-1">
                      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))
            : categories.map((category, index) => {
                const Icon = iconMap[index % iconMap.length];

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onOpenCategory(category)}
                    className="group h-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                        {category.iconUrl ? (
                          <img src={category.iconUrl} alt={category.name} className="h-6 w-6 object-cover" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-slate-950">{t(category.name)}</h3>
                        <p className="text-sm text-slate-500">
                          {category.providerCount ?? 0} {t('providers')}
                        </p>
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
            {t('View all categories')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceCategories;
