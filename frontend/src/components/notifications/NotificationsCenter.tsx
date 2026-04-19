import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bell,
  CheckCheck,
  Heart,
  Info,
  MessageSquare,
  Sparkles,
  Star,
  Workflow,
} from 'lucide-react';
import api from '../../config/api';
import { useI18n } from '../../i18n';
import '../../styles/app-primitives.css';

type NotificationMode = 'customer' | 'provider';
type NotificationFilter =
  | 'all'
  | 'unread'
  | 'message'
  | 'request'
  | 'comment'
  | 'favorite_provider_update'
  | 'system';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsCenterProps {
  mode: NotificationMode;
}

const FILTERS: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'message', label: 'Messages' },
  { key: 'request', label: 'Requests' },
  { key: 'comment', label: 'Comments' },
  { key: 'favorite_provider_update', label: 'Favorites' },
  { key: 'system', label: 'System' },
];

const TYPE_META: Record<
  string,
  {
    label: string;
    toneClass: string;
    icon: React.ComponentType<{ size?: number }>;
  }
> = {
  message: {
    label: 'Message',
    toneClass: 'bg-blue-50 text-blue-700',
    icon: MessageSquare,
  },
  request: {
    label: 'Request',
    toneClass: 'bg-amber-50 text-amber-700',
    icon: Workflow,
  },
  comment: {
    label: 'Comment',
    toneClass: 'bg-emerald-50 text-emerald-700',
    icon: Star,
  },
  favorite_provider_update: {
    label: 'Favorite',
    toneClass: 'bg-fuchsia-50 text-fuchsia-700',
    icon: Heart,
  },
  system: {
    label: 'System',
    toneClass: 'bg-slate-100 text-slate-700',
    icon: Info,
  },
};

const COPY_BY_MODE: Record<
  NotificationMode,
  {
    title: string;
    sub: string;
    empty: string;
    loading: string;
    openError: string;
    loadingError: string;
    markAllError: string;
    markAllIdle: string;
    markAllBusy: string;
    infoItem: string;
  }
> = {
  customer: {
    title: 'Customer notification center',
    sub: 'Track replies, request updates, comment activity, and provider changes from one feed.',
    empty: 'There are no notifications in this filter right now.',
    loading: 'Loading notifications...',
    openError: 'Failed to open the notification.',
    loadingError: 'Failed to load notifications.',
    markAllError: 'Failed to update notifications.',
    markAllIdle: 'Mark all as read',
    markAllBusy: 'Updating...',
    infoItem: 'Informational notification',
  },
  provider: {
    title: 'Provider activity center',
    sub: 'Monitor incoming demand, reply fast to customer activity, and stay on top of visibility signals.',
    empty: 'There are no provider notifications in this filter right now.',
    loading: 'Loading notifications...',
    openError: 'Failed to open the notification.',
    loadingError: 'Failed to load notifications.',
    markAllError: 'Failed to update notifications.',
    markAllIdle: 'Mark all as read',
    markAllBusy: 'Updating...',
    infoItem: 'Operational notification',
  },
};

