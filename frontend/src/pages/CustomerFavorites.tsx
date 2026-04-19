import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, MessageCircle, Quote, Sparkles, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

interface FavoriteProvider {
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
}

const fallbackCover =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80';
const fallbackAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80';

const CustomerFavorites: React.FC = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'top_rated'>('all');

  const load = useCallback(async () => {
    try {
      const response = await api.get('/favorites/providers');
      setItems((response.data?.data || []) as FavoriteProvider[]);
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(
        requestError?.response?.data?.message || t('Failed to load favorite providers.')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const removeFavorite = async (providerId: string) => {
    try {
      setRemovingId(providerId);
      await api.delete(`/favorites/providers/${providerId}`);
      setItems((current) => current.filter((provider) => provider.id !== providerId));
      toast.success(t('Provider removed from favorites.'));
    } catch (requestError: any) {
      toast.error(
        requestError?.response?.data?.message ||
          t('Failed to remove provider from favorites.')
      );
    } finally {
      setRemovingId(null);
    }
  };

  const stats = useMemo(() => {
    const verifiedCount = items.filter((item) => item.isVerified).length;
    const averageRating =
      items.length > 0
        ? (
            items.reduce((sum, item) => sum + Number(item.averageRating || 0), 0) / items.length
          ).toFixed(1)
        : '0.0';

    return [
      {
        label: t('Saved providers'),
        value: String(items.length),
        caption: t('Your active shortlist for future comparison and follow-up.'),
      },
      {
        label: t('Verified providers'),
        value: String(verifiedCount),
        caption: t('Saved providers that already carry marketplace trust signals.'),
      },
      {
        label: t('Average shortlist rating'),
        value: averageRating,
        caption: t('A quick quality signal across the providers you saved.'),
      },
    ];
  }, [items, t]);

  const featuredShortlistItem = useMemo(() => {
    return (
      [...items].sort(
        (a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0)
      )[0] || null
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'verified') {
      return items.filter((item) => item.isVerified);
    }

    if (filter === 'top_rated') {
      return items.filter((item) => Number(item.averageRating || 0) >= 4);
    }

    return items;
  }, [filter, items]);

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
        <div className="font-bold">{t('Favorites unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1e40af_50%,#60a5fa)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <Heart size={14} />
              {t('Shortlist workspace')}
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              {t('Keep the providers worth returning to')}
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              {t(
                'Favorites should reduce decision friction. From here you can reopen the profile, start a conversation, create a request, or clean the shortlist when a provider is no longer relevant.'
              )}
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [t('Saved now'), String(items.length)],
                [
                  t('Verified inside shortlist'),
                  String(items.filter((item) => item.isVerified).length),
                ],
                [t('Ready to message'), String(items.length)],
                [t('Ready to request'), String(items.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">
                    {label}
                  </div>
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
            <h2>Saved providers</h2>
            <div className="psp-surface__sub">
              {t(
                'This is a working shortlist, not a passive list. Every card can move directly into action.'
              )}
            </div>
          </div>
          <Link to="/customer/explore" className="psp-button psp-button--primary">
            {t('Explore more providers')}
          </Link>
        </div>

        <div className="mb-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Best shortlist signal')}
            </div>
            {featuredShortlistItem ? (
              <>
                <div className="mt-3 text-[24px] font-black tracking-tight text-slate-900">
                  {featuredShortlistItem.companyName}
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  {t(
                    'Highest current rating in your saved shortlist. Use this as the fastest candidate when you want to reopen the pipeline now.'
                  )}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                  <Star size={14} fill="currentColor" />
                  {Number(featuredShortlistItem.averageRating || 0).toFixed(1)}{' '}
                  {t('average rating')}
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-slate-600">
                {t('Save providers from Explore to build a usable shortlist.')}
              </div>
            )}
          </div>

          <div className="psp-control-bar rounded-[24px]">
            {[
              ['all', t('All shortlist')],
              ['verified', t('Verified only')],
              ['top_rated', t('Top rated')],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key as 'all' | 'verified' | 'top_rated')}
                className={`psp-control-pill ${filter === key ? 'psp-control-pill--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!items.length ? (
          <div className="psp-empty-state">
            <div className="font-bold">{t('No providers saved yet.')}</div>
            <div className="mt-2">
              {t('Use Explore to save providers you want to compare or contact later.')}
            </div>
            <Link to="/customer/explore" className="psp-button psp-button--primary mt-5">
              {t('Open Explore')}
            </Link>
          </div>
        ) : !filteredItems.length ? (
          <div className="psp-empty-state">
            <div className="font-bold">{t('No providers match this shortlist filter.')}</div>
            <div className="mt-2">
              {t('Try another filter to reopen the rest of your saved providers.')}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredItems.map((provider) => {
              const location =
                [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') ||
                t('Algeria');

              return (
                <article
                  key={provider.id}
                  className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="relative h-[210px]">
                    <img
                      src={provider.coverUrl || provider.avatarUrl || fallbackCover}
                      alt={provider.companyName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.5))]" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {provider.profileBadgeText ? (
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                          {provider.profileBadgeText}
                        </span>
                      ) : null}
                      {provider.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-bold text-slate-900">
                          <Sparkles size={12} />
                          {t('Verified')}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mt-[-56px] flex items-end gap-4">
                      <div className="h-24 w-24 overflow-hidden rounded-[26px] border-4 border-white bg-slate-100 shadow-lg">
                        <img
                          src={provider.avatarUrl || provider.coverUrl || fallbackAvatar}
                          alt={provider.companyName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="pb-2">
                        <div className="text-[24px] font-black tracking-tight text-slate-900">
                          {provider.companyName}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={14} />
                          {location}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                        <Star size={14} fill="currentColor" />
                        {Number(provider.averageRating || 0).toFixed(1)} {t('rating')}
                      </span>
                      <span>
                        {Number(provider.reviewsCount || 0)} {t('reviews')}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <Link
                        to={`/providers/${provider.id}`}
                        className="psp-button psp-button--primary"
                      >
                        {t('Open profile')}
                      </Link>
                      <Link
                        to={`/providers/${provider.id}?intent=message`}
                        className="psp-button psp-button--secondary"
                      >
                        <MessageCircle size={16} />
                        {t('Message')}
                      </Link>
                      <Link
                        to={`/providers/${provider.id}?intent=request`}
                        className="psp-button psp-button--secondary"
                      >
                        <Quote size={16} />
                        {t('Request service')}
                      </Link>
                      <button
                        type="button"
                        className="psp-button psp-button--danger"
                        disabled={removingId === provider.id}
                        onClick={() => removeFavorite(provider.id)}
                      >
                        <Trash2 size={16} />
                        {removingId === provider.id ? t('Removing...') : t('Remove favorite')}
                      </button>
                    </div>
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

export default CustomerFavorites;
