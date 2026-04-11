import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

export const CustomerSubscriptions: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/customers/me/preferences');
        setSelectedPlan(response.data?.data?.selectedPlan || 'free');
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await api.put('/customers/me/preferences', {
        selectedPlan,
      });
      toast.success('تم تحديث الاشتراك');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الاشتراك');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
      <button
        onClick={() => setSelectedPlan('free')}
        style={{
          ...planCard,
          background: selectedPlan === 'free' ? '#1d4ed8' : '#111827',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800 }}>Free</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div>• استكشاف المنصة</div>
          <div>• المفضلة</div>
          <div>• التقييمات</div>
        </div>
      </button>

      <button
        onClick={() => setSelectedPlan('premium')}
        style={{
          ...planCard,
          background: selectedPlan === 'premium' ? '#1d4ed8' : '#111827',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800 }}>Premium</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div>• أولوية في الاكتشاف</div>
          <div>• تجربة أفضل لاحقًا في الإشعارات والعروض</div>
          <div>• مزايا توسعية مستقبلية</div>
        </div>
      </button>

      <div style={{ gridColumn: '1 / span 2' }}>
        <button onClick={save} disabled={saving} style={primaryButton}>
          {saving ? 'جاري الحفظ...' : 'حفظ الخطة'}
        </button>
      </div>
    </div>
  );
};

const planCard: React.CSSProperties = {
  textAlign: 'left',
  borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  padding: 20,
  cursor: 'pointer',
};

const primaryButton: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default CustomerSubscriptions;