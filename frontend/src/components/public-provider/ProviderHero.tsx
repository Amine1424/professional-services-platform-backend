import React, { useMemo } from 'react';
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Star,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { PublicProviderPayload } from './types';

interface ProviderHeroProps {
  provider: PublicProviderPayload['provider'];
  providerLocation: string;
  ownerName: string;
  isFavorite: boolean;
  storiesCount?: number;
  onOpenStories?: () => void;
  onMessage: () => void;
  onRequest: () => void;
  onToggleFavorite: () => void;
}

const formatMemberSince = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const ProviderHero: React.FC<ProviderHeroProps> = ({
  provider,
  providerLocation,
  ownerName,
  isFavorite,
  storiesCount = 0,
  onOpenStories,
  onMessage,
  onRequest,
  onToggleFavorite,
}) => {
  const { locale, t } = useI18n();

  const tagline = useMemo(() => {
    const description = provider.description?.trim();
    if (!description) {
      return t('Trusted local professional services');
    }

    const firstSentence = description.split('.').find((item) => item.trim().length > 0)?.trim();
    return firstSentence || description;
  }, [provider.description, t]);

  const memberSinceLabel = formatMemberSince(provider.createdAt, locale);
  const responseTimeLabel =
    provider.responseTimeMinutes && provider.responseTimeMinutes > 0
      ? provider.responseTimeMinutes < 60
        ? t('Responds in under an hour')
        : t('Responds in under a few hours')
      : t('Response time available on request');

  const badgeItems = [
    provider.preference.profileBadgeText || null,
    provider.preference.featuredOnHomepage ? t('Featured on marketplace') : null,
    provider.isVerified ? t('Verified') : null,
    storiesCount > 0 ? `${storiesCount} ${t(storiesCount === 1 ? 'story' : 'stories')}` : null,
  ].filter(Boolean) as string[];

  const coverImage =
    provider.coverUrl ||
    provider.avatarUrl ||
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80';

  return (
    <section
      id="provider-overview"
      className="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/92 shadow-[0_30px_80px_rgba(15,23,42,0.10)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]" />

      <div className="relative grid gap-8 p-6 lg:p-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-stretch">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {badgeItems.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              >
                {badge === t('Verified') ? <BadgeCheck size={13} className="text-blue-600" /> : null}
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-blue-100 to-slate-50 text-3xl font-semibold text-blue-700 shadow-sm lg:h-28 lg:w-28 lg:text-4xl">
                {provider.avatarUrl ? (
                  <img
                    src={provider.avatarUrl}
                    alt={provider.companyName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(provider.companyName)
                )}
              </div>

              {provider.isVerified ? (
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 shadow-lg">
                  <BadgeCheck size={16} className="text-white" />
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 lg:text-[40px]">
                  {provider.companyName}
                </h1>
                {provider.primaryCategory?.name ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {provider.primaryCategory.name}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 text-sm font-medium text-slate-500">
                {ownerName ? `${t('Managed by')} ${ownerName}` : t('Professional provider account')}
              </div>

              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{tagline}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={16} className="fill-current" />
                    <span className="font-semibold text-slate-950">
                      {Number(provider.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-slate-500">
                    ({provider.reviewsCount} {t('reviews')})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={15} />
                  <span>{responseTimeLabel}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin size={15} />
                  <span>{providerLocation}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t('Coverage')}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {provider.serviceCoverage.label}
              </div>
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t('Response rate')}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {provider.responseRate || 0}%
              </div>
            </div>

            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {t('Member since')}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                {memberSinceLabel || t('Recently joined')}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRequest}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Send size={16} />
              {t('Request a Quote')}
            </button>

            <button
              type="button"
              onClick={onMessage}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
            >
              <MessageCircle size={16} />
              {t('Message provider')}
            </button>

            <button
              type="button"
              onClick={onToggleFavorite}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
            >
              {isFavorite ? (
                <BookmarkCheck size={16} className="text-blue-600" />
              ) : (
                <Bookmark size={16} />
              )}
              {isFavorite ? t('Saved') : t('Save provider')}
            </button>

            {storiesCount > 0 && onOpenStories ? (
              <button
                type="button"
                onClick={onOpenStories}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
              >
                <Sparkles size={16} />
                {t('View stories')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-slate-100 shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
          <img
            src={coverImage}
            alt={provider.companyName}
            className="h-full min-h-[340px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.72))]" />

          <div className="absolute inset-x-0 bottom-0 p-6 text-white">
            <div className="inline-flex items-center rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/88 backdrop-blur">
              {provider.primaryCategory?.name || t('Professional services')}
            </div>

            <div className="mt-4 text-[28px] font-black tracking-[-0.04em]">
              {provider.companyName}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/82">
              <span>{provider.serviceCoverage.label}</span>
              {provider.completedJobs ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white">
                  {provider.completedJobs} {t('jobs completed')}
                </span>
              ) : null}
            </div>

            <p className="mt-4 max-w-lg text-sm leading-7 text-white/82">
              {provider.description || t('No professional summary has been added yet.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProviderHero;
