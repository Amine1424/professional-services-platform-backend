import React from 'react';

interface ProviderQuickNavProps {
  hasStories?: boolean;
  servicesCount: number;
  mediaCount: number;
  reviewsCount: number;
  responseTimeMinutes: number;
}

const ProviderQuickNav: React.FC<ProviderQuickNavProps> = ({
  hasStories = false,
  servicesCount,
  mediaCount,
  reviewsCount,
  responseTimeMinutes,
}) => {
  const sections = [
    { href: '#provider-overview', label: 'Overview' },
    { href: '#provider-reach', label: 'Reach' },
    { href: '#provider-services', label: 'Services' },
    ...(hasStories ? [{ href: '#provider-stories', label: 'Stories' }] : []),
    { href: '#provider-portfolio', label: 'Portfolio' },
    { href: '#provider-reviews', label: 'Reviews' },
  ];

  return (
    <section className="rounded-[26px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Profile sections
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Scan offers first, then proof of work, then reviews.
            </div>
          </div>
          <div className="psp-summary-strip">
            <span className="psp-summary-chip">
              <strong>{servicesCount}</strong>
              services
            </span>
            <span className="psp-summary-chip">
              <strong>{mediaCount}</strong>
              works
            </span>
            <span className="psp-summary-chip">
              <strong>{reviewsCount}</strong>
              reviews
            </span>
            <span className="psp-summary-chip">
              <strong>{responseTimeMinutes} min</strong>
              reply
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {sections.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProviderQuickNav;
