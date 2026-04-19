import React, { useMemo } from 'react';
import { Clock3, Sparkles, Tag } from 'lucide-react';
import { PublicProviderPayload } from './types';

interface ProviderServicesSectionProps {
  services: PublicProviderPayload['services'];
  onRequest: (serviceId?: string, subject?: string) => void;
  onExploreCategory: (categorySlug: string) => void;
}

const ProviderServicesSection: React.FC<ProviderServicesSectionProps> = ({
  services,
  onRequest,
  onExploreCategory,
}) => {
  const spotlightService = useMemo(() => {
    return services.find((service) => service.isFeatured) || services[0] || null;
  }, [services]);

  const remainingServices = useMemo(() => {
    if (!spotlightService) return services;
    return services.filter((service) => service.id !== spotlightService.id);
  }, [services, spotlightService]);

  return (
    <section id="provider-services" className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>Published services</h2>
          <div className="psp-surface__sub">
            These offers can be requested directly from the profile and are structured for quick customer comparison.
          </div>
        </div>
      </div>

      {!services.length ? (
        <div className="psp-empty-state">No published services are visible on this profile yet.</div>
      ) : (
        <div className="grid gap-5">
          {spotlightService ? (
            <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Spotlight service
                  </div>
                  <div className="mt-3 text-[30px] font-black tracking-tight text-slate-900">
                    {spotlightService.name}
                  </div>
                  <div className="mt-3 max-w-[720px] text-sm leading-8 text-slate-600">
                    {spotlightService.description}
                  </div>
                </div>

                <div className="rounded-[22px] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Starting point
                  </div>
                  <div className="mt-2 text-[24px] font-black text-slate-900">
                    {spotlightService.price
                      ? `${spotlightService.price} ${spotlightService.currencyCode}`
                      : 'Price on request'}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {spotlightService.category?.name || 'No category'}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {spotlightService.deliveryMode}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  Reply in {spotlightService.responseTimeHours}h
                </span>
                {spotlightService.showPromoBadge && spotlightService.promoBadgeText ? (
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                    {spotlightService.promoBadgeText}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {remainingServices.length ? (
            <div className="psp-card-grid">
              {remainingServices.map((service) => (
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
                  {service.category?.name || 'No category'} | {service.deliveryMode}
                </div>
                <div className="psp-card__description">{service.description}</div>

                <div className="mt-4 grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <Tag size={12} />
                      {service.price ? `${service.price} ${service.currencyCode}` : 'Price on request'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      <Clock3 size={12} />
                      Reply in {service.responseTimeHours}h
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="psp-button psp-button--primary"
                    onClick={() => onRequest(service.id, service.name)}
                  >
                    Request this service
                  </button>
                  {service.category?.slug ? (
                    <button
                      type="button"
                      className="psp-control-pill"
                      onClick={() => onExploreCategory(service.category!.slug)}
                    >
                      <Sparkles size={16} />
                      Similar providers
                    </button>
                  ) : null}
                </div>
              </article>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default ProviderServicesSection;
