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

export const CustomerOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  const [items, setItems] = useState<CustomerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestFilterKey>('all');
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
      toast.error('فشل تحميل الطلبات');
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
    setDecisionNote(selected?.customerNote || '');
  }, [selected]);

  const updateCustomerDecision = async (
    status: 'accepted' | 'rejected' | 'cancelled'
  ) => {
    if (!selected) {
      return;
    }

    try {
      setActionLoadingId(selected.id);
      await api.patch(`/orders/${selected.id}/customer`, {
        status,
        customerNote: decisionNote.trim() || null,
      });
      toast.success('تم تحديث الطلب');
      await load(selected.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الطلب');
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
      label: 'إجمالي الطلبات',
      value: items.length,
      caption: 'كل الطلبات والـ quotes المرتبطة بحسابك.',
    },
    {
      label: 'العروض المرسلة',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'quoted'
      ),
      caption: 'طلبات تحتاج قراراً مباشراً منك.',
    },
    {
      label: 'الطلبات النشطة',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'active'
      ),
      caption: 'طلبات مفتوحة أو قيد التنفيذ حالياً.',
    },
    {
      label: 'الطلبات المغلقة',
      value: getRequestsCountByFilter(
        items.map((item) => item.status),
        'closed'
      ),
      caption: 'طلبات مكتملة أو ملغاة أو مرفوضة.',
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
              <h2>طلباتك</h2>
              <div className="psp-request-panel__sub">
                راقب كل quote أو طلب خدمة من أول رسالة حتى القرار النهائي.
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
              لا توجد طلبات في هذا التصنيف حالياً.
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
                    <strong>{item.subject || item.service?.name || 'طلب خدمة'}</strong>
                    <span className="psp-request-list-card__time">
                      {formatRequestDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="psp-request-list-card__sub">
                    {item.provider.companyName} • {item.service?.name || 'بدون خدمة محددة'}
                  </div>

                  <div className="psp-request-list-card__body">{item.description}</div>

                  <div className="psp-request-action-row" style={{ marginTop: 12 }}>
                    <RequestStatusBadge status={item.status} />
                    {item.quotedPrice ? (
                      <span className="psp-request-muted">
                        {formatMoney(item.quotedPrice, item.currencyCode)}
                      </span>
                    ) : (
                      <span className="psp-request-muted">
                        {formatMoneyRange(item.budgetMin, item.budgetMax, item.currencyCode)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="psp-request-panel">
          {!selected ? (
            <div className="psp-request-detail-empty">
              اختر طلباً من القائمة لعرض التفاصيل واتخاذ القرار.
            </div>
          ) : (
            <div className="psp-request-detail">
              <div className="psp-request-detail-header">
                <div>
                  <h2 className="psp-request-detail-title">
                    {selected.subject || selected.service?.name || 'طلب خدمة'}
                  </h2>
                  <div className="psp-request-detail-meta">
                    <span>{selected.provider.companyName}</span>
                    <span>•</span>
                    <span>{formatRequestDate(selected.updatedAt)}</span>
                    {selected.provider.isVerified ? (
                      <>
                        <span>•</span>
                        <span>Verified</span>
                      </>
                    ) : null}
                  </div>
                </div>

                <RequestStatusBadge status={selected.status} />
              </div>

              <div className="psp-request-detail-card">
                <h3>ملخص الطلب</h3>
                <div className="psp-request-detail-grid">
                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الميزانية المتوقعة</div>
                    <div className="psp-request-detail-item__value">
                      {formatMoneyRange(
                        selected.budgetMin,
                        selected.budgetMax,
                        selected.currencyCode
                      )}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">موعد مفضل</div>
                    <div className="psp-request-detail-item__value">
                      {formatRequestDate(selected.preferredDate)}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">الخدمة</div>
                    <div className="psp-request-detail-item__value">
                      {selected.service?.name || 'بدون خدمة محددة'}
                    </div>
                  </div>

                  <div className="psp-request-detail-item">
                    <div className="psp-request-detail-item__label">العرض الحالي</div>
                    <div className="psp-request-detail-item__value">
                      {selected.quotedPrice
                        ? formatMoney(selected.quotedPrice, selected.currencyCode)
                        : 'لم يصل عرض سعر بعد'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="psp-request-detail-card">
                <h3>الوصف</h3>
                <div className="psp-request-description">{selected.description}</div>
              </div>

              {selected.providerResponse ? (
                <div className="psp-request-detail-card">
                  <h3>رد المزود</h3>
                  <div className="psp-request-note-box">{selected.providerResponse}</div>
                </div>
              ) : null}

              <div className="psp-request-activity-card">
                <h3>ملاحظتك وقراراتك</h3>
                <div className="psp-request-form-grid">
                  <textarea
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    placeholder="أضف ملاحظة للمزود قبل قبول العرض أو رفضه أو إلغاء الطلب..."
                    className="psp-request-textarea"
                  />

                  <div className="psp-request-action-row">
                    <button
                      type="button"
                      onClick={() => goToConversation(selected)}
                      className="psp-request-button psp-request-button--ghost"
                    >
                      فتح المحادثة
                    </button>

                    <div className="psp-request-inline-grid">
                      {selected.status === 'quoted' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void updateCustomerDecision('accepted')}
                            disabled={actionLoadingId === selected.id}
                            className="psp-request-button psp-request-button--primary"
                          >
                            قبول العرض
                          </button>

                          <button
                            type="button"
                            onClick={() => void updateCustomerDecision('rejected')}
                            disabled={actionLoadingId === selected.id}
                            className="psp-request-button psp-request-button--danger"
                          >
                            رفض العرض
                          </button>
                        </>
                      ) : null}

                      {['new', 'reviewed', 'quoted'].includes(selected.status) ? (
                        <button
                          type="button"
                          onClick={() => void updateCustomerDecision('cancelled')}
                          disabled={actionLoadingId === selected.id}
                          className="psp-request-button psp-request-button--danger"
                        >
                          إلغاء الطلب
                        </button>
                      ) : null}
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

export default CustomerOrders;
