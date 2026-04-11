import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { Link } from 'react-router-dom';

interface ReviewItem {
  id: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  provider?: {
    id: string;
    companyName: string;
    avatarUrl?: string | null;
  } | null;
}

export const CustomerReviews: React.FC = () => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await api.get('/provider-reviews/me');
      setItems(response.data?.data || []);
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    try {
      await api.delete(`/provider-reviews/${id}`);
      toast.success('تم حذف التقييم');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف التقييم');
    }
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
        كل تقييماتي السابقة
      </div>

      {loading ? (
        <div style={bodyText}>جاري تحميل التقييمات...</div>
      ) : !items.length ? (
        <div style={bodyText}>لم تقم بكتابة أي تقييم بعد.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((review) => (
            <div key={review.id} style={reviewCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <Link to={`/providers/${review.providerId}`} style={providerLink}>
                    {review.provider?.companyName || 'Provider'}
                  </Link>
                  <div style={{ color: '#dbe3f2', marginTop: 8 }}>
                    {review.rating} ⭐
                  </div>
                  <div style={{ color: '#c9d3e4', marginTop: 8, lineHeight: 1.7 }}>
                    {review.comment || 'بدون تعليق'}
                  </div>
                </div>

                <button onClick={() => remove(review.id)} style={dangerButton}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const bodyText: React.CSSProperties = {
  color: '#cfd8e6',
  lineHeight: 1.8,
};

const reviewCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 14,
};

const providerLink: React.CSSProperties = {
  color: '#7cc4ff',
  textDecoration: 'none',
  fontWeight: 800,
};

const dangerButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#7a1f1f',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default CustomerReviews;