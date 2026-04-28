import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Star,
  StickyNote,
  XCircle,
} from 'lucide-react';
import CustomerWorkspaceTopNav from '../components/customer/CustomerWorkspaceTopNav';
import api from '../config/api';
import { useI18n } from '../i18n';
import {
  formatMoney,
  formatMoneyRange,
  formatRequestDate,
  getRequestStatusMeta,
  matchesRequestFilter,
  RequestFilterKey,
  REQUEST_FILTERS,
} from '../lib/service-request';
import '../styles/app-primitives.css';

interface CustomerOrderItem {
  id: string;
  subject?: string | null;
  description: string;
  budgetMin?: string | null;
  budgetMax?: string | null;
  quotedPrice?: string | null;
  currencyCode: string;
  providerResponse?: string | null;
  customerNote?: string | null;
  preferredDate?: string | null;
  status: string;
  conversationId?: string | null;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    companyName: string;
    avatarUrl?: string | null;
    isVerified: boolean;
    averageRating?: string | number | null;
    reviewsCount?: number | null;
    responseTimeMinutes?: number | null;
    primaryCategoryName?: string | null;
  };
  service?: {
    id: string;
    name: string;
    categoryName?: string | null;
    price?: string | null;
    currencyCode?: string | null;
  } | null;
  quote?: {
    amount: string | number;
    currency: string;
    updatedAt: string;
  } | null;
}

interface ConversationMessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderName?: string | null;
  senderRole?: string | null;
}

interface TimelineEvent {
  id: string;
  description: string;
  timestamp: string;
  actor?: string | null;
  accent?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

interface DecisionPrompt {
  status: 'rejected' | 'cancelled';
  title: string;
  description: string;
  confirmLabel: string;
}

const STATUS_VISUALS: Record<
  string,
  {
    label: string;
    badgeClassName: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconClassName: string;
  }
> = {
  new: {
    label: 'Awaiting Quote',
    badgeClassName: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: Clock,
    iconClassName: 'text-amber-600',
  },
  reviewed: {
    label: 'Under Review',
    badgeClassName: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: Clock,
    iconClassName: 'text-amber-600',
  },
  quoted: {
    label: 'Quote Ready',
    badgeClassName: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: FileText,
    iconClassName: 'text-blue-600',
  },
  accepted: {
    label: 'Accepted',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600',
  },
  in_progress: {
    label: 'In Progress',
    badgeClassName: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: Loader2,
    iconClassName: 'text-blue-600',
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: CheckCircle2,
    iconClassName: 'text-emerald-600',
  },
  rejected: {
    label: 'Rejected',
    badgeClassName: 'bg-rose-50 text-rose-700 border border-rose-200',
    icon: XCircle,
    iconClassName: 'text-rose-600',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClassName: 'bg-rose-50 text-rose-700 border border-rose-200',
    icon: XCircle,
    iconClassName: 'text-rose-600',
  },
};

const getStatusVisual = (status?: string | null) =>
  STATUS_VISUALS[status || ''] || {
    label: status || 'Open',
    badgeClassName: 'bg-slate-100 text-slate-700 border border-slate-200',
    icon: FileText,
    iconClassName: 'text-slate-500',
  };

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const formatCompactDate = (value?: string | null, locale = 'en-GB') => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const formatCurrencyValue = (amount?: string | number | null, currencyCode = 'DZD') =>
  formatMoney(amount, currencyCode);

const formatResponseTime = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return 'Response time not shared';
  }

  if (minutes < 60) {
    return `< ${minutes + 1} min`;
  }

  if (minutes < 120) {
    return '< 2 hours';
  }

  return `< ${Math.ceil(minutes / 60)} hours`;
};

const getTimelineAccent = (message: ConversationMessageItem): TimelineEvent['accent'] => {
  const body = String(message.body || '').toLowerCase();

  if (body.includes('cancel')) return 'danger';
  if (body.includes('reject')) return 'danger';
  if (body.includes('accept')) return 'success';
  if (body.includes('completed')) return 'success';
  if (body.includes('quote')) return 'info';
  return message.senderRole === 'customer' ? 'neutral' : 'warning';
};

