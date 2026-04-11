import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';

interface ReviewDetailsPayload {
  provider: {
    id: string;
    companyName: string;
    description?: string | null;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    addressLine?: string | null;
    yearsOfExperience: number;
    responseTimeMinutes: number;
    averageRating: string;
    reviewsCount: number;
    status: string;
    isVerified: boolean;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string | null;
    };
    primaryCategory?: {
      name: string;
    } | null;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    price?: string | null;
  }>;
  media: Array<{
    id: string;
    title: string;
    mediaType: string;
    mediaUrl: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string | null;
  }>;
  requestsCount: number;
  moderationHistory: Array<{
    id: string;
    decision: string;
    note?: string | null;
    createdAt: string;
    reviewer: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export const ReviewerProviderReview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<ReviewDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    decision: 'approved',
    note: '',
    infoComplete: true,
    docsValid: true,
    imagesClear: true,
    contactValid: true,
    noPreviousComplaints: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviewer/providers/${id}`);
      setData(response.data?.data || null);
    } catch (error) {
      console.error(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveDecision = async () => {
    try {
      setSaving(true);

      await api.post(`/reviewer/providers/${id}/decision`, {
        decision: form.decision,
        note: form.note,
        checklistJson: {
          infoComplete: form.infoComplete,
          docsValid: form.docsValid,
          imagesClear: form.imagesClear,
          contactValid: form.contactValid,
          noPreviousComplaints: form.noPreviousComplaints,
        },
      });

      toast.success('تم حفظ قرار المراجعة');
      navigate('/reviewer/history');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ القرار');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل تفاصيل المراجعة...</div>;
  }

  if (!data) {
    return <div style={{ color: '#fff' }}>تعذر تحميل بيانات المزود.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={cardStyle}>
        <div style={titleStyle}>{data.provider.companyName}</div>
        <div style={mutedText}>
          {data.provider.owner.firstName} {data.provider.owner.lastName} • {data.provider.owner.email}
        </div>
        <div style={mutedText}>
          {[data.provider.city, data.provider.wilaya, data.provider.region].filter(Boolean).join(' - ')}
        </div>
        <div style={{ color: '#dbe3f2', marginTop: 12, lineHeight: 1.8 }}>
          {data.provider.description || 'لا يوجد وصف'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
        <div style={cardStyle}>
          <div style={sectionTitle}>الخدمات</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {data.services.map((service) => (
              <div key={service.id} style={innerCard}>
                <div style={{ fontWeight: 700, color: '#fff' }}>{service.name}</div>
                <div style={mutedText}>{service.description}</div>
                <div style={{ color: '#93c5fd', marginTop: 8 }}>
                  {service.price || 'بدون سعر'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={sectionTitle}>معلومات إضافية</div>
          <div style={mutedText}>الفئة: {data.provider.primaryCategory?.name || 'غير محددة'}</div>
          <div style={mutedText}>سنوات الخبرة: {data.provider.yearsOfExperience}</div>
          <div style={mutedText}>زمن الرد: {data.provider.responseTimeMinutes} دقيقة</div>
          <div style={mutedText}>التقييم: {data.provider.averageRating} ⭐</div>
          <div style={mutedText}>عدد المراجعات: {data.provider.reviewsCount}</div>
          <div style={mutedText}>عدد الطلبات: {data.requestsCount}</div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>نموذج المراجعة</div>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.infoComplete}
              onChange={(e) => setForm((p) => ({ ...p, infoComplete: e.target.checked }))}
            />
            معلومات كاملة
          </label>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.docsValid}
              onChange={(e) => setForm((p) => ({ ...p, docsValid: e.target.checked }))}
            />
            وثائق صحيحة
          </label>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.imagesClear}
              onChange={(e) => setForm((p) => ({ ...p, imagesClear: e.target.checked }))}
            />
            صور واضحة
          </label>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.contactValid}
              onChange={(e) => setForm((p) => ({ ...p, contactValid: e.target.checked }))}
            />
            معلومات اتصال صحيحة
          </label>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.noPreviousComplaints}
              onChange={(e) => setForm((p) => ({ ...p, noPreviousComplaints: e.target.checked }))}
            />
            لا توجد شكاوى سابقة واضحة
          </label>

          <select
            value={form.decision}
            onChange={(e) => setForm((p) => ({ ...p, decision: e.target.value }))}
            style={inputStyle}
          >
            <option value="approved">قبول</option>
            <option value="rejected">رفض</option>
            <option value="request_info">طلب معلومات إضافية</option>
            <option value="suspended">تعليق</option>
          </select>

          <textarea
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            placeholder="ملاحظات المراجع..."
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={saveDecision} disabled={saving} style={primaryButton}>
              {saving ? 'جاري الحفظ...' : 'حفظ القرار'}
            </button>

            <button onClick={() => navigate('/reviewer/pending')} style={secondaryButton}>
              رجوع
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>سجل القرارات السابقة</div>

        {!data.moderationHistory.length ? (
          <div style={mutedText}>لا يوجد سجل سابق.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {data.moderationHistory.map((item) => (
              <div key={item.id} style={innerCard}>
                <div style={{ color: '#fff', fontWeight: 700 }}>
                  {item.decision} — {item.reviewer.firstName} {item.reviewer.lastName}
                </div>
                <div style={mutedText}>{item.note || 'بدون ملاحظات'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 18,
};

const innerCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  padding: 14,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: '#fff',
};

const sectionTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const mutedText: React.CSSProperties = {
  color: '#cbd5e1',
  marginTop: 8,
  lineHeight: 1.7,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
};

const primaryButton: React.CSSProperties = {
  padding: '12px 16px',
  background: '#2563eb',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '12px 16px',
  background: '#172033',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const checkRow: React.CSSProperties = {
  color: '#fff',
  display: 'flex',
  gap: 10,
  alignItems: 'center',
};

export default ReviewerProviderReview;