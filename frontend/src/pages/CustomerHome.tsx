import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BadgeCheck,
  FileText,
  Heart,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import CustomerWorkspaceTopNav from '../components/customer/CustomerWorkspaceTopNav';
import { useI18n } from '../i18n';
import { getStoredUser } from '../lib/role-routing';
import '../styles/app-primitives.css';

type StoryAudience = 'public' | 'favorites_only';
type MediaType = 'image' | 'video';

interface FeaturedProvider {
  id: string;
  companyName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  headline?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  averageRating?: number | string | null;
  reviewsCount?: number | string | null;
  yearsOfExperience?: number | null;
  responseTimeMinutes?: number | null;
  startingPrice?: number | null;
  isVerified: boolean;
  profileBadgeText?: string | null;
  primaryCategory?: { id: string; name: string } | null;
}

interface FeaturedService {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price?: string | null;
  currencyCode: string;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  category?: { id: string; name: string } | null;
}

interface StoryItem {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  providerLocation?: string | null;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  likesCount: number;
  commentsCount: number;
  promoBadgeText?: string | null;
  showPromoBadge: boolean;
  storyAudience: StoryAudience;
  storyExpiresAt?: string | null;
  service?: { id: string; name: string } | null;
}

interface RecentReview {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

interface HomePayload {
  featuredProviders: FeaturedProvider[];
  featuredServices: FeaturedService[];
  stories: StoryItem[];
  recentReviews: RecentReview[];
}

interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  to: string;
  primary?: boolean;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const fallbackProviderAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=200&q=80';

const clampTwoLinesStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const clampThreeLinesStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

const formatResponseTime = (minutes?: number | null, t?: (key: string) => string) => {
  if (!minutes || minutes <= 0) {
    return t ? t('Response time not shared yet') : 'Response time not shared yet';
  }

  if (minutes < 60) {
    return `${minutes} ${t ? t('min') : 'min'}`;
  }

  if (minutes === 60) {
    return t ? t('< 1 hour') : '< 1 hour';
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} ${t ? t('hours') : 'hours'}`;
};

const formatPrice = (
  value?: string | number | null,
  currencyCode?: string | null,
  t?: (key: string) => string
) => {
  if (value === null || value === undefined || value === '') {
    return t ? t('Price based on scope') : 'Price based on scope';
  }

  return `${value} ${currencyCode || ''}`.trim();
};

const formatReviewDate = (value?: string, locale = 'en-GB') => {
  if (!value) return '';

  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const getGreeting = (hour: number, t: (key: string) => string) => {
  if (hour < 12) return t('Good morning');
  if (hour < 18) return t('Good afternoon');
  return t('Good evening');
};

const buildLocationLabel = (provider: FeaturedProvider) =>
  [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ');

const ContinuationHeader: React.FC<{
  customerName?: string;
}> = ({ customerName }) => {
  const { t } = useI18n();
  const hour = new Date().getHours();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-[28px]">
          {getGreeting(hour, t)}, {customerName || t('Customer')}
        </h2>
        <Sparkles className="h-5 w-5 text-blue-600" />
      </div>
      <p className="text-sm text-slate-500">
        {t('Continue where you left off or explore new services')}
      </p>
    </div>
  );
};

const QuickActions: React.FC<{
  actions: QuickActionItem[];
}> = ({ actions }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
    {actions.map((action) => {
      const Icon = action.icon;

      return (
        <Link key={action.id} to={action.to} className="group block">
          <div
            className={`h-full rounded-[22px] border p-4 transition-all duration-200 ${
              action.primary
                ? 'border-blue-500/15 bg-[linear-gradient(135deg,#2563eb,#3b82f6)] text-white shadow-[0_20px_38px_rgba(37,99,235,0.20)]'
                : 'border-slate-200 bg-white text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.05)] hover:border-blue-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  action.primary ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{action.label}</div>
                <p
                  className={`truncate text-xs ${
                    action.primary ? 'text-white/72' : 'text-slate-500'
                  }`}
                >
                  {action.description}
                </p>
              </div>
              <ArrowRight
                className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  action.primary ? 'text-white/60' : 'text-slate-400'
                }`}
              />
            </div>
          </div>
        </Link>
      );
    })}
  </div>
);

const StoriesSection: React.FC<{
  stories: StoryItem[];
}> = ({ stories }) => {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h3 className="text-base font-semibold text-slate-950">{t('Stories from providers')}</h3>
        <Link
          to="/customer/explore"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-500"
        >
          {t('See all')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!stories.length ? (
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t('No active stories are available right now.')}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-5 pb-5 scrollbar-hide">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={`/providers/${story.providerId}?storyId=${encodeURIComponent(story.id)}`}
              className="group w-28 shrink-0"
            >
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={story.thumbnailUrl || story.mediaUrl}
                  alt={story.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.52))]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </div>
                </div>

                <span className="absolute bottom-2 right-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {story.mediaType === 'video' ? t('Video') : t('Story')}
                </span>

                <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {story.storyAudience === 'favorites_only' ? t('Fav') : t('Public')}
                </span>

                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-white">
                    {story.providerAvatarUrl ? (
                      <img
                        src={story.providerAvatarUrl}
                        alt={story.providerName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-50 text-xs font-semibold text-blue-600">
                        {getInitials(story.providerName)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 text-center">
                <p className="truncate text-xs font-medium text-slate-950">
                  {story.providerName.split(' ')[0]}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {story.service?.name || story.providerLocation || t('Provider update')}
                </p>
              </div>
            </Link>
          ))}

          <Link to="/customer/explore" className="group w-28 shrink-0">
            <div className="mb-2 flex aspect-[3/4] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <div className="px-2 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <span className="text-xs text-slate-500">{t('View more')}</span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

const FeaturedServicesSection: React.FC<{
  services: FeaturedService[];
}> = ({ services }) => {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h3 className="text-base font-semibold text-slate-950">{t('Featured services')}</h3>
        <Link
          to="/customer/explore"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-500"
        >
          {t('Browse all')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!services.length ? (
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t('No featured services are available right now.')}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 px-5 pb-5 sm:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/providers/${service.providerId}`}
              className="group flex items-center gap-3 rounded-xl border border-transparent bg-slate-50/80 p-3 transition-all hover:border-blue-200 hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <span className="text-sm font-semibold">{service.name.charAt(0)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-950">{service.name}</span>
                  {service.showPromoBadge && service.promoBadgeText ? (
                    <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {service.promoBadgeText}
                    </span>
                  ) : null}
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>{service.category?.name || t('General services')}</span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500" style={clampTwoLinesStyle}>
                  {service.description}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-sm font-medium text-slate-950">
                  {formatPrice(service.price, service.currencyCode, t)}
                </span>
                <p className="text-[10px] text-slate-500">{t('scope')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const ProviderSpotlight: React.FC<{
  provider: FeaturedProvider | null;
}> = ({ provider }) => {
  const { t } = useI18n();

  if (!provider) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
        <div className="px-5 pb-4 pt-5">
          <h3 className="text-base font-semibold text-slate-950">{t('Trusted provider')}</h3>
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t('No featured provider is available right now.')}
          </div>
        </div>
      </div>
    );
  }

  const locationLabel = buildLocationLabel(provider);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h3 className="text-base font-semibold text-slate-950">{t('Trusted provider')}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {t('Featured')}
        </span>
      </div>

      <div className="space-y-4 px-5 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-blue-100">
            {provider.avatarUrl || provider.coverUrl ? (
              <img
                src={provider.avatarUrl || provider.coverUrl || fallbackProviderAvatar}
                alt={provider.companyName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 font-medium text-blue-600">
                {getInitials(provider.companyName)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold text-slate-950">{provider.companyName}</span>
              {provider.isVerified ? <BadgeCheck className="h-4 w-4 text-blue-600" /> : null}
            </div>
            <p className="text-sm text-slate-500">
              {provider.primaryCategory?.name || t('Professional services')}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium text-slate-950">
                  {Number(provider.averageRating || 0).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">
                  ({Number(provider.reviewsCount || 0)})
                </span>
              </div>
              {provider.yearsOfExperience ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">
                    {provider.yearsOfExperience} {t('years')}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-500">
            {t('Typically responds in')} {formatResponseTime(provider.responseTimeMinutes, t)}
          </div>
        </div>

        {provider.headline ? (
          <p className="text-sm leading-6 text-slate-600" style={clampThreeLinesStyle}>
            {provider.headline}
          </p>
        ) : null}

        {locationLabel ? (
          <p className="text-xs text-slate-500">{locationLabel}</p>
        ) : null}

        <div className="flex gap-2">
          <Link to={`/providers/${provider.id}`} className="psp-button psp-button--secondary flex-1">
            {t('View profile')}
          </Link>
          <Link
            to={`/customer/messages?providerId=${encodeURIComponent(provider.id)}`}
            className="psp-button psp-button--primary flex-1"
          >
            {t('Contact')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const RecentReviewsSection: React.FC<{
  reviews: RecentReview[];
  locale: string;
}> = ({ reviews, locale }) => {
  const { t } = useI18n();

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h3 className="text-base font-semibold text-slate-950">{t('Recent reviews')}</h3>
        <Link
          to="/customer/reviews"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-500"
        >
          {t('See all')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!reviews.length ? (
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {t('No recent review highlights are visible right now.')}
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-5 pb-5">
          {reviews.map((review, index) => (
            <div key={review.id}>
              {index > 0 ? <div className="mb-4 border-t border-slate-200" /> : null}
              <Link to={`/providers/${review.providerId}`} className="block space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                      {review.providerAvatarUrl ? (
                        <img
                          src={review.providerAvatarUrl}
                          alt={review.providerName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-slate-500">
                          {getInitials(review.providerName)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-950">{review.providerName}</p>
                      <p className="text-xs text-slate-500">{t('Public customer review')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, itemIndex) => (
                      <Star
                        key={`${review.id}-${itemIndex}`}
                        className={`h-3 w-3 ${
                          itemIndex < review.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-6 text-slate-600" style={clampTwoLinesStyle}>
                  {review.comment || t('A rating was submitted without written feedback.')}
                </p>
                <p className="text-xs text-slate-400">{formatReviewDate(review.createdAt, locale)}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerHome: React.FC = () => {
  const { locale, t } = useI18n();
  const currentUser = useMemo(() => getStoredUser(), []);
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/discovery/customer-home');
        if (!active) return;

        setData((response.data?.data || null) as HomePayload | null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(
          requestError?.response?.data?.message || t('Failed to load the customer home feed.')
        );
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

  const featuredProviders = data?.featuredProviders ?? [];
  const featuredServices = data?.featuredServices ?? [];
  const stories = data?.stories ?? [];
  const recentReviews = data?.recentReviews ?? [];
  const leadProvider = featuredProviders[0] ?? null;

  const quickActions = useMemo<QuickActionItem[]>(
    () => [
      {
        id: 'explore',
        label: t('Explore services'),
        description: t('Find trusted professionals'),
        icon: Search,
        to: '/customer/explore',
        primary: true,
      },
      {
        id: 'messages',
        label: t('Messages'),
        description: t('Continue provider conversations'),
        icon: MessageCircle,
        to: '/customer/messages',
      },
      {
        id: 'requests',
        label: t('Requests'),
        description: t('Track quotes and provider replies'),
        icon: FileText,
        to: '/customer/orders',
      },
      {
        id: 'favorites',
        label: t('Favorites'),
        description: t('Reopen saved providers'),
        icon: Heart,
        to: '/customer/favorites',
      },
      {
        id: 'notifications',
        label: t('Notifications'),
        description: t('Check replies and activity'),
        icon: Bell,
        to: '/customer/notifications',
      },
    ],
    [t]
  );

  if (loading) {
    return (
      <div className="psp-desktop-frame space-y-6">
        <CustomerWorkspaceTopNav currentPage="dashboard" />
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-[88px] animate-pulse rounded-[22px] border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-[265px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
            <div className="h-[290px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
          </div>
          <div className="space-y-6">
            <div className="h-[280px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
            <div className="h-[240px] animate-pulse rounded-[24px] border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-desktop-frame space-y-6">
        <CustomerWorkspaceTopNav currentPage="dashboard" />
        <div className="psp-error-state">
          <div className="font-bold">{t('Customer home is unavailable.')}</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="psp-desktop-frame space-y-6">
        <CustomerWorkspaceTopNav currentPage="dashboard" />
        <div className="psp-empty-state">{t('No customer feed data is available yet.')}</div>
      </div>
    );
  }

  return (
    <div className="psp-desktop-frame space-y-6">
      <CustomerWorkspaceTopNav currentPage="dashboard" />

      <section>
        <ContinuationHeader customerName={currentUser?.firstName} />
      </section>

      <section>
        <QuickActions actions={quickActions} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StoriesSection stories={stories.slice(0, 8)} />
          <FeaturedServicesSection services={featuredServices.slice(0, 4)} />
        </div>

        <div className="space-y-6">
          <ProviderSpotlight provider={leadProvider} />
          <RecentReviewsSection reviews={recentReviews.slice(0, 3)} locale={locale} />
        </div>
      </section>
    </div>
  );
};

export default CustomerHome;
