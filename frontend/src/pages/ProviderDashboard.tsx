import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Bot, BriefcaseBusiness, Layers3, MessageCircle, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

interface DashboardData {
  provider: {
    companyName: string;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    primaryCategory?: { name: string } | null;
    user?: { firstName: string; lastName: string };
  };
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
    autoReplyEnabled: boolean;
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
  stats: {
    totalServices: number;
    publishedServices: number;
    draftServices: number;
    pausedServices: number;
    featuredServices: number;
    reviewsCount: number;
    averageRating: string;
    responseTimeMinutes: number;
    completionPercentage: number;
    isVerified: boolean;
    status: string;
  };
  recentServices: Array<{
    id: string;
    name: string;
    status: string;
    price?: string | null;
    currencyCode: string;
    promoBadgeText?: string | null;
    showPromoBadge: boolean;
    category?: { name: string } | null;
  }>;
}

const statusLabel = (status: string, t: (value?: string | null) => string) => {
  switch (status) {
    case 'pending':
      return t('Under review');
    case 'approved':
      return t('Approved');
    case 'rejected':
      return t('Rejected');
    case 'suspended':
      return t('Suspended');
    default:
      return status;
  }
};

const ProviderDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/providers/me/dashboard');
        if (!active) return;
        setData(response.data?.data || null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load the provider dashboard.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  const priorityCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: t('Complete public profile'),
        body: `${t('Current completion is')} ${data.stats.completionPercentage}%. ${t('Push this above 90% to improve trust and conversion.')}`,
        to: '/provider/profile',
      },
      {
        title: t('Grow live services'),
        body: `${data.stats.publishedServices} ${t('published out of')} ${data.stats.totalServices}. ${t('Keep draft inventory low.')}`,
        to: '/provider/services',
      },
      {
        title: t('Stay responsive'),
        body: `${t('Current response time is')} ${data.stats.responseTimeMinutes} ${t('minutes')}. ${t('Messages and AI reply settings affect conversion.')}`,
        to: '/provider/messages',
      },
    ];
  }, [data, t]);

  if (loading) {
    return (
      <div className="psp-loading-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--sm" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Provider dashboard unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">{t('Provider dashboard data is not available.')}</div>;
  }

  const providerName = `${data.provider.user?.firstName || ''} ${data.provider.user?.lastName || ''}`.trim();
  const locationLabel =
    [data.provider.city, data.provider.wilaya, data.provider.region].filter(Boolean).join(', ') ||
    t('Location not completed');

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#0f3b8f_45%,#0ea5e9)] p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.12em] text-white/90">
                {t('Provider cockpit')}
              </span>
              <span className="rounded-full bg-white/12 px-4 py-2 text-xs font-bold text-white/90">
                {statusLabel(data.stats.status, t)}
              </span>
              {data.stats.isVerified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/18 px-4 py-2 text-xs font-bold text-white">
                  <BadgeCheck size={14} />
                  {t('Verified')}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-[24px] border border-white/15 bg-white/10">
                {data.provider.avatarUrl ? (
                  <img src={data.provider.avatarUrl} alt={data.provider.companyName} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <h2 className="text-[34px] font-black tracking-tight">{data.provider.companyName}</h2>
                <div className="mt-2 text-sm font-semibold text-white/78">
                  {providerName || t('Provider account')}
                </div>
                <div className="mt-2 text-sm text-white/76">{locationLabel}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/provider/profile" className="psp-button bg-white text-slate-900">
                {t('Update profile')}
              </Link>
              <Link to="/provider/services" className="psp-button border border-white/20 bg-white/10 text-white">
                {t('Manage services')}
              </Link>
              <Link to="/provider/messages" className="psp-button border border-white/20 bg-white/10 text-white">
                {t('Open inbox')}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [t('Profile completion'), `${data.stats.completionPercentage}%`],
                [t('Plan'), data.preference.selectedPlan.toUpperCase()],
                [t('Response time'), `${data.stats.responseTimeMinutes} ${t('min')}`],
                [t('Avg. rating'), `${data.stats.averageRating} / 5`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">{label}</div>
                  <div className="mt-2 text-[24px] font-black">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {[
          {
            label: t('Total services'),
            value: String(data.stats.totalServices),
            caption: t('Overall service inventory in your workspace.'),
            icon: Layers3,
          },
          {
            label: t('Published'),
            value: String(data.stats.publishedServices),
            caption: t('Services currently visible to customers.'),
            icon: Sparkles,
          },
          {
            label: t('Featured'),
            value: String(data.stats.featuredServices),
            caption: t('Services with boosted visibility or premium positioning.'),
            icon: Star,
          },
          {
            label: t('Reviews'),
            value: String(data.stats.reviewsCount),
            caption: t('Public reviews that affect trust and discovery ranking.'),
            icon: BadgeCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-stat-card">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="psp-stat-card__label mt-4">{item.label}</div>
              <div className="psp-stat-card__value">{item.value}</div>
              <div className="psp-stat-card__caption">{item.caption}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Operational priorities</h2>
              <div className="psp-surface__sub">
                {t(
                  'These areas influence how complete, responsive, and convertible the provider account feels.'
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {priorityCards.map((item) => (
              <Link key={item.title} to={item.to} className="rounded-[24px] bg-slate-50 p-5 transition hover:bg-slate-100">
                <div className="text-[20px] font-extrabold tracking-tight text-slate-900">{item.title}</div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{item.body}</div>
              </Link>
            ))}
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Growth levers</h2>
              <div className="psp-surface__sub">
                {t('Premium capabilities that change how your account is seen in discovery.')}
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                icon: BriefcaseBusiness,
                title: t('Homepage featuring'),
                body: data.preference.featuredOnHomepage
                  ? t('Homepage featuring is currently enabled.')
                  : t('Homepage featuring is currently off.'),
                enabled: data.planFeatures.canFeatureOnHomepage,
              },
              {
                icon: Bot,
                title: t('AI reply support'),
                body: data.preference.autoReplyEnabled
                  ? t('AI-assisted replies are active in the provider inbox.')
                  : t('AI-assisted replies are available but not yet enabled.'),
                enabled: true,
              },
              {
                icon: MessageCircle,
                title: t('Messaging readiness'),
                body: `${t('Response speed is')} ${data.stats.responseTimeMinutes} ${t('minutes on average. Lower is better.')}`,
                enabled: true,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 rounded-[24px] bg-slate-50 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold tracking-tight text-slate-900">{item.title}</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.body}</div>
                    <div className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      {item.enabled ? t('Available now') : t('Requires higher plan')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Recent services</h2>
              <div className="psp-surface__sub">
                {t('Keep draft inventory low and make public offers easier to trust.')}
              </div>
            </div>
            <Link to="/provider/services" className="psp-button psp-button--primary">
              {t('Open services')}
            </Link>
          </div>

          {!data.recentServices.length ? (
            <div className="psp-empty-state">
              {t('No services exist yet. Create the first service to unlock the public conversion flow.')}
            </div>
          ) : (
            <div className="psp-list">
              {data.recentServices.map((service) => (
                <article key={service.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div>
                      <h3 className="psp-list-card__title">{service.name}</h3>
                      <div className="psp-list-card__meta">
                        {service.category?.name || 'No category'} • {service.status} •{' '}
                        {service.price ? `${service.price} ${service.currencyCode}` : 'Price on request'}
                      </div>
                    </div>
                    {service.showPromoBadge && service.promoBadgeText ? (
                      <div className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        {service.promoBadgeText}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{t('Quick workspace links')}</h2>
              <div className="psp-surface__sub">
                {t('Each area has a different operational role. Jump directly to the right tool.')}
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              {
                to: '/provider/profile',
                icon: BadgeCheck,
                title: t('Profile'),
                body: t('Business identity, category, cover, avatar, and public positioning.'),
              },
              {
                to: '/provider/portfolio',
                icon: Layers3,
                title: t('Portfolio'),
                body: t('Proof of work, comments, likes, and media-level visibility.'),
              },
              {
                to: '/provider/subscription',
                icon: Sparkles,
                title: t('Plan and visibility'),
                body: t('Featured logic, badges, and premium capability controls.'),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="flex gap-4 rounded-[24px] bg-slate-50 p-4 transition hover:bg-slate-100">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold tracking-tight text-slate-900">{item.title}</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.body}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ProviderDashboard;