const formatDate = (value: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const sortNotifications = (items: NotificationItem[]) =>
  [...items].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

const getActionLabel = (mode: NotificationMode, item: NotificationItem) => {
  if (!item.link) {
    return null;
  }

  if (mode === 'provider') {
    if (item.type === 'request') return 'Open lead workspace';
    if (item.type === 'message') return 'Open shared inbox';
    if (item.type === 'comment') return 'Open portfolio activity';
    if (item.type === 'favorite_provider_update') return 'Open visibility update';
    return 'Open operational detail';
  }

  if (item.type === 'request') return 'Open request';
  if (item.type === 'message') return 'Open conversation';
  if (item.type === 'comment') return 'Open provider activity';
  if (item.type === 'favorite_provider_update') return 'Open provider update';
  return 'Open related item';
};

const getProviderNudge = (item: NotificationItem) => {
  if (item.isRead) {
    return null;
  }

  if (item.type === 'request') return 'Review lead now';
  if (item.type === 'message') return 'Reply while context is fresh';
  if (item.type === 'comment') return 'Respond to public activity';
  if (item.type === 'favorite_provider_update') return 'Check visibility signal';
  if (item.type === 'system') return 'Review operational notice';
  return null;
};

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ mode }) => {
  const { locale, t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const initialFilter = FILTERS.some((item) => item.key === filterParam)
    ? (filterParam as NotificationFilter)
    : 'all';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);

  const navigate = useNavigate();
  const copy = COPY_BY_MODE[mode];

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await api.get('/notifications/me');
        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        setItems(sortNotifications(data));
      } catch (error) {
        console.error(error);
        if (!silent) {
          toast.error(t(copy.loadingError));
        }
        setItems([]);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [copy.loadingError, t]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!FILTERS.some((item) => item.key === filterParam)) {
      return;
    }

    setFilter(filterParam as NotificationFilter);
  }, [filterParam]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('filter', filter);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filter, searchParams, setSearchParams]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((item) => !item.isRead);
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const unreadCount = items.filter((item) => !item.isRead).length;
  const requestCount = items.filter((item) => item.type === 'request').length;
  const messageCount = items.filter((item) => item.type === 'message').length;
  const favoriteCount = items.filter((item) => item.type === 'favorite_provider_update').length;
  const systemCount = items.filter((item) => item.type === 'system').length;
  const operationalUnreadCount = items.filter(
    (item) => !item.isRead && ['request', 'message', 'comment'].includes(item.type)
  ).length;
  const visibilityAndTrustCount = favoriteCount + systemCount;
  const priorityItems = useMemo(
    () =>
      items
        .filter((item) => !item.isRead && ['request', 'message', 'comment'].includes(item.type))
        .slice(0, 4),
    [items]
  );

  const unreadByType = useMemo(
    () => ({
      message: items.filter((item) => !item.isRead && item.type === 'message').length,
      request: items.filter((item) => !item.isRead && item.type === 'request').length,
      comment: items.filter((item) => !item.isRead && item.type === 'comment').length,
      favorite_provider_update: items.filter(
        (item) => !item.isRead && item.type === 'favorite_provider_update'
      ).length,
      system: items.filter((item) => !item.isRead && item.type === 'system').length,
    }),
    [items]
  );

  const summaryCards =
    mode === 'provider'
      ? [
          {
            label: 'Needs attention',
            value: operationalUnreadCount,
            caption:
              'Unread requests, replies, and comments that still need a provider action.',
            icon: Sparkles,
          },
          {
            label: 'New leads',
            value: requestCount,
            caption: 'Lead and request activity currently shaping quote and pipeline work.',
            icon: Workflow,
          },
          {
            label: 'Message replies',
            value: messageCount,
            caption: 'Conversation activity that may need a fast commercial follow-up.',
            icon: MessageSquare,
          },
          {
            label: 'Visibility and trust',
            value: visibilityAndTrustCount,
            caption: 'Favorites, visibility shifts, and system notices tied to your profile.',
            icon: Heart,
          },
        ]
      : [
          {
            label: 'Total notifications',
            value: items.length,
            caption:
              'Recent account activity tied to requests, messages, and providers you follow.',
            icon: Bell,
          },
          {
            label: 'Unread items',
            value: unreadCount,
            caption: 'New items that still need attention or action from you.',
            icon: Sparkles,
          },
          {
            label: 'Request updates',
            value: requestCount,
            caption: 'Status changes, quotes, and new provider replies on your requests.',
            icon: Workflow,
          },
          {
            label: 'Message updates',
            value: messageCount,
            caption: 'New conversation activity from providers you contacted.',
            icon: MessageSquare,
          },
        ];

  const openNotification = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await api.post(`/notifications/${item.id}/read`);
        setItems((current) =>
          sortNotifications(
            current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    isRead: true,
                  }
                : entry
            )
          )
        );
      }

      if (item.link) {
        navigate(item.link);
      }
    } catch (error) {
      console.error(error);
      toast.error(t(copy.openError));
    }
  };

  const markAll = async () => {
    try {
      setMarkingAll(true);
      await api.post('/notifications/read-all');
      setItems((current) =>
        sortNotifications(
          current.map((item) => ({
            ...item,
            isRead: true,
          }))
        )
      );
    } catch (error) {
      console.error(error);
      toast.error(t(copy.markAllError));
    } finally {
      setMarkingAll(false);
    }
  };

  const mixRows =
    mode === 'provider'
      ? [
          ['Message replies', unreadByType.message, MessageSquare],
          ['Lead updates', unreadByType.request, Workflow],
          ['Comments', unreadByType.comment, Star],
          ['Favorites', unreadByType.favorite_provider_update, Heart],
          ['System', unreadByType.system, Info],
        ]
      : [
          ['Messages', unreadByType.message, MessageSquare],
          ['Requests', unreadByType.request, Workflow],
          ['Comments', unreadByType.comment, Star],
          ['Favorites', unreadByType.favorite_provider_update, Heart],
        ];

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Activity center')}
            </div>
            <h2 className="mt-2 text-[30px] font-black tracking-tight text-slate-900">
              {t(copy.title)}
            </h2>
            <div className="mt-3 max-w-[760px] text-[15px] leading-8 text-slate-600">
              {t(copy.sub)}
            </div>
          </div>

          <button
            type="button"
            onClick={markAll}
            disabled={markingAll || !unreadCount}
            className="psp-button psp-button--secondary"
          >
            <CheckCheck size={16} />
            {t(markingAll ? copy.markAllBusy : copy.markAllIdle)}
          </button>
        </div>
      </section>

      <section className="psp-stat-grid">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-stat-card">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="psp-stat-card__label mt-4">{t(item.label)}</div>
              <div className="psp-stat-card__value">{item.value}</div>
              <div className="psp-stat-card__caption">{t(item.caption)}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{t(mode === 'provider' ? 'Operational feed' : 'Notifications feed')}</h2>
              <div className="psp-surface__sub">
                {t(
                  mode === 'provider'
                    ? 'Filter lead updates, message replies, public activity, and visibility signals without losing actionability.'
                    : 'Filter activity, review unread items, and jump straight into the related workflow.'
                )}
              </div>
            </div>
          </div>

          <div className="psp-control-bar mb-5">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`psp-control-pill ${filter === item.key ? 'psp-control-pill--active' : ''}`}
                aria-pressed={filter === item.key}
              >
                {t(item.label)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="psp-empty-state">{t(copy.loading)}</div>
          ) : !filteredItems.length ? (
            <div className="psp-empty-state">{t(copy.empty)}</div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((item) => {
                const meta = TYPE_META[item.type] || TYPE_META.system;
                const Icon = meta.icon;
                const actionLabel = getActionLabel(mode, item);
                const providerNudge = mode === 'provider' ? getProviderNudge(item) : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void openNotification(item)}
                    className={`w-full rounded-[24px] border px-5 py-5 text-left transition ${
                      item.isRead
                        ? 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                        : 'border-blue-200 bg-blue-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${meta.toneClass}`}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-[15px] text-slate-900">{item.title}</strong>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${meta.toneClass}`}
                            >
                              {t(meta.label)}
                            </span>
                            {!item.isRead ? (
                              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                                {t('New')}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 text-xs font-semibold text-slate-500">
                            {formatDate(item.createdAt, locale)}
                          </div>

                          <div className="mt-3 text-[14px] leading-7 text-slate-600">
                            {item.body}
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {providerNudge ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                {t(providerNudge)}
                              </span>
                            ) : null}

                            {actionLabel ? (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {t(actionLabel)}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                {t(copy.infoItem)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </article>

        <aside className="psp-page-stack">
          <article className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>{t(mode === 'provider' ? 'Priority queue' : 'Needs attention')}</h2>
                <div className="psp-surface__sub">
                  {t(
                    mode === 'provider'
                      ? 'Unread operational items that can affect response time or pipeline quality.'
                      : 'High-value unread items first.'
                  )}
                </div>
              </div>
            </div>

            {!priorityItems.length ? (
              <div className="psp-empty-state">
                {t(
                  mode === 'provider'
                    ? 'No unread operational items need immediate action right now.'
                    : 'No urgent unread items right now.'
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {priorityItems.map((item) => {
                  const meta = TYPE_META[item.type] || TYPE_META.system;
                  const Icon = meta.icon;
                  const actionLabel = getActionLabel(mode, item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void openNotification(item)}
                      className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.toneClass}`}
                        >
                          <Icon size={14} />
                          {t(meta.label)}
                        </span>
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      </div>
                      <div className="mt-3 text-sm font-black text-slate-900">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{item.body}</div>
                      {actionLabel ? (
                        <div className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          {t(actionLabel)}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </article>

          <article className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>{t(mode === 'provider' ? 'Operational mix' : 'Unread by type')}</h2>
              </div>
            </div>

            <div className="grid gap-3">
              {mixRows.map(([label, value, Icon]) => {
                const Cmp = Icon as React.ComponentType<{ size?: number }>;

                return (
                  <div
                    key={label as string}
                    className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4"
                  >
                    <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
                        <Cmp size={18} />
                      </span>
                      {t(label as string)}
                    </div>
                    <span className="text-[20px] font-black text-slate-900">{value as number}</span>
                  </div>
                );
              })}
            </div>
          </article>

          {mode === 'provider' ? (
            <article className="psp-surface">
              <div className="psp-surface__header">
                <div>
                  <h2>{t('Visibility and trust')}</h2>
                  <div className="psp-surface__sub">
                    {t('Public profile signals and marketplace notices worth watching.')}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t('Favorite-provider updates')}
                  </div>
                  <div className="mt-2 text-[20px] font-black text-slate-900">{favoriteCount}</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {t('Favorites and visibility activity connected to your provider profile.')}
                  </div>
                </div>

                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t('Unread visibility items')}
                  </div>
                  <div className="mt-2 text-[20px] font-black text-slate-900">
                    {unreadByType.favorite_provider_update}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {t('New favorite or visibility-related items that still need review.')}
                  </div>
                </div>

                <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t('System notices')}
                  </div>
                  <div className="mt-2 text-[20px] font-black text-slate-900">{systemCount}</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {t('Marketplace notices, trust-related alerts, and operational reminders.')}
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </aside>
      </section>
    </div>
  );
};

export default NotificationsCenter;
