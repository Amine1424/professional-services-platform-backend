import React from 'react';
import { useI18n } from '../../i18n';
import { MarketplaceQuickActionItem } from './types';

interface MarketplaceQuickActionsProps {
  actions: MarketplaceQuickActionItem[];
}

const MarketplaceQuickActions: React.FC<MarketplaceQuickActionsProps> = ({ actions }) => {
  const { t } = useI18n();

  if (!actions.length) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-slate-950">{t('Quick Actions')}</h2>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className="group h-full rounded-xl border border-slate-200 bg-white p-6 text-center transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition group-hover:bg-slate-900 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-950">{action.title}</h3>
                    {action.description ? (
                      <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MarketplaceQuickActions;
