import React from 'react';
import { useI18n } from '../../i18n';

interface ProviderQuickNavProps {
  hasStories?: boolean;
  servicesCount: number;
  mediaCount: number;
  reviewsCount: number;
}

const ProviderQuickNav: React.FC<ProviderQuickNavProps> = ({
  hasStories = false,
  servicesCount,
  mediaCount,
  reviewsCount,
}) => {
  const { t } = useI18n();

  const sections = [
    { href: '#provider-overview', label: t('Overview') },
    { href: '#provider-reach', label: t('Reach') },
    { href: '#provider-services', label: `${t('Services')} (${servicesCount})` },
    ...(hasStories ? [{ href: '#provider-stories', label: t('Stories') }] : []),
    { href: '#provider-portfolio', label: `${t('Portfolio')} (${mediaCount})` },
    { href: '#provider-reviews', label: `${t('Reviews')} (${reviewsCount})` },
  ];

  return (
    <section className="rounded-[26px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {t('Quick jump')}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {servicesCount} {t('services')} / {mediaCount} {t('works')} / {reviewsCount}{' '}
            {t('reviews')}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((item) => (
            <a key={item.href} href={item.href} className="psp-control-pill">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProviderQuickNav;
