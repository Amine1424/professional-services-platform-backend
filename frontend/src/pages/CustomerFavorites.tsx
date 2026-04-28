import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomerWorkspaceTopNav from '../components/customer/CustomerWorkspaceTopNav';
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
  responseTimeMinutes?: number | null;
  primaryCategoryName?: string | null;
  savedAt?: string | null;
}

type FavoriteFilter = 'all' | 'verified' | 'top_rated';

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatResponseTime = (minutes?: number | null, fallback?: string) => {
  if (!minutes || minutes <= 0) {
    return fallback || 'Response time not shared';
  }

  if (minutes < 60) {
    return `< ${minutes + 1} min`;
  }

  if (minutes < 120) {
    return '< 2 h';
  }

  return `< ${Math.ceil(minutes / 60)} h`;
};

const formatSavedDate = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const CustomerFavorites: React.FC = () => {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FavoriteFilter>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!menuOpenId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpenId]);

  const removeFavorite = async (providerId: string) => {
    try {
      setRemovingId(providerId);
      setMenuOpenId(null);
      await api.delete(`/favorites/providers/${providerId}`);
      setItems((current) => current.filter((provider) => provider.id !== providerId));
      toast.success(t('Provider removed from favorites.'));
    } catch (requestError: any) {
      toast.error(
        requestError?.response?.data?.message || t('Failed to remove provider from favorites.')
      );
    } finally {
      setRemovingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (filter === 'verified') {
      return items.filter((item) => item.isVerified);
    }

    if (filter === 'top_rated') {
      return items.filter((item) => Number(item.averageRating || 0) >= 4.5);
    }

    return items;
  }, [filter, items]);

  const counts = useMemo(
    () => ({
      all: items.length,
      verified: items.filter((item) => item.isVerified).length,
      top_rated: items.filter((item) => Number(item.averageRating || 0) >= 4.5).length,
    }),
    [items]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <CustomerWorkspaceTopNav currentPage="favorites" variant="v0" />
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
          <div className="h-[88px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-[48px] animate-pulse rounded-[18px] bg-white" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[250px] animate-pulse rounded-[20px] bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <CustomerWorkspaceTopNav currentPage="favorites" variant="v0" />

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        {error ? (
          <div className="psp-error-state">
            <div className="font-bold">{t('Favorites unavailable.')}</div>
            <div>{error}</div>
          </div>
        ) : (
          <>
            <header className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bookmark size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-950">{t('Saved providers')}</h1>
                  <p className="text-sm text-slate-500">
                    {items.length} {t('providers')} · {t('Your active shortlist for future comparison and follow-up.')}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex flex-wrap items-center gap-2">
              {[
                ['all', t('All shortlist')],
                ['verified', t('Verified only')],
                ['top_rated', t('Top rated')],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as FavoriteFilter)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {key === 'verified' ? <CheckCircle2 size={14} /> : null}
                  {key === 'top_rated' ? <Star size={14} /> : null}
                  <span>{label}</span>
                  <span className={`text-xs ${filter === key ? 'text-white/80' : 'text-slate-400'}`}>
                    (
                    {key === 'all'
                      ? counts.all
                      : key === 'verified'
                        ? counts.verified
                        : counts.top_rated}
                    )
                  </span>
                </button>
              ))}
            </div>

            {filteredItems.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((provider) => {
                  const rating = Number(provider.averageRating || 0);
                  const reviewsCount = Number(provider.reviewsCount || 0);
                  const location =
                    [provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') ||
                    t('Algeria');
                  const responseTimeLabel = t(
                    formatResponseTime(provider.responseTimeMinutes, t('Response time not shared'))
                  );
                  const savedDateLabel = formatSavedDate(provider.savedAt, locale);

                  return (
                    <article
                      key={provider.id}
                      className={`rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition ${
                        removingId === provider.id ? 'scale-[0.985] opacity-60' : ''
                      }`}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
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

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate font-semibold text-slate-950">
                              {provider.companyName}
                            </h3>
                            {provider.isVerified ? (
                              <CheckCircle2 size={16} className="shrink-0 text-blue-600" />
                            ) : null}
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-slate-950">
                                {rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-500">({reviewsCount})</span>
                            </div>
                          </div>
                        </div>

                        <div ref={menuOpenId === provider.id ? menuRef : undefined} className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenId((current) => (current === provider.id ? null : provider.id))
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label={t('Actions')}
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {menuOpenId === provider.id ? (
                            <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                              <button
                                type="button"
                                onClick={() => void removeFavorite(provider.id)}
                                disabled={removingId === provider.id}
                                className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 size={14} />
                                {t('Remove favorite')}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
                        <div className="flex min-w-0 items-center gap-1">
                          <MapPin size={14} />
                          <span className="truncate">{location}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Clock size={14} />
                          <span>{responseTimeLabel}</span>
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {provider.primaryCategoryName || t('No category')}
                        </span>
                        {provider.profileBadgeText ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            {provider.profileBadgeText}
                          </span>
                        ) : null}
                      </div>

                      {savedDateLabel ? (
                        <p className="mb-4 text-xs text-slate-400">{savedDateLabel}</p>
                      ) : null}

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/providers/${provider.id}`}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                        >
                          <ExternalLink size={14} />
                          {t('View profile')}
                        </Link>

                        <Link
                          to={`/providers/${provider.id}?intent=message`}
                          className="inline-flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          aria-label={t('Message')}
                        >
                          <MessageCircle size={15} />
                        </Link>

                        <Link
                          to={`/providers/${provider.id}?intent=request`}
                          className="inline-flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          aria-label={t('Request service')}
                        >
                          <FileText size={15} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : items.length === 0 ? (
              <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Bookmark size={24} className="text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-950">{t('No providers saved yet.')}</h3>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  {t('Use Explore to save providers you want to compare or contact later.')}
                </p>
                <Link
                  to="/customer/explore"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  <Search size={16} className="mr-2" />
                  {t('Explore Providers')}
                </Link>
              </div>
            ) : (
              <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Search size={24} className="text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-950">
                  {t('No providers match this shortlist filter.')}
                </h3>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  {t('Try another filter to reopen the rest of your saved providers.')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;
