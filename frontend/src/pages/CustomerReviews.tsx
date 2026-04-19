import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquareText, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

interface ReviewItem {
  id: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  provider?: {
    id: string;
    companyName: string;
    avatarUrl?: string | null;
  } | null;
}

const fallbackAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80';

const CustomerReviews: React.FC = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'with_comment' | 'high_rating'>('all');

  const load = useCallback(async () => {
    try {
      const response = await api.get('/provider-reviews/me');
      setItems(response.data?.data || []);
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || t('Failed to load your reviews.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeReview = async (id: string) => {
    try {
      setDeletingId(id);
      await api.delete(`/provider-reviews/${id}`);
      setItems((current) => current.filter((review) => review.id !== id));
      toast.success(t('Review deleted.'));
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t('Failed to delete review.'));
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const average =
      items.length > 0
        ? (
            items.reduce((sum, review) => sum + Number(review.rating || 0), 0) / items.length
          ).toFixed(1)
        : '0.0';

    return [
      {
        label: t('Published reviews'),
        value: String(items.length),
        caption: t('Reviews you have written across provider profiles.'),
      },
      {
        label: t('Average rating given'),
        value: average,
        caption: t('A simple view of how demanding your public feedback has been.'),
      },
      {
        label: t('With written comments'),
        value: String(items.filter((item) => Boolean(item.comment?.trim())).length),
        caption: t('Reviews that include context beyond the star rating.'),
      },
    ];
  }, [items, t]);

  const filteredItems = useMemo(() => {
    if (filter === 'with_comment') {
      return items.filter((item) => Boolean(item.comment?.trim()));
    }

    if (filter === 'high_rating') {
      return items.filter((item) => Number(item.rating) >= 4);
    }

    return items;
  }, [filter, items]);

  const ratingDistribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: items.filter((item) => Number(item.rating) === rating).length,
    }));
  }, [items]);

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Reviews unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#60a5fa)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <MessageSquareText size={14} />
              {t('Review history')}
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              {t('Manage the feedback you have already published')}
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              {t(
                'Reviews shape public trust and discovery ranking. From here you can reopen the provider profile or delete feedback that is no longer accurate.'
              )}
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [t('Total reviews'), String(items.length)],
                [t('Providers reviewed'), String(new Set(items.map((item) => item.providerId)).size)],
                [t('Ratings given'), items.length ? t('Active') : t('None yet')],
                [t('Delete control'), t('Available')],
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
            <h2>Your published reviews</h2>
            <div className="psp-surface__sub">
              {t(
                'Open the provider profile to add new feedback in context, or remove an outdated review directly from here.'
              )}
            </div>
          </div>
          <Link to="/customer/explore" className="psp-button psp-button--primary">
            {t('Explore providers')}
          </Link>
        </div>

        <div className="mb-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Rating distribution')}
            </div>
            <div className="mt-4 grid gap-3">
              {ratingDistribution.map((item) => (
                <div key={item.rating} className="flex items-center justify-between gap-4 rounded-[18px] bg-white px-4 py-3">
                  <div className="inline-flex items-center gap-2 font-bold text-slate-700">
                    <Star size={14} fill="currentColor" className="text-amber-500" />
                    {item.rating} {t('stars')}
                  </div>
                  <div className="text-sm font-semibold text-slate-500">
                    {item.count} {t('reviews')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="psp-control-bar rounded-[24px]">
            {[
              ['all', t('All reviews')],
              ['with_comment', t('With comments')],
              ['high_rating', t('4 stars and above')],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as 'all' | 'with_comment' | 'high_rating')}
                className={`psp-control-pill ${filter === key ? 'psp-control-pill--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!items.length ? (
          <div className="psp-empty-state">
            <div className="font-bold">{t('You have not published any reviews yet.')}</div>
            <div className="mt-2">
              {t('Open a provider profile from Explore when you want to leave public feedback.')}
            </div>
            <Link to="/customer/explore" className="psp-button psp-button--primary mt-5">
              {t('Open Explore')}
            </Link>
          </div>
        ) : !filteredItems.length ? (
          <div className="psp-empty-state">
            <div className="font-bold">{t('No reviews match this filter.')}</div>
            <div className="mt-2">
              {t('Switch filters to inspect the rest of your published feedback.')}
            </div>
          </div>
        ) : (
          <div className="psp-list">
            {filteredItems.map((review) => {
              const providerName = review.provider?.companyName || t('Provider');

              return (
                <article key={review.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-[20px] bg-slate-100">
                        <img
                          src={review.provider?.avatarUrl || fallbackAvatar}
                          alt={providerName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="psp-list-card__title">{providerName}</h3>
                        <div className="psp-list-card__meta">
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                          <Star size={15} fill="currentColor" />
                          {review.rating} / 5
                        </div>
                      </div>
                    </div>

                    <div className="psp-list-card__actions">
                      <Link to={`/providers/${review.providerId}`} className="psp-button psp-button--secondary">
                        {t('Open provider')}
                      </Link>
                      <button
                        type="button"
                        className="psp-button psp-button--danger"
                        disabled={deletingId === review.id}
                        onClick={() => removeReview(review.id)}
                      >
                        <Trash2 size={16} />
                        {deletingId === review.id ? t('Deleting...') : t('Delete')}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[20px] bg-slate-50 p-4 text-sm leading-8 text-slate-600">
                    {review.comment?.trim() || t('No written comment was included with this review.')}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerReviews;
