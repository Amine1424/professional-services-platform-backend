import React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n';
import { PublicProviderPayload } from './types';

interface ProviderServicesSectionProps {
  services: PublicProviderPayload['services'];
  onRequest: (serviceId?: string, subject?: string) => void;
  onExploreCategory: (categorySlug: string) => void;
}

const formatPrice = (price?: string | null, currency = 'DZD') => {
  if (!price) {
    return null;
  }

  return `${price} ${currency}`;
};

const ProviderServicesSection: React.FC<ProviderServicesSectionProps> = ({
  services,
  onRequest,
  onExploreCategory,
}) => {
  const { t } = useI18n();

  return (
    <section id="provider-services" className="border-t border-slate-200 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{t('Services')}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {services.length} {t('services offered')}
          </p>
        </div>
      </div>

      {!services.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
          {t('No published services are visible on this profile yet.')}
        </div>
      ) : (
        <div className="grid gap-3">
          {services.map((service) => {
            const priceLabel = formatPrice(service.price, service.currencyCode);

            return (
              <article
                key={service.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-200"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-medium text-slate-950">{service.name}</h3>
                      {service.isFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <Sparkles size={12} />
                          {t('Popular')}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-500">{service.description}</p>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0">
                    <div className="text-right">
                      <div className="font-medium text-slate-950">
                        {priceLabel || t('Price on request')}
                      </div>
                      <div className="text-xs text-slate-500">{service.deliveryMode}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {service.category?.slug ? (
                        <button
                          type="button"
                          onClick={() => onExploreCategory(service.category!.slug)}
                          className="hidden h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:text-slate-900 lg:inline-flex"
                        >
                          {t('Similar')}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onRequest(service.id, service.name)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition sm:opacity-0 sm:group-hover:opacity-100 hover:border-blue-200 hover:text-slate-900"
                      >
                        <Send size={14} />
                        {t('Request')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProviderServicesSection;