const CustomerOrders: React.FC = () => {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const filterParam = searchParams.get('tab');
  const initialFilter = REQUEST_FILTERS.some((item) => item.key === filterParam)
    ? (filterParam as RequestFilterKey)
    : 'all';

  const [items, setItems] = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilterKey>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(requestIdParam);
  const [decisionNote, setDecisionNote] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [decisionPrompt, setDecisionPrompt] = useState<DecisionPrompt | null>(null);

  const timelineCacheRef = useRef<Record<string, TimelineEvent[]>>({});
  const timelineRequestRef = useRef(0);

  const buildFallbackTimeline = useCallback(
    (item: CustomerOrderItem): TimelineEvent[] => {
      const fallbackEvents: TimelineEvent[] = [
        {
          id: `${item.id}-created`,
          description: item.subject
            ? `${t('Request submitted')}: ${item.subject}`
            : t('Request submitted'),
          timestamp: item.createdAt,
          actor: t('You'),
          accent: 'neutral',
        },
      ];

      if (item.providerResponse) {
        fallbackEvents.push({
          id: `${item.id}-provider-response`,
          description: item.providerResponse,
          timestamp: item.updatedAt,
          actor: item.provider.companyName,
          accent: 'warning',
        });
      }

      if (item.quotedPrice) {
        fallbackEvents.push({
          id: `${item.id}-quote`,
          description: `${t('Quote Ready')}: ${formatCurrencyValue(
            item.quotedPrice,
            item.currencyCode
          )}`,
          timestamp: item.updatedAt,
          actor: item.provider.companyName,
          accent: 'info',
        });
      }

      if (item.updatedAt !== item.createdAt) {
        fallbackEvents.push({
          id: `${item.id}-status`,
          description: t(getRequestStatusMeta(item.status).nextAction),
          timestamp: item.updatedAt,
          actor: item.provider.companyName,
          accent: item.status === 'cancelled' || item.status === 'rejected' ? 'danger' : 'success',
        });
      }

      return fallbackEvents.sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );
    },
    [t]
  );

  const buildTimelineFromMessages = useCallback(
    (item: CustomerOrderItem, messages: ConversationMessageItem[]) => {
      const mapped = messages.map<TimelineEvent>((message) => ({
        id: message.id,
        description: message.body,
        timestamp: message.createdAt,
        actor:
          message.senderRole === 'customer'
            ? t('You')
            : message.senderName || item.provider.companyName,
        accent: getTimelineAccent(message),
      }));

      const hasCreatedEvent = mapped.some((event) =>
        event.description.toLowerCase().includes('new service request created')
      );

      if (!hasCreatedEvent) {
        mapped.push({
          id: `${item.id}-created`,
          description: item.subject
            ? `${t('Request submitted')}: ${item.subject}`
            : t('Request submitted'),
          timestamp: item.createdAt,
          actor: t('You'),
          accent: 'neutral',
        });
      }

      return mapped.sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      );
    },
    [t]
  );

  const loadTimeline = useCallback(
    async (item: CustomerOrderItem, options?: { force?: boolean }) => {
      if (!item.conversationId) {
        setTimelineEvents(buildFallbackTimeline(item));
        setTimelineLoading(false);
        return;
      }

      const cached = timelineCacheRef.current[item.conversationId];
      if (cached && !options?.force) {
        setTimelineEvents(cached);
        setTimelineLoading(false);
        return;
      }

      const requestToken = ++timelineRequestRef.current;
      setTimelineLoading(true);

      try {
        const response = await api.get(`/messages/conversations/${item.conversationId}/messages`);
        const messages: ConversationMessageItem[] = Array.isArray(response.data?.data?.messages)
          ? response.data.data.messages
          : [];
        const nextEvents = buildTimelineFromMessages(item, messages);

        if (requestToken !== timelineRequestRef.current) {
          return;
        }

        timelineCacheRef.current[item.conversationId] = nextEvents;
        setTimelineEvents(nextEvents);
      } catch (error) {
        console.error('Failed to load request timeline', error);

        if (requestToken !== timelineRequestRef.current) {
          return;
        }

        setTimelineEvents(buildFallbackTimeline(item));
      } finally {
        if (requestToken === timelineRequestRef.current) {
          setTimelineLoading(false);
        }
      }
    },
    [buildFallbackTimeline, buildTimelineFromMessages]
  );

  const load = useCallback(
    async (preferredId?: string | null, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await api.get('/orders/customer');
        const data = Array.isArray(response.data?.data) ? response.data.data : [];
        setItems(data);
        setSelectedId((current) => {
          const requested = preferredId || current;
          if (requested && data.some((item: CustomerOrderItem) => item.id === requested)) {
            return requested;
          }

          return data[0]?.id || null;
        });
      } catch (error) {
        console.error(error);
        toast.error(t('Failed to load your requests.'));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [t]
  );

  useEffect(() => {
    void load(requestIdParam);
  }, [load, requestIdParam]);

  useEffect(() => {
    if (!requestIdParam) return;
    setSelectedId(requestIdParam);
  }, [requestIdParam]);

  useEffect(() => {
    if (!REQUEST_FILTERS.some((item) => item.key === filterParam)) {
      return;
    }

    setFilter(filterParam as RequestFilterKey);
  }, [filterParam]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', filter);

    if (selectedId) {
      nextParams.set('requestId', selectedId);
    } else {
      nextParams.delete('requestId');
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filter, searchParams, selectedId, setSearchParams]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesRequestFilter(item.status, filter)),
    [filter, items]
  );

  useEffect(() => {
    if (!filteredItems.length) return;
    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );
  const activeRequestsCount = useMemo(
    () =>
      items.reduce((total, item) => {
        const meta = getRequestStatusMeta(item.status);
        const isOpen =
          item.status === 'new' || item.status === 'quoted' || meta.group === 'active';
        return total + (isOpen ? 1 : 0);
      }, 0),
    [items]
  );

  useEffect(() => {
    setDecisionNote(selected?.customerNote || '');
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setTimelineEvents([]);
      setTimelineLoading(false);
      return;
    }

    void loadTimeline(selected);
  }, [loadTimeline, selected]);

  const noteDirty = decisionNote !== (selected?.customerNote || '');
  const canAcceptQuote = selected?.status === 'quoted';
  const canRejectQuote = selected?.status === 'quoted';
  const canCancelRequest = Boolean(
    selected && ['new', 'reviewed', 'quoted'].includes(selected.status)
  );

  const persistCustomerUpdate = async (payload: {
    status?: 'accepted' | 'rejected' | 'cancelled';
    customerNote?: string | null;
    successMessage: string;
  }) => {
    if (!selected) return;

    const isDecisionAction = Boolean(payload.status);

    try {
      if (isDecisionAction) {
        setActionLoadingId(selected.id);
      } else {
        setSavingNote(true);
      }

      await api.patch(`/orders/${selected.id}/customer`, {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.customerNote !== undefined ? { customerNote: payload.customerNote } : {}),
      });

      if (selected.conversationId) {
        delete timelineCacheRef.current[selected.conversationId];
      }

      toast.success(t(payload.successMessage));
      await load(selected.id, { silent: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to update the request.'));
    } finally {
      setActionLoadingId(null);
      setSavingNote(false);
      setDecisionPrompt(null);
    }
  };

  const goToConversation = (item: CustomerOrderItem) => {
    if (item.conversationId) {
      navigate(`/customer/messages?conversationId=${item.conversationId}`);
      return;
    }

    const serviceIdParam = item.service?.id ? `&serviceId=${item.service.id}` : '';
    navigate(`/customer/messages?providerId=${item.provider.id}${serviceIdParam}`);
  };

  const selectedStatusVisual = getStatusVisual(selected?.status);
  const SelectedStatusIcon = selectedStatusVisual.icon;
  const selectedCategory =
    selected?.service?.categoryName || selected?.provider.primaryCategoryName || t('No category');
  const selectedQuoteAmount = selected?.quote?.amount || selected?.quotedPrice;
  const providerRating =
    selected?.provider.averageRating !== undefined && selected?.provider.averageRating !== null
      ? Number(selected.provider.averageRating)
      : null;

  const renderStateCard = () => {
    if (!selected) return null;

    if (selectedQuoteAmount) {
      return (
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <span className="text-sm font-semibold text-slate-500">{t('Quote')}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Calendar size={13} />
              {selected?.preferredDate
                ? `${t('Preferred date')} ${formatCompactDate(selected.preferredDate, locale)}`
                : `${t('Updated')} ${formatCompactDate(
                    selected?.quote?.updatedAt || selected?.updatedAt,
                    locale
                  )}`}
            </span>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-semibold tracking-tight text-slate-950">
                {formatCurrencyValue(selectedQuoteAmount, selected.currencyCode)}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('Expected budget')}
                </div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {formatMoneyRange(selected.budgetMin, selected.budgetMax, selected.currencyCode)}
                </div>
              </div>

              <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('Service')}
                </div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {selected.service?.name || selected.subject || t('Service request')}
                </div>
              </div>

              {selected.service?.price ? (
                <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {t('Service price')}
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {formatCurrencyValue(
                      selected.service.price,
                      selected.service.currencyCode || selected.currencyCode
                    )}
                  </div>
                </div>
              ) : null}

              {selected.preferredDate ? (
                <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {t('Preferred date')}
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900">
                    {formatRequestDate(selected.preferredDate)}
                  </div>
                </div>
              ) : null}
            </div>

            {selected.providerResponse ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('Provider response')}
                </p>
                <p className="rounded-[16px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  {selected.providerResponse}
                </p>
              </div>
            ) : null}

            {canAcceptQuote ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    void persistCustomerUpdate({
                      status: 'accepted',
                      customerNote: decisionNote.trim() || null,
                      successMessage: 'Request updated.',
                    })
                  }
                  disabled={actionLoadingId === selected.id}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {t('Accept quote')}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  {canRejectQuote ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionPrompt({
                          status: 'rejected',
                          title: t('Reject Quote'),
                          description: t(
                            'Are you sure you want to reject this quote? You can still continue the conversation with the provider.'
                          ),
                          confirmLabel: t('Reject quote'),
                        })
                      }
                      disabled={actionLoadingId === selected.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('Reject quote')}
                    </button>
                  ) : null}

                  {canCancelRequest ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionPrompt({
                          status: 'cancelled',
                          title: t('Cancel Request'),
                          description: t(
                            'Are you sure you want to cancel this request? This action cannot be undone.'
                          ),
                          confirmLabel: t('Cancel request'),
                        })
                      }
                      disabled={actionLoadingId === selected.id}
                      className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('Cancel request')}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    if (selected.status === 'new' || selected.status === 'reviewed') {
      return (
        <section className="rounded-[20px] border border-amber-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-950">{t('Awaiting Quote')}</h3>
              <p className="mt-1 text-sm leading-7 text-slate-600">
                {selected.providerResponse
                  ? selected.providerResponse
                  : t(
                      'The provider is reviewing your request. You will see the next commercial update here.'
                    )}
              </p>
            </div>
          </div>

          {canCancelRequest ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() =>
                  setDecisionPrompt({
                    status: 'cancelled',
                    title: t('Cancel Request'),
                    description: t(
                      'Are you sure you want to cancel this request? This action cannot be undone.'
                    ),
                    confirmLabel: t('Cancel request'),
                  })
                }
                disabled={actionLoadingId === selected.id}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('Cancel request')}
              </button>
            </div>
          ) : null}
        </section>
      );
    }

    if (selected.status === 'accepted' || selected.status === 'in_progress') {
      return (
        <section className="rounded-[20px] border border-blue-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              {selected.status === 'in_progress' ? (
                <Loader2 size={18} className="animate-spin text-blue-600" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-950">
                {t(selected.status === 'in_progress' ? 'Work in Progress' : 'Quote accepted')}
              </h3>
              <p className="mt-1 text-sm leading-7 text-slate-600">
                {selected.providerResponse
                  ? selected.providerResponse
                  : t(getRequestStatusMeta(selected.status).nextAction)}
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (selected.status === 'completed') {
      return (
        <section className="rounded-[20px] border border-emerald-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-950">{t('Request Completed')}</h3>
              <p className="mt-1 text-sm leading-7 text-slate-600">
                {selected.providerResponse
                  ? selected.providerResponse
                  : t('This request has been completed successfully.')}
              </p>

              <button
                type="button"
                onClick={() => navigate(`/providers/${selected.provider.id}`)}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t('Open provider profile')}
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="rounded-[20px] border border-rose-200 bg-rose-50/40 px-5 py-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            <XCircle size={18} className="text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-950">
              {t(selected.status === 'rejected' ? 'Quote rejected' : 'Request Cancelled')}
            </h3>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              {selected.status === 'rejected'
                ? t('This quote was rejected and is no longer active.')
                : t('This request was cancelled and is no longer active.')}
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <CustomerWorkspaceTopNav currentPage="requests" activeRequestsCount={activeRequestsCount} variant="v0" />

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white xl:w-[380px] xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-200 px-5 py-5">
          <h2 className="text-lg font-semibold text-slate-950">{t('My requests')}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {filteredItems.length} {t('Requests')}
          </p>
        </div>

        <div className="border-b border-slate-200 px-4 py-3">
          <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1">
            {REQUEST_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  filter === item.key
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-pressed={filter === item.key}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <Loader2 size={28} className="animate-spin text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">{t('Loading requests...')}</p>
            </div>
          ) : !filteredItems.length ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <FileText size={32} className="text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">{t('No requests found')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item) => {
                const visual = getStatusVisual(item.status);
                const StatusIcon = visual.icon;
                const isSelected = item.id === selectedId;
                const title = item.subject || item.service?.name || t('Service request');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-[16px] px-3 py-3 text-left transition ${
                      isSelected
                        ? 'bg-slate-100 ring-1 ring-slate-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            isSelected ? 'text-slate-950' : 'text-slate-900/90'
                          }`}
                        >
                          {title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {item.provider.companyName}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${visual.badgeClassName}`}
                      >
                        <StatusIcon
                          size={11}
                          className={item.status === 'in_progress' ? 'animate-spin' : undefined}
                        />
                        <span>{t(visual.label)}</span>
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        {formatCompactDate(item.updatedAt, locale)}
                      </span>

                      <span className="text-xs font-medium text-slate-900">
                        {item.quotedPrice
                          ? formatCurrencyValue(item.quotedPrice, item.currencyCode)
                          : formatMoneyRange(item.budgetMin, item.budgetMax, item.currencyCode)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="mx-auto flex min-h-[100dvh] max-w-3xl items-center justify-center px-6 py-10">
            <div className="rounded-[24px] border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
              <FileText size={32} className="mx-auto text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {t('Select a request from the list to review the full detail and next actions.')}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-[24px] font-semibold tracking-tight text-slate-950">
                      {selected.subject || selected.service?.name || t('Service request')}
                    </h1>
                    <p className="text-sm text-slate-500">{selectedCategory}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${selectedStatusVisual.badgeClassName}`}
                  >
                    <SelectedStatusIcon
                      size={16}
                      className={
                        selected.status === 'in_progress' ? 'animate-spin' : selectedStatusVisual.iconClassName
                      }
                    />
                    {t(selectedStatusVisual.label)}
                  </span>
                </div>

                <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {selected.provider.avatarUrl ? (
                          <img
                            src={selected.provider.avatarUrl}
                            alt={selected.provider.companyName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(selected.provider.companyName || 'PS')
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-950">
                            {selected.provider.companyName}
                          </span>
                          {selected.provider.isVerified ? (
                            <BadgeCheck size={16} className="text-blue-600" />
                          ) : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {providerRating ? (
                            <span className="inline-flex items-center gap-1">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {providerRating.toFixed(1)}
                            </span>
                          ) : null}

                          {selected.provider.reviewsCount ? (
                            <>
                              <span>&bull;</span>
                              <span>
                                {selected.provider.reviewsCount} {t('reviews')}
                              </span>
                            </>
                          ) : null}

                          {selected.provider.responseTimeMinutes ? (
                            <>
                              <span>&bull;</span>
                              <span>{formatResponseTime(selected.provider.responseTimeMinutes)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => goToConversation(selected)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <MessageSquare size={14} />
                      {t('Open conversation')}
                    </button>
                  </div>
                </section>
              </section>

              {renderStateCard()}

              <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <StickyNote size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-950">{t('Your Note')}</span>
                </div>

                <textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder={t('Add a personal note about this request...')}
                  className="min-h-[88px] w-full resize-none rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                />

                {noteDirty ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        void persistCustomerUpdate({
                          customerNote: decisionNote.trim() || null,
                          successMessage: 'Note saved.',
                        })
                      }
                      disabled={savingNote}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t(savingNote ? 'Saving...' : 'Save Note')}
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <h3 className="text-sm font-medium text-slate-950">{t('Request Timeline')}</h3>

                {timelineLoading ? (
                  <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
                    <Loader2 size={16} className="animate-spin" />
                    {t('Loading timeline...')}
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {timelineEvents.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`mt-1.5 h-2 w-2 rounded-full ${
                              event.accent === 'success'
                                ? 'bg-emerald-500'
                                : event.accent === 'info'
                                  ? 'bg-blue-500'
                                  : event.accent === 'danger'
                                    ? 'bg-rose-500'
                                    : event.accent === 'warning'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-300'
                            }`}
                          />
                          {index < timelineEvents.length - 1 ? (
                            <div className="mt-1 w-px flex-1 bg-slate-200" />
                          ) : null}
                        </div>

                        <div className="flex-1 pb-4">
                          <p className="text-sm leading-7 text-slate-800">{event.description}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatRequestDate(event.timestamp)}</span>
                            {event.actor ? (
                              <>
                                <span>&bull;</span>
                                <span>{event.actor}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <h3 className="text-sm font-medium text-slate-950">{t('Request Details')}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{selected.description}</p>

                <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t('Created')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {formatRequestDate(selected.createdAt)}
                    </div>
                  </div>

                  <div className="rounded-[16px] bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {t('Updated')}
                    </div>
                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {formatRequestDate(selected.updatedAt)}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {decisionPrompt && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-50">
                <AlertCircle size={20} className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-950">{decisionPrompt.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {decisionPrompt.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecisionPrompt(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={() =>
                  void persistCustomerUpdate({
                    status: decisionPrompt.status,
                    customerNote: decisionNote.trim() || null,
                    successMessage: 'Request updated.',
                  })
                }
                disabled={actionLoadingId === selected.id}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoadingId === selected.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {decisionPrompt.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      </div>
    </div>
  );
};

export default CustomerOrders;
