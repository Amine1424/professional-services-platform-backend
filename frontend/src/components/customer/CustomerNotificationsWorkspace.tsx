import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CircleDot,
  FileText,
  Heart,
  Inbox,
  MessageCircle,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';
import CustomerWorkspaceTopNav from './CustomerWorkspaceTopNav';
import api from '../../config/api';
import { useI18n } from '../../i18n';
import '../../styles/app-primitives.css';

type CustomerNotificationFilter =
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

const FILTERS: Array<{
  key: CustomerNotificationFilter;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread', icon: CircleDot },
  { key: 'message', label: 'Messages', icon: MessageSquare },
  { key: 'request', label: 'Requests', icon: FileText },
  { key: 'comment', label: 'Comments', icon: MessageCircle },
  { key: 'favorite_provider_update', label: 'Providers', icon: Heart },
  { key: 'system', label: 'System', icon: Settings },
];

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    surfaceClassName: string;
    iconClassName: string;
  }
> = {
  message: {
    label: 'Message',
    icon: MessageSquare,
    surfaceClassName: 'bg-blue-50',
    iconClassName: 'text-blue-600',
  },
  request: {
    label: 'Request',
    icon: FileText,
    surfaceClassName: 'bg-emerald-50',
    iconClassName: 'text-emerald-600',
  },
  comment: {
    label: 'Comment',
    icon: MessageCircle,
    surfaceClassName: 'bg-violet-50',
    iconClassName: 'text-violet-600',
  },
  favorite_provider_update: {
    label: 'Provider',
    icon: Heart,
    surfaceClassName: 'bg-rose-50',
    iconClassName: 'text-rose-600',
  },
  system: {
    label: 'System',
    icon: Settings,
    surfaceClassName: 'bg-slate-100',
    iconClassName: 'text-slate-600',
  },
};

const formatSectionDate = (value: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));

