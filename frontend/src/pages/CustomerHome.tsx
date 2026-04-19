import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

type StoryAudience = 'public' | 'favorites_only';
type MediaType = 'image' | 'video';

interface FeaturedProvider {
  id: string;
  companyName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  averageRating?: number | string | null;
  reviewsCount?: number | string | null;
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

const fallbackProviderAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=200&q=80';

const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
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

  const stats = useMemo(
    () => [
      {
        label: t('Visible providers'),
        value: String(featuredProviders.length),
        caption: t('Businesses with identity, location, and trust signals ready for action.'),
      },
      {
        label: t('Active stories'),
        value: String(stories.length),
        caption: t(
          'Public stories plus favorite-only stories from providers you already follow.'
        ),
      },
      {
        label: t('Recent review signals'),
        value: String(recentReviews.length),
        caption: t('Public customer feedback that keeps the marketplace feeling alive.'),
      },
    ],
    [featuredProviders.length, recentReviews.length, stories.length, t]
  );

  const leadProvider = featuredProviders[0] ?? null;
  const liveStories = stories.slice(0, 8);

  if (loading) {
    return (
      <div className="psp-loading-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--lg" />
        <div className="psp-loading-block psp-loading-block--md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Customer home is unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">{t('No customer feed data is available yet.')}</div>;
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_48%,#67e8f9)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.18)]">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.12em] text-white/90">
              <Sparkles size={14} />
              {t('Live marketplace view')}
            </div>
            <h2 className="mt-5 max-w-[680px] text-[34px] font-black tracking-tight md:text-[46px]">
              {t('Public stories for everyone, private stories from providers you already trust')}
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              {t(
                'The top story rail now mixes public stories with favorite-only stories from providers you already saved.'
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/customer/explore" className="psp-button psp-button--secondary">
                {t('Explore providers')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            {leadProvider ? (
              <Link
                to={`/providers/${leadProvider.id}`}
                className="overflow-hidden rounded-[24px] border border-white/12 bg-white/10 transition hover:bg-white/16"
              >
                <div className="relative h-[220px]">
                  <img
                    src={
                      leadProvider.coverUrl ||
                      leadProvider.avatarUrl ||
                      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt={leadProvider.companyName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.72))]" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                      {t('Featured business')}
                    </div>
                    <div className="mt-2 text-[26px] font-black tracking-tight">
                      {leadProvider.companyName}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/82">
                      <span>{leadProvider.primaryCategory?.name || t('Professional services')}</span>
                      <span>
                        {Number(leadProvider.averageRating || 0).toFixed(1)} {t('rating')}
                      </span>
                      <span>{Number(leadProvider.reviewsCount || 0)} {t('reviews')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {stats.map((item) => (
          <article key={item.label} className="psp-stat-card">
            <div className="psp-stat-card__label">{item.label}</div>
            <div className="psp-stat-card__value">{item.value}</div>
            <div className="psp-stat-card__caption">{item.caption}</div>
          </article>
        ))}
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Stories')}</h2>
            <div className="psp-surface__sub">
              {t('Click a story to view it, then reply directly into the conversation.')}
            </div>
          </div>
        </div>

        {!liveStories.length ? (
          <div className="psp-empty-state">{t('No active stories are available right now.')}</div>
        ) : (
          <div className="flex flex-wrap gap-5">
            {liveStories.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() =>
                  navigate(`/providers/${story.providerId}?storyId=${encodeURIComponent(story.id)}`)
                }
                className="group flex min-w-[92px] flex-col items-center gap-2 text-center"
              >
                <div className="relative">
                  <div className="h-[78px] w-[78px] overflow-hidden rounded-full border-[3px] border-white shadow-lg ring-2 ring-slate-200">
                    <img
                      src={story.thumbnailUrl || story.mediaUrl}
                      alt={story.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                    {story.storyAudience === 'favorites_only' ? t('Fav') : t('Pub')}
                  </span>
                </div>
                <span className="max-w-[96px] truncate text-[13px] font-semibold text-slate-700">
                  {story.providerName}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{t('Recent review signals')}</h2>
            </div>
          </div>

          {!recentReviews.length ? (
            <div className="psp-empty-state">
              {t('No recent review highlights are visible right now.')}
            </div>
          ) : (
            <div className="psp-list">
              {recentReviews.slice(0, 4).map((review) => (
                <Link
                  key={review.id}
                  to={`/providers/${review.providerId}`}
                  className="psp-list-card"
                >
                  <div className="psp-list-card__row">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.providerAvatarUrl || fallbackProviderAvatar}
                        alt={review.providerName}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                      <div>
                        <h3 className="psp-list-card__title">{review.providerName}</h3>
                        <div className="psp-list-card__meta">{t('Public customer review')}</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                      <Star size={15} fill="currentColor" />
                      {review.rating}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {review.comment || t('A rating was submitted without written feedback.')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{t('Service cards ready for conversion')}</h2>
            </div>
          </div>

          {!featuredServices.length ? (
            <div className="psp-empty-state">{t('No featured services are available right now.')}</div>
          ) : (
            <div className="psp-card-grid">
              {featuredServices.slice(0, 6).map((service) => (
                <Link
                  key={service.id}
                  to={`/providers/${service.providerId}`}
                  className="psp-card"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="psp-card__title">{service.name}</h3>
                    {service.showPromoBadge && service.promoBadgeText ? (
                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        {service.promoBadgeText}
                      </span>
                    ) : null}
                  </div>
                  <div className="psp-card__meta">
                    {service.category?.name || t('General services')}
                  </div>
                  <div className="psp-card__description">{service.description}</div>
                  <div className="mt-4 text-sm font-bold text-slate-700">
                    {service.price
                      ? `${service.price} ${service.currencyCode}`
                      : t('Price based on scope')}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                    {t('Open provider profile')}
                    <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default CustomerHome;
