import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/api';
import '../../styles/notifications-center.css';

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

const FILTERS: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير المقروءة' },
  { key: 'message', label: 'الرسائل' },
  { key: 'request', label: 'الطلبات' },
  { key: 'comment', label: 'التعليقات' },
  { key: 'favorite_provider_update', label: 'المتابعات' },
  { key: 'system', label: 'النظام' },
];

const TYPE_META: Record<
  string,
  {
    label: string;
    tone: 'info' | 'warning' | 'success' | 'neutral';
  }
> = {
  message: {
    label: 'رسالة',
    tone: 'info',
  },
  request: {
    label: 'طلب',
    tone: 'warning',
  },
  comment: {
    label: 'تعليق',
    tone: 'success',
  },
  favorite_provider_update: {
    label: 'متابعة',
    tone: 'success',
  },
  system: {
    label: 'نظام',
    tone: 'neutral',
  },
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const NotificationsCenter: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await api.get('/notifications/me');
      setItems(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error(error);
      if (!silent) {
        toast.error('فشل تحميل الإشعارات');
      }
      setItems([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      void load(true);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [load]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return items;
    }

    if (filter === 'unread') {
      return items.filter((item) => !item.isRead);
    }

    return items.filter((item) => item.type === filter);
  }, [filter, items]);

  const unreadCount = items.filter((item) => !item.isRead).length;
  const requestCount = items.filter((item) => item.type === 'request').length;
  const messageCount = items.filter((item) => item.type === 'message').length;

  const openNotification = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await api.post(`/notifications/${item.id}/read`);
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  isRead: true,
                }
              : entry
          )
        );
      }

      if (item.link) {
        navigate(item.link);
      }
    } catch (error) {
      console.error(error);
      toast.error('فشل فتح الإشعار');
    }
  };

  const markAll = async () => {
    try {
      setMarkingAll(true);
      await api.post('/notifications/read-all');
      setItems((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error('فشل تحديث الإشعارات');
    } finally {
      setMarkingAll(false);
    }
  };

  const summaryCards = [
    {
      label: 'إجمالي الإشعارات',
      value: items.length,
      caption: 'آخر 50 إشعاراً مرتبطاً بنشاط حسابك.',
    },
    {
      label: 'غير المقروءة',
      value: unreadCount,
      caption: 'عناصر جديدة تحتاج مراجعة أو إجراء.',
    },
    {
      label: 'إشعارات الطلبات',
      value: requestCount,
      caption: 'كل التحديثات الخاصة بالـ leads والطلبات.',
    },
    {
      label: 'إشعارات الرسائل',
      value: messageCount,
      caption: 'المحادثات الجديدة والردود الواردة.',
    },
  ];

  return (
    <div className="psp-notification-page">
      <section className="psp-notification-summary-grid">
        {summaryCards.map((item) => (
          <div key={item.label} className="psp-notification-summary-card">
            <div className="psp-notification-summary-card__label">{item.label}</div>
            <div className="psp-notification-summary-card__value">{item.value}</div>
            <div className="psp-notification-summary-card__caption">{item.caption}</div>
          </div>
        ))}
      </section>

      <section className="psp-notification-panel">
        <div className="psp-notification-panel__header">
          <div>
            <h2>Notification Center</h2>
            <div className="psp-notification-panel__sub">
              الإشعارات الخاصة بالرسائل والطلبات والتفاعلات على الحساب.
            </div>
          </div>

          <button
            type="button"
            onClick={markAll}
            disabled={markingAll || !unreadCount}
            className="psp-notification-button psp-notification-button--ghost"
          >
            {markingAll ? 'جارٍ التحديث...' : 'تعيين الكل كمقروء'}
          </button>
        </div>

        <div className="psp-notification-filters">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`psp-notification-filter ${
                filter === item.key ? 'psp-notification-filter--active' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="psp-notification-empty">جارٍ تحميل الإشعارات...</div>
        ) : !filteredItems.length ? (
          <div className="psp-notification-empty">
            لا توجد إشعارات في هذا التصنيف حالياً.
          </div>
        ) : (
          <div className="psp-notification-list">
            {filteredItems.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.system;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openNotification(item)}
                  className={`psp-notification-card ${
                    item.isRead ? '' : 'psp-notification-card--unread'
                  }`}
                >
                  <div className="psp-notification-card__top">
                    <div>
                      <div className="psp-notification-card__title-row">
                        <strong>{item.title}</strong>
                        <span
                          className={`psp-notification-type psp-notification-type--${meta.tone}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="psp-notification-card__date">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    {!item.isRead ? <span className="psp-notification-dot" /> : null}
                  </div>

                  <div className="psp-notification-card__body">{item.body}</div>

                  <div className="psp-notification-card__footer">
                    <span>{item.link ? 'فتح العنصر المرتبط' : 'إشعار معلوماتي'}</span>
                    <span>{item.isRead ? 'مقروء' : 'جديد'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsCenter;