const formatItemDate = (value: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const sortNotifications = (items: NotificationItem[]) =>
  [...items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const getActionLabel = (item: NotificationItem) => {
  if (!item.link) {
    return null;
  }

  if (item.type === 'request') return 'Open request';
  if (item.type === 'message') return 'Open conversation';
  if (item.type === 'comment') return 'Open provider activity';
  if (item.type === 'favorite_provider_update') return 'Open provider update';
  return 'Open related item';
};

const getEmptyCopy = (filter: CustomerNotificationFilter) => {
  if (filter === 'unread') {
    return {
      title: 'All caught up',
      description: 'You have no unread notifications right now.',
      icon: Inbox,
    };
  }

  if (filter === 'message') {
    return {
      title: 'No messages yet',
      description: 'New provider conversations will appear here.',
      icon: MessageSquare,
    };
  }

  if (filter === 'request') {
    return {
      title: 'No request updates',
      description: 'Quote and request status changes will appear here.',
      icon: FileText,
    };
  }

  if (filter === 'comment') {
    return {
      title: 'No comment activity',
      description: 'Public provider replies and comment updates will appear here.',
      icon: MessageCircle,
    };
  }

  if (filter === 'favorite_provider_update') {
    return {
      title: 'No provider updates',
      description: 'Updates from providers you saved will appear here.',
      icon: Heart,
    };
  }

  if (filter === 'system') {
    return {
      title: 'No system notices',
      description: 'Important platform notices will appear here.',
      icon: Settings,
    };
  }

  return {
    title: 'No activity yet',
    description: 'Messages, requests, comments, and provider updates will appear here.',
    icon: Bell,
  };
};

const CustomerNotificationsWorkspace: React.FC = () => {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const initialFilter = FILTERS.some((item) => item.key === filterParam)
    ? (filterParam as CustomerNotificationFilter)
    : 'all';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CustomerNotificationFilter>(initialFilter);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/me');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setItems(sortNotifications(data));
      setError(null);
    } catch (requestError: any) {
      console.error(requestError);
      setItems([]);
      setError(requestError?.response?.data?.message || t('Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!FILTERS.some((item) => item.key === filterParam)) {
      return;
    }

    setFilter(filterParam as CustomerNotificationFilter);
  }, [filterParam]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('filter', filter);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filter, searchParams, setSearchParams]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((item) => !item.isRead).length,
      message: items.filter((item) => item.type === 'message').length,
      request: items.filter((item) => item.type === 'request').length,
      comment: items.filter((item) => item.type === 'comment').length,
      favorite_provider_update: items.filter(
        (item) => item.type === 'favorite_provider_update'
      ).length,
      system: items.filter((item) => item.type === 'system').length,
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((item) => !item.isRead);
    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const urgentItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !item.isRead &&
          ['request', 'message', 'comment'].includes(item.type) &&
          Boolean(item.link)
      ),
    [items]
  );

  const groupedItems = useMemo(
    () =>
      filteredItems.reduce<Array<{ label: string; items: NotificationItem[] }>>((groups, item) => {
        const label = formatSectionDate(item.createdAt, locale);
        const group = groups.find((entry) => entry.label === label);

        if (group) {
          group.items.push(item);
          return groups;
        }

        groups.push({
          label,
          items: [item],
        });

        return groups;
      }, []),
    [filteredItems, locale]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await api.post(`/notifications/${id}/read`);
        setItems((current) =>
          sortNotifications(
            current.map((item) =>
              item.id === id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
            )
          )
        );
      } catch (requestError: any) {
        console.error(requestError);
        toast.error(requestError?.response?.data?.message || t('Failed to update the notification.'));
      }
    },
    [t]
  );

  const openNotification = useCallback(
    async (item: NotificationItem) => {
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
      } catch (requestError: any) {
        console.error(requestError);
        toast.error(requestError?.response?.data?.message || t('Failed to open the notification.'));
      }
    },
    [navigate, t]
  );

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
    } catch (requestError: any) {
      console.error(requestError);
      toast.error(requestError?.response?.data?.message || t('Failed to update notifications.'));
    } finally {
      setMarkingAll(false);
    }
  };

  const emptyState = getEmptyCopy(filter);
  const EmptyIcon = emptyState.icon;
  const primaryUrgent = urgentItems[0] || null;
  const additionalUrgentCount = Math.max(urgentItems.length - 1, 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <CustomerWorkspaceTopNav
        currentPage="notifications"
        unreadNotificationsCount={unreadCount}
        refreshKey={items.length + unreadCount}
        variant="v0"
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Bell size={18} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">{t('Activity')}</h1>
              {unreadCount > 0 ? (
                <p className="text-sm text-slate-500">
                  {unreadCount} {t('unread')}
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  {t('Messages, requests, comments, and provider updates in one place.')}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAll()}
              disabled={markingAll}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck size={14} />
              {t(markingAll ? 'Updating...' : 'Mark all read')}
            </button>
          ) : null}
        </header>

        {primaryUrgent ? (
          <section className="mb-6 rounded-[20px] border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <AlertCircle size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{primaryUrgent.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{primaryUrgent.body}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void markAsRead(primaryUrgent.id)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                    aria-label={t('Mark read')}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void openNotification(primaryUrgent)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3.5 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    {t(getActionLabel(primaryUrgent) || 'Open related item')}
                    <ArrowRight size={14} />
                  </button>

                  {additionalUrgentCount > 0 ? (
                    <span className="text-xs text-slate-500">
                      +{additionalUrgentCount} {t('more needing attention')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mb-5">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
            {FILTERS.map((item) => {
              const count = filterCounts[item.key];
              if (count === 0 && item.key !== 'all' && item.key !== 'unread') {
                return null;
              }

              const Icon = item.icon;
              const isActive = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  aria-pressed={isActive}
                >
                  {Icon ? <Icon size={14} /> : null}
                  <span>{t(item.label)}</span>
                  {item.key !== 'all' && count > 0 ? (
                    <span className={`text-xs ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-24 animate-pulse rounded-[16px] bg-slate-50" />
              <div className="h-24 animate-pulse rounded-[16px] bg-slate-50" />
              <div className="h-24 animate-pulse rounded-[16px] bg-slate-50" />
            </div>
          </div>
        ) : error ? (
          <div className="psp-error-state">
            <div className="font-bold">{t('Notifications unavailable.')}</div>
            <div>{error}</div>
          </div>
        ) : groupedItems.length ? (
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {group.label}
                </h2>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    const meta = TYPE_META[item.type] || TYPE_META.system;
                    const Icon = meta.icon;
                    const actionLabel = getActionLabel(item);

                    return (
                      <article
                        key={item.id}
                        className={`rounded-[20px] border p-4 shadow-sm transition ${
                          item.isRead
                            ? 'border-slate-200 bg-white'
                            : 'border-blue-200 bg-blue-50/30'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.surfaceClassName}`}
                          >
                            <Icon size={18} className={meta.iconClassName} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-950">
                                    {item.title}
                                  </p>
                                  {!item.isRead ? (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                  ) : null}
                                </div>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                  {item.body}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs text-slate-400">
                                {formatItemDate(item.createdAt, locale)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {actionLabel && item.link ? (
                                <button
                                  type="button"
                                  onClick={() => void openNotification(item)}
                                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                                >
                                  {t(actionLabel)}
                                  <ArrowRight size={13} />
                                </button>
                              ) : null}

                              {!item.isRead ? (
                                <button
                                  type="button"
                                  onClick={() => void markAsRead(item.id)}
                                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                >
                                  <Check size={13} />
                                  {t('Mark read')}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <EmptyIcon size={22} className="text-slate-400" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-950">{t(emptyState.title)}</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
              {t(emptyState.description)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotificationsWorkspace;
