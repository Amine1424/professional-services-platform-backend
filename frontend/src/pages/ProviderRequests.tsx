import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RequestStatusBadge from '../components/requests/RequestStatusBadge';
import api from '../config/api';
import {
  formatMoney,
  formatMoneyRange,
  formatRequestDate,
  getRequestsCountByFilter,
  matchesRequestFilter,
  RequestFilterKey,
  REQUEST_FILTERS,
} from '../lib/service-request';
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

const providerStatusOptions = [
  { value: 'reviewed', label: 'تمت المراجعة' },
  { value: 'quoted', label: 'تم إرسال عرض' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'rejected', label: 'مرفوض' },
];

export const ProviderRequests: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  const [items, setItems] = useState<ProviderRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<RequestFilterKey>('all');
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
      toast.error('فشل تحميل طلبات المزود');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(requestIdParam);
  }, [load, requestIdParam]);

  useEffect(() => {
    if (!requestIdParam) {
      return;
    }

    setSelectedId(requestIdParam);
  }, [requestIdParam]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('requestId', selectedId);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, selectedId, setSearchParams]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesRequestFilter(item.status, filter)),
    [filter, items]
  );

  useEffect(() => {
    if (!filteredItems.length) {
      return;
    }

    if (!selectedId || !filteredItems.some((item) => item.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filteredItems, selectedId]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  useEffect(() => {
    if (!selected) {
      return;
    }

    setForm({
      status: selected.status || 'reviewed',
      quotedPrice: selected.quotedPrice || '',
      providerResponse: selected.providerResponse || '',
    });
  }, [selected]);

  const saveUpdate = async () => {
    if (!selected) {
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/orders/${selected.id}/provider`, {
        status: form.status,
        quotedPrice: form.quotedPrice ? Number(form.quotedPrice) : null,
        providerResponse: form.providerResponse.trim() || null,
      });

      toast.success('تم تحديث الطلب');
      await load(selected.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الطلب');
    } finally {
      setSaving(false);
    }
  };

  const openConversation = () => {
    if (!selected) {
      return;
    }

    if (selected.conversationId) {
      navigate(`/provider/messages?conversationId=${selected.conversationId}`);
      return;
    }

    navigate('/provider/messages');
  };

  const summaryCards = [
    {
      label: 'إجمالي الطلبات',
      value: items.length,
      caption: 'كل الـ leads والطلبات الواردة إلى البروفايل.',
    },
    {
      label: 'طلبات جديدة',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'new'
      ),
      caption: 'تحتاج مراجعة أولية أو رد سريع.',
    },
    {
      label: 'عروض بانتظار قرار',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'quoted'
      ),
      caption: 'تم إرسال سعر وتنتظر رد العميل.',
    },
    {
      label: 'طلبات مغلقة',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'closed'
      ),
      caption: 'مكتملة أو مرفوضة أو ملغاة.',
    },
  ];

  return (
    <div className="psp-request-page">
      <section className="psp-request-summary-grid">
        {summaryCards.map((item) => (
          <div key={item.label} className="psp-request-summary-card">
            <div className="psp-request-summary-card__label">{item.label}</div>
            <div className="psp-request-summary-card__value">{item.value}</div>
            <div className="psp-request-summary-card__caption">{item.caption}</div>
          </div>
        ))}
      </section>

      <div className="psp-request-workspace">
        <section className="psp-request-panel">
          <div className="psp-request-panel__header">
            <div>
              <h2>Inbox الطلبات</h2>
              <div className="psp-request-panel__sub">
                راجع كل lead، أرسل عرض السعر، ثم حوّله إلى تنفيذ فعلي.
              </div>
            </div>
            <RequestStatusBadge status={selected?.status} />
          </div>

          <div className="psp-request-filters">
            {REQUEST_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`psp-request-filter ${
                  filter === item.key ? 'psp-request-filter--active' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="psp-request-list-empty">جارٍ تحميل الطلبات...</div>
          ) : !filteredItems.length ? (
            <div className="psp-request-list-empty">
              لا توجد طلبات ضمن هذا التصنيف حالياً.
            </div>
          ) : (
            <div className="psp-request-list">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`psp-request-list-card ${
                    selectedId === item.id ? 'psp-request-list-card--active' : ''
                  }`}
                >
                  <div className="psp-request-list-card__top">
                    <strong>
                      {item.customer.firstName} {item.customer.lastName}
                    </strong>
                    <span className="psp-request-list-card__time">
                      {formatRequestDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="psp-request-list-card__sub">
                    {item.subject || item.service?.name || 'طلب خدمة'}
                  </div>

                  <div className="psp-request-list-card__body">{item.description}</div>

                  <div className="psp-request-action-row" style={{ marginTop: 12 }}>
                    <RequestStatusBadge status={item.status} />
                    <span className="psp-request-muted">
                      {formatMoneyRange(item.budgetMin, item.budgetMax, item.currencyCode)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="psp-request-panel">
          {!selected ? (
            <div className="psp-request-detail-empty">
              اختر طلباً من القائمة لعرض التفاصيل وتحديثه.
            </div>
          ) : (
            <div className="psp-request-detail">
              <div className="psp-request-detail-header">
                <div>
                  <h2 className="psp-request-detail-title">
                    {selected.subject || selected.service?.name || 'طلب خدمة'}
                  </h2>
                  <div className="psp-request-detail-meta">
                    <span>
                      {selected.customer.firstName} {selected.customer.lastName}
                    </span>
                    <span>•</span>
                    <span>{formatRequestDate(selected.updatedAt)}</span>
                    <span>•</span>
                    <span>{selected.customer.email}</span>
                  </div>
                </div>

                <RequestStatusBadge status={selected.status} />
              </div>

              <div className="psp-request-detail-card">
                <h3>بيانات العميل والطلب</h3>
                <div className="psp-request-detail-grid">
                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الهاتف</div>
                    <div className="psp-request-detail-item__value">
                      {selected.customer.phoneNumber || 'غير متوفر'}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الخدمة</div>
                    <div className="psp-request-detail-item__value">
                      {selected.service?.name || 'بدون خدمة محددة'}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الميزانية</div>
                    <div className="psp-request-detail-item__value">
                      {formatMoneyRange(
                        selected.budgetMin,
                        selected.budgetMax,
                        selected.currencyCode
                      )}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الموعد المفضل</div>
                    <div className="psp-request-detail-item__value">
                      {formatRequestDate(selected.preferredDate)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="psp-request-detail-card">
                <h3>وصف الطلب</h3>
                <div className="psp-request-description">{selected.description}</div>
              </div>

              {selected.customerNote ? (
                <div className="psp-request-detail-card">
                  <h3>آخر ملاحظة من العميل</h3>
                  <div className="psp-request-note-box">{selected.customerNote}</div>
                </div>
              ) : null}

              <div className="psp-request-activity-card">
                <h3>إدارة الطلب</h3>
                <div className="psp-request-form-grid">
                  <div className="psp-request-form-grid psp-request-form-grid--double">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      className="psp-request-input"
                    >
                      {providerStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                      placeholder={`عرض السعر (${selected.currencyCode})`}
                      className="psp-request-input"
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
                    placeholder="اكتب ردك المهني أو تفاصيل العرض أو الخطوات القادمة..."
                    className="psp-request-textarea"
                  />

                  <div className="psp-request-action-row">
                    <button
                      type="button"
                      onClick={openConversation}
                      className="psp-request-button psp-request-button--ghost"
                    >
                      فتح المحادثة
                    </button>

                    <div className="psp-request-inline-grid">
                      <div className="psp-request-muted">
                        العرض الحالي:{' '}
                        {selected.quotedPrice
                          ? formatMoney(selected.quotedPrice, selected.currencyCode)
                          : 'لا يوجد بعد'}
                      </div>

                      <button
                        type="button"
                        onClick={() => void saveUpdate()}
                        disabled={saving}
                        className="psp-request-button psp-request-button--primary"
                      >
                        {saving ? 'جارٍ الحفظ...' : 'حفظ التحديث'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProviderRequests;
