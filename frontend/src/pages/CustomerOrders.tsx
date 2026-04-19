import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  MessageSquare,
  Wallet,
  XCircle,
} from 'lucide-react';
import RequestStatusBadge from '../components/requests/RequestStatusBadge';
import api from '../config/api';
import { useI18n } from '../i18n';
import {
  formatMoney,
  formatMoneyRange,
  formatRequestDate,
  getRequestStatusMeta,
  getRequestsCountByFilter,
  matchesRequestFilter,
  RequestFilterKey,
  REQUEST_FILTERS,
} from '../lib/service-request';
import '../styles/app-primitives.css';
import '../styles/service-request.css';

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
  };
  service?: {
    id: string;
    name: string;
  } | null;
}

const REQUEST_FLOW = [
  { key: 'new', label: 'Created' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const getFlowState = (currentStatus?: string | null, stepKey?: string) => {
  if (!currentStatus || !stepKey) return 'upcoming';

  if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
    const currentIndex = REQUEST_FLOW.findIndex((item) => item.key === 'quoted');
    const stepIndex = REQUEST_FLOW.findIndex((item) => item.key === stepKey);

    if (stepIndex !== -1 && stepIndex <= currentIndex) {
      return 'done';
    }

    return 'upcoming';
  }

  const currentIndex = REQUEST_FLOW.findIndex((item) => item.key === currentStatus);
  const stepIndex = REQUEST_FLOW.findIndex((item) => item.key === stepKey);

  if (currentIndex === -1 || stepIndex === -1) return 'upcoming';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
};

const fallbackAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=80';

const CustomerOrders: React.FC = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const filterParam = searchParams.get('tab');
  const initialFilter = REQUEST_FILTERS.some((item) => item.key === filterParam)
    ? (filterParam as RequestFilterKey)
    : 'all';

  const [items, setItems] = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilterKey>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(requestIdParam);
  const [decisionNote, setDecisionNote] = useState('');

  const navigate = useNavigate();

  const load = useCallback(async (preferredId?: string | null) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [t]);

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
    if (!selectedId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('requestId', selectedId);
    nextParams.set('tab', filter);

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

  const selectedStatusMeta = getRequestStatusMeta(selected?.status);

  useEffect(() => {
    setDecisionNote(selected?.customerNote || '');
  }, [selected]);

  const updateCustomerDecision = async (
    status: 'accepted' | 'rejected' | 'cancelled'
  ) => {
    if (!selected) return;

    try {
      setActionLoadingId(selected.id);
      await api.patch(`/orders/${selected.id}/customer`, {
        status,
        customerNote: decisionNote.trim() || null,
      });
      toast.success(t('Request updated.'));
      await load(selected.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to update the request.'));
    } finally {
      setActionLoadingId(null);
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

  const summaryCards = [
    {
      label: 'All requests',
      value: items.length,
      caption: 'Every service request and quote connected to your account.',
      icon: ClipboardList,
    },
    {
      label: 'Quotes received',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'quoted'
      ),
      caption: 'Requests currently waiting for your approval or rejection.',
      icon: Wallet,
    },
    {
      label: 'Active requests',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'active'
      ),
      caption: 'Requests currently open or already moving into execution.',
      icon: CheckCircle2,
    },
    {
      label: 'Closed requests',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'closed'
      ),
      caption: 'Completed, cancelled, or rejected requests.',
      icon: XCircle,
    },
  ];

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Request workspace')}
            </div>
            <h2 className="mt-2 text-[30px] font-black tracking-tight text-slate-900">
              {t('Requests, quotes, and next decisions')}
            </h2>
            <div className="mt-3 max-w-[760px] text-[15px] leading-8 text-slate-600">
              {t(
                'Follow every request from first contact to quote, approval, execution, and closure without leaving the customer workspace.'
              )}
            </div>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {t('Waiting for you')}
              </div>
              <div className="mt-2 text-[24px] font-black text-slate-900">
                {getRequestsCountByFilter(
                  items.map((item) => item.status),
                  'quoted'
                )}
              </div>
            </div>
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {t('Linked conversations')}
              </div>
              <div className="mt-2 text-[24px] font-black text-slate-900">
                {items.filter((item) => item.conversationId).length}
              </div>
            </div>
          </div>
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

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="psp-surface xl:sticky xl:top-6 xl:self-start">
          <div className="psp-surface__header">
            <div>
              <h2>{t('Your requests')}</h2>
              <div className="psp-surface__sub">
                {t('Keep one focused shortlist of all request workflows.')}
              </div>
            </div>
          </div>

          <div className="psp-control-bar mb-5">
            {REQUEST_FILTERS.map((item) => (
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
            <div className="psp-empty-state">{t('Loading requests...')}</div>
          ) : !filteredItems.length ? (
            <div className="psp-empty-state">{t('No requests match this filter right now.')}</div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((item) => {
                const isActive = selectedId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isActive
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">
                          {item.subject || item.service?.name || t('Service request')}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {item.provider.companyName}
                        </div>
                      </div>
                      <RequestStatusBadge status={item.status} />
                    </div>

                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                      <span>{formatRequestDate(item.updatedAt)}</span>
                      <span>
                        {item.quotedPrice
                          ? formatMoney(item.quotedPrice, item.currencyCode)
                          : formatMoneyRange(item.budgetMin, item.budgetMax, item.currencyCode)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="psp-page-stack">
          {!selected ? (
            <div className="psp-empty-state">
              {t('Select a request from the list to review the full detail and next actions.')}
            </div>
          ) : (
            <>
              <article className="psp-surface">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={selected.provider.avatarUrl || fallbackAvatar}
                      alt={selected.provider.companyName}
                      className="h-16 w-16 rounded-[22px] object-cover"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[28px] font-black tracking-tight text-slate-900">
                          {selected.subject || selected.service?.name || t('Service request')}
                        </h2>
                        <RequestStatusBadge status={selected.status} />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{selected.provider.companyName}</span>
                        <span>•</span>
                        <span>{formatRequestDate(selected.updatedAt)}</span>
                        {selected.provider.isVerified ? (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 size={14} />
                              {t('Verified')}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToConversation(selected)}
                    className="psp-button psp-button--secondary"
                  >
                    <MessageSquare size={16} />
                    {t('Open conversation')}
                  </button>
                </div>
              </article>

              <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Wallet size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Expected budget')}</div>
                  <div className="text-[20px] font-black tracking-tight text-slate-900">
                    {formatMoneyRange(
                      selected.budgetMin,
                      selected.budgetMax,
                      selected.currencyCode
                    )}
                  </div>
                </article>

                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <ClipboardList size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Current quote')}</div>
                  <div className="text-[20px] font-black tracking-tight text-slate-900">
                    {selected.quotedPrice
                      ? formatMoney(selected.quotedPrice, selected.currencyCode)
                      : t('No quote yet')}
                  </div>
                </article>

                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <CalendarDays size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Preferred date')}</div>
                  <div className="text-[20px] font-black tracking-tight text-slate-900">
                    {formatRequestDate(selected.preferredDate)}
                  </div>
                </article>

                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Next step')}</div>
                  <div className="text-[16px] font-black tracking-tight text-slate-900">
                    {t(selectedStatusMeta.label)}
                  </div>
                </article>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Request summary')}</h2>
                      <div className="psp-surface__sub">
                        {t('Original request details, provider response, and what happens next.')}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[24px] bg-slate-50 p-5">
                      <div className="text-sm font-black text-slate-900">{t('Description')}</div>
                      <div className="mt-3 text-[15px] leading-8 text-slate-700">
                        {selected.description}
                      </div>
                    </div>

                    {selected.providerResponse ? (
                      <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
                        <div className="text-sm font-black text-slate-900">{t('Provider response')}</div>
                        <div className="mt-3 text-[15px] leading-8 text-slate-700">
                          {selected.providerResponse}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="text-sm font-black text-slate-900">{t('What should happen now')}</div>
                      <div className="mt-3 text-[15px] leading-8 text-slate-700">
                        {t(selectedStatusMeta.nextAction)}
                      </div>
                    </div>
                  </div>
                </article>

                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Lifecycle')}</h2>
                      <div className="psp-surface__sub">
                        {t('A clean visual view of the current stage.')}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {REQUEST_FLOW.map((step) => {
                      const state = getFlowState(selected.status, step.key);

                      return (
                        <div
                          key={step.key}
                          className={`flex items-center gap-4 rounded-[22px] px-4 py-4 ${
                            state === 'done'
                              ? 'bg-emerald-50'
                              : state === 'current'
                                ? 'bg-blue-50'
                                : 'bg-slate-50'
                          }`}
                        >
                          <div
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                              state === 'done'
                                ? 'bg-emerald-600 text-white'
                                : state === 'current'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {state === 'done' ? (
                              <CheckCircle2 size={18} />
                            ) : state === 'current' ? (
                              <CircleDashed size={18} />
                            ) : (
                              <CircleDashed size={18} />
                            )}
                          </div>

                          <div>
                            <div className="text-sm font-black text-slate-900">{t(step.label)}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              {t(getRequestStatusMeta(step.key).nextAction)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {selected.status === 'rejected' ? (
                      <div className="rounded-[22px] bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                        {t('This request was rejected.')}
                      </div>
                    ) : null}

                    {selected.status === 'cancelled' ? (
                      <div className="rounded-[22px] bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                        {t('This request was cancelled.')}
                      </div>
                    ) : null}
                  </div>
                </article>
              </div>

              <article className="psp-surface">
                <div className="psp-surface__header">
                  <div>
                      <h2>{t('Your notes and decisions')}</h2>
                      <div className="psp-surface__sub">
                        {t('Keep a note, then take the right customer-side action.')}
                      </div>
                    </div>
                  </div>

                <textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value)}
                  placeholder={t('Add a note before accepting, rejecting, or cancelling this request...')}
                  className="psp-textarea"
                />

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => goToConversation(selected)}
                    className="psp-button psp-button--secondary"
                  >
                    <MessageSquare size={16} />
                    {t('Open conversation')}
                  </button>

                  {selected.status === 'quoted' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void updateCustomerDecision('accepted')}
                        disabled={actionLoadingId === selected.id}
                        className="psp-button psp-button--primary"
                      >
                        {t('Accept quote')}
                      </button>

                      <button
                        type="button"
                        onClick={() => void updateCustomerDecision('rejected')}
                        disabled={actionLoadingId === selected.id}
                        className="psp-button psp-button--danger"
                      >
                        {t('Reject quote')}
                      </button>
                    </>
                  ) : null}

                  {['new', 'reviewed', 'quoted'].includes(selected.status) ? (
                    <button
                      type="button"
                      onClick={() => void updateCustomerDecision('cancelled')}
                      disabled={actionLoadingId === selected.id}
                      className="psp-button psp-button--danger"
                    >
                      {t('Cancel request')}
                    </button>
                  ) : null}
                </div>
              </article>
            </>
          )}
        </section>
      </section>
    </div>
  );
};

export default CustomerOrders;
