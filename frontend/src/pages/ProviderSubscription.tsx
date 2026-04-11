import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface PreferencesData {
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

export const ProviderSubscription: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PreferencesData | null>(null);

  const [form, setForm] = useState({
    selectedPlan: 'basic' as 'basic' | 'pro' | 'business',
    featuredOnHomepage: false,
    profileBadgeText: '',
  });

  const loadPreferences = async () => {
    try {
      const response = await api.get('/providers/me/preferences');
      const payload: PreferencesData = response.data?.data || null;

      setData(payload);
      setForm({
        selectedPlan: payload?.preference.selectedPlan || 'basic',
        featuredOnHomepage: payload?.preference.featuredOnHomepage || false,
        profileBadgeText: payload?.preference.profileBadgeText || '',
      });
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const savePlan = async () => {
    try {
      setSaving(true);

      const response = await api.put('/providers/me/preferences', {
        selectedPlan: form.selectedPlan,
        featuredOnHomepage: form.featuredOnHomepage,
        profileBadgeText: form.profileBadgeText,
      });

      setData(response.data?.data || null);
      toast.success('تم تحديث الخطة والمزايا');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الاشتراك');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={panelStyle}>جاري تحميل الاشتراك...</div>;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          {
            key: 'basic',
            title: 'Basic',
            features: ['ملف مهني', 'إضافة خدمات', 'إدارة الرسائل'],
          },
          {
            key: 'pro',
            title: 'Pro',
            features: ['بادج على الملف', 'خدمات مميزة', 'ستيكر على الخدمات'],
          },
          {
            key: 'business',
            title: 'Business',
            features: ['ظهور في الصفحة الرئيسية', 'كل مزايا Pro', 'أفضلية عرض'],
          },
        ].map((plan) => (
          <button
            key={plan.key}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                selectedPlan: plan.key as 'basic' | 'pro' | 'business',
              }))
            }
            style={{
              textAlign: 'left',
              background:
                form.selectedPlan === plan.key ? '#1d4ed8' : '#111827',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 18,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800 }}>{plan.title}</div>
            <div style={{ marginTop: 14, display: 'grid', gap: 8, color: '#e3ebf8' }}>
              {plan.features.map((feature) => (
                <div key={feature}>• {feature}</div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 18 }}>
        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
            مزايا الخطة الحالية
          </div>

          <div style={{ color: '#d3dbeb', display: 'grid', gap: 10 }}>
            <div>الخطة المختارة: {form.selectedPlan}</div>
            <div>بادج الملف: {data?.planFeatures.canUseProfileBadge ? 'متاح' : 'غير متاح'}</div>
            <div>ستيكر على الخدمات: {data?.planFeatures.canUseServicePromoBadge ? 'متاح' : 'غير متاح'}</div>
            <div>ظهور في الصفحة الرئيسية: {data?.planFeatures.canFeatureOnHomepage ? 'متاح' : 'غير متاح'}</div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
            تخصيص مزايا الظهور
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <label style={checkRowStyle}>
              <input
                type="checkbox"
                checked={form.featuredOnHomepage}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    featuredOnHomepage: e.target.checked,
                  }))
                }
                disabled={!data?.planFeatures.canFeatureOnHomepage}
              />
              أريد إظهار الحساب في الصفحة الرئيسية
            </label>

            <div>
              <label style={labelStyle}>نص البادج قرب البروفايل</label>
              <input
                value={form.profileBadgeText}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    profileBadgeText: e.target.value,
                  }))
                }
                placeholder="مثال: محترف / خدمة سريعة / معتمد"
                style={inputStyle}
                disabled={!data?.planFeatures.canUseProfileBadge}
              />
            </div>

            <button onClick={savePlan} disabled={saving} style={primaryButton}>
              {saving ? 'جاري الحفظ...' : 'حفظ الخطة والمزايا'}
            </button>

            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                color: '#c7d0e1',
                lineHeight: 1.7,
              }}
            >
              تجهيز الظهور العام تم حفظه فعليًا في قاعدة البيانات.
              عندما نبني صفحات العميل والواجهة الرئيسية، ستُستهلك هذه القيم مباشرة.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#d6def0',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0b1220',
  color: '#fff',
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

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#d6def0',
};

export default ProviderSubscription;