import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Mail,
  MessageSquare,
  Phone,
  Wallet,
  Workflow,
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

interface ProviderRequestItem {
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
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
  };
  service?: {
    id: string;
    name: string;
  } | null;
}

const REQUEST_FLOW = [
  { key: 'new', label: 'New lead' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'quoted', label: 'Quote sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const providerStatusOptions = [
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'quoted', label: 'Quote sent' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
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

const getCustomerName = (item?: ProviderRequestItem | null, fallback = 'Customer') =>
  `${item?.customer.firstName || ''} ${item?.customer.lastName || ''}`.trim() || fallback;

const getRequestHeading = (item?: ProviderRequestItem | null, fallback = 'Service request') =>
  item?.subject || item?.service?.name || fallback;

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

const ProviderRequests: React.FC = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');
  const filterParam = searchParams.get('tab');
  const initialFilter = REQUEST_FILTERS.some((item) => item.key === filterParam)
    ? (filterParam as RequestFilterKey)
    : 'all';

  const [items, setItems] = useState<ProviderRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<RequestFilterKey>(initialFilter);
  const [selectedId, setSelectedId] = useState<string | null>(requestIdParam);
  const [form, setForm] = useState({
    status: 'reviewed',
    quotedPrice: '',
    providerResponse: '',
  });

  const navigate = useNavigate();

  const load = useCallback(async (preferredId?: string | null) => {
    try {
      setLoading(true);
      const response = await api.get('/orders/provider');
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setItems(data);
      setSelectedId((current) => {
        const requested = preferredId || current;
        if (requested && data.some((item: ProviderRequestItem) => item.id === requested)) {
          return requested;
        }
        return data[0]?.id || null;
      });
    } catch (error) {
      console.error(error);
      toast.error(t('Failed to load provider requests.'));
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
    if (!selectedId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('requestId', selectedId);
    nextParams.set('tab', filter);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filter, searchParams, selectedId, setSearchParams]);

  useEffect(() => {
    if (!REQUEST_FILTERS.some((item) => item.key === filterParam)) {
      return;
    }

    setFilter(filterParam as RequestFilterKey);
  }, [filterParam]);

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
  const selectedCustomerName = getCustomerName(selected, t('Customer'));
  const selectedRequestHeading = getRequestHeading(selected, t('Service request'));
  const needsActionCount = items.filter((item) =>
    ['new', 'reviewed'].includes(item.status)
  ).length;
  const linkedConversationCount = items.filter((item) => item.conversationId).length;
  const executionCount = items.filter((item) =>
    ['accepted', 'in_progress'].includes(item.status)
  ).length;
  const statusOptions = useMemo(() => {
    if (!selected?.status) {
      return providerStatusOptions;
    }

    const exists = providerStatusOptions.some((option) => option.value === selected.status);
    if (exists) {
      return providerStatusOptions;
    }

    return [
      {
        value: selected.status,
        label: `${getRequestStatusMeta(selected.status).label} (${t('Current')})`,
      },
      ...providerStatusOptions,
    ];
  }, [selected?.status, t]);

  useEffect(() => {
    if (!selected) return;

    setForm({
      status: selected.status || 'reviewed',
      quotedPrice: selected.quotedPrice || '',
      providerResponse: selected.providerResponse || '',
    });
  }, [selected]);

  const saveUpdate = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      await api.patch(`/orders/${selected.id}/provider`, {
        status: form.status,
        quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : null,
        providerResponse: form.providerResponse.trim() || null,
      });

      toast.success(t('Request updated.'));
      await load(selected.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to update the request.'));
    } finally {
      setSaving(false);
    }
  };

  const openConversation = () => {
    if (!selected) return;

    if (selected.conversationId) {
      navigate(`/provider/messages?conversationId=${selected.conversationId}`);
      return;
    }

    navigate('/provider/messages');
  };

  const summaryCards = [
    {
      label: 'All requests',
      value: items.length,
      caption: 'Every incoming lead and request sent to this provider profile.',
      icon: ClipboardList,
    },
    {
      label: 'New leads',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'new'
      ),
      caption: 'Fresh inbound demand that still needs a first provider review.',
      icon: Workflow,
    },
    {
      label: 'Quotes awaiting decision',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'quoted'
      ),
      caption: 'Quotes already sent and still waiting for the customer response.',
      icon: Wallet,
    },
    {
      label: 'In execution',
      value: executionCount,
      caption: 'Accepted or active requests already moving into delivery.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Lead execution workspace')}
            </div>
            <h2 className="mt-2 text-[30px] font-black tracking-tight text-slate-900">
              {t('Provider requests, quotes, and delivery flow')}
            </h2>
            <div className="mt-3 max-w-[760px] text-[15px] leading-8 text-slate-600">
              {t(
                'Review each brief, quote with clarity, keep the customer conversation close, and move accepted work into execution without leaving the provider shell.'
              )}
            </div>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {t('Needs provider action')}
              </div>
              <div className="mt-2 text-[24px] font-black text-slate-900">{needsActionCount}</div>
            </div>
            <div className="rounded-[22px] bg-slate-50 px-4 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {t('Linked conversations')}
              </div>
              <div className="mt-2 text-[24px] font-black text-slate-900">
                {linkedConversationCount}
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
              <h2>{t('Lead inbox')}</h2>
              <div className="psp-surface__sub">
                {t('Keep one compact list of active briefs, quotes, and delivery updates.')}
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
            <div className="psp-empty-state">{t('Loading provider requests...')}</div>
          ) : !filteredItems.length ? (
            <div className="psp-empty-state">
              {t('No provider requests match this filter right now.')}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.map((item) => {
                const isActive = selectedId === item.id;
                const customerName = getCustomerName(item, t('Customer'));

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
                    <div className="flex items-start gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-100 text-sm font-black text-slate-700">
                        {getInitials(customerName || t('CU'))}
                    </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-900">
                              {customerName}
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                              {item.customer.email}
                            </div>
                          </div>
                          <RequestStatusBadge status={item.status} />
                        </div>

                        <div className="mt-3 truncate text-sm font-semibold text-slate-800">
                          {getRequestHeading(item, t('Service request'))}
                        </div>

                        <div
                          className="mt-2 text-sm leading-6 text-slate-600"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.description}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {item.service?.name ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {item.service.name}
                            </span>
                          ) : null}

                          {item.conversationId ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {t('Conversation linked')}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                          <span>{formatRequestDate(item.updatedAt)}</span>
                          <span>
                            {formatMoneyRange(item.budgetMin, item.budgetMax, item.currencyCode)}
                          </span>
                        </div>
                      </div>
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
              {t(
                'Select a request from the list to review the full brief, customer context, and next provider action.'
              )}
            </div>
          ) : (
            <>
              <article className="psp-surface">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-lg font-black text-slate-700">
                      {getInitials(selectedCustomerName || t('CU'))}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[28px] font-black tracking-tight text-slate-900">
                          {selectedRequestHeading}
                        </h2>
                        <RequestStatusBadge status={selected.status} />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span>{selectedCustomerName}</span>
                        <span>|</span>
                        <span>{selected.customer.email}</span>
                        {selected.customer.phoneNumber ? (
                          <>
                            <span>|</span>
                            <span>{selected.customer.phoneNumber}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openConversation}
                    className="psp-button psp-button--secondary"
                  >
                    <MessageSquare size={16} />
                    {t(selected.conversationId ? 'Open linked conversation' : 'Open inbox')}
                  </button>
                </div>
              </article>

              <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Wallet size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Requested budget')}</div>
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
                      : t('Not quoted yet')}
                  </div>
                </article>

                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <CalendarDays size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Desired date')}</div>
                  <div className="text-[20px] font-black tracking-tight text-slate-900">
                    {formatRequestDate(selected.preferredDate)}
                  </div>
                </article>

                <article className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Workflow size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{t('Next operational action')}</div>
                  <div className="text-[16px] font-black tracking-tight text-slate-900">
                    {t(selectedStatusMeta.nextAction)}
                  </div>
                </article>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Request brief')}</h2>
                      
                      <div className="psp-surface__sub">
                        {t('The customer summary, latest note, and service scope in one view.')}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="rounded-[24px] bg-slate-50 p-5">
                      <div className="text-sm font-black text-slate-900">{t('Customer description')}</div>
                      <div className="mt-3 text-[15px] leading-8 text-slate-700">
                        {selected.description}
                      </div>
                    </div>

                    {selected.customerNote ? (
                      <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
                        <div className="text-sm font-black text-slate-900">{t('Latest customer note')}</div>
                        <div className="mt-3 text-[15px] leading-8 text-slate-700">
                          {selected.customerNote}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="text-sm font-black text-slate-900">{t('Commercial context')}</div>
                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3">
                          <span className="text-sm font-semibold text-slate-500">{t('Service')}</span>
                          <span className="text-sm font-black text-slate-900">
                            {selected.service?.name || t('General request')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3">
                          <span className="text-sm font-semibold text-slate-500">{t('Created')}</span>
                          <span className="text-sm font-black text-slate-900">
                            {formatRequestDate(selected.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3">
                          <span className="text-sm font-semibold text-slate-500">
                            {t('Conversation')}
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {t(selected.conversationId ? 'Linked and ready' : 'No linked thread')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Lifecycle')}</h2>
                      
                      <div className="psp-surface__sub">
                        {t('See where the request sits and what the customer sees next.')}
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
                        {t('This request was rejected and is no longer active.')}
                      </div>
                    ) : null}

                    {selected.status === 'cancelled' ? (
                      <div className="rounded-[22px] bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                        {t('This request was cancelled by the customer.')}
                      </div>
                    ) : null}
                  </div>
                </article>
              </div>

              <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Customer context')}</h2>
                      
                      <div className="psp-surface__sub">
                        {t('Contact details and timing information for the current request.')}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4">
                      <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
                          <Mail size={18} />
                        </span>
                        {t('Email')}
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {selected.customer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4">
                      <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
                          <Phone size={18} />
                        </span>
                        {t('Phone')}
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {selected.customer.phoneNumber || t('Not available')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4">
                      <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
                          <CalendarDays size={18} />
                        </span>
                        {t('Last updated')}
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {formatRequestDate(selected.updatedAt)}
                      </span>
                    </div>

                    <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
                      <div className="inline-flex items-center gap-2 text-sm font-black text-blue-700">
                        <MessageSquare size={16} />
                        {t('Conversation path')}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-700">
                        {t(
                          selected.conversationId
                            ? 'A linked customer thread already exists. Keep quote details and timeline updates close to the conversation.'
                            : 'No direct request thread is linked yet. Use the inbox when you need to continue the commercial discussion.'
                        )}
                      </div>
                    </div>
                  </div>
                </article>

                <article className="psp-surface">
                  <div className="psp-surface__header">
                    <div>
                      <h2>{t('Quote and status controls')}</h2>
                      
                      <div className="psp-surface__sub">
                        {t(
                          'Update the customer-facing status, attach a quote, and send the next clear response.'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <div className="text-sm font-black text-slate-900">{t('Next best action')}</div>
                    <div className="mt-3 text-[15px] leading-8 text-slate-700">
                      {t(selectedStatusMeta.nextAction)}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                        className="psp-select"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>

                      <input
                        value={form.quotedPrice}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            quotedPrice: event.target.value,
                          }))
                        }
                        placeholder={`${t('Quote amount')} (${selected.currencyCode})`}
                        className="psp-input"
                        inputMode="decimal"
                      />
                    </div>

                    <textarea
                      value={form.providerResponse}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          providerResponse: event.target.value,
                        }))
                      }
                      placeholder={t('Write the customer-facing response, quote explanation, or execution update...')}
                      className="psp-textarea"
                    />

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {t('Current quote')}
                      </div>
                      <div className="mt-2 text-[20px] font-black tracking-tight text-slate-900">
                        {selected.quotedPrice
                          ? formatMoney(selected.quotedPrice, selected.currencyCode)
                          : t('Not set yet')}
                      </div>
                      <div className="mt-2 text-sm leading-7 text-slate-600">
                        {t(
                          'Save updates only when the request status, quote amount, and response are ready for the customer to see.'
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={openConversation}
                        className="psp-button psp-button--secondary"
                      >
                        <MessageSquare size={16} />
                        {t(selected.conversationId ? 'Open linked conversation' : 'Open inbox')}
                      </button>

                      <button
                        type="button"
                        onClick={() => void saveUpdate()}
                        disabled={saving}
                        className="psp-button psp-button--primary"
                      >
                        {t(saving ? 'Saving...' : 'Save update')}
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
};

export default ProviderRequests;
