import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface Category {
  id: string;
  name: string;
}

interface ProviderData {
  companyName: string;
  description?: string | null;
  region?: string | null;
  wilaya?: string | null;
  city?: string | null;
  addressLine?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  primaryCategoryId?: string | null;
  yearsOfExperience: number;
  responseTimeMinutes: number;
}

export const ProviderProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    companyName: '',
    description: '',
    region: '',
    wilaya: '',
    city: '',
    addressLine: '',
    avatarUrl: '',
    coverUrl: '',
    primaryCategoryId: '',
    yearsOfExperience: 0,
    responseTimeMinutes: 30,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [providerRes, categoriesRes] = await Promise.all([
          api.get('/providers/me'),
          api.get('/categories'),
        ]);

        const provider: ProviderData = providerRes.data?.data || {};
        setCategories(categoriesRes.data?.data || []);

        setForm({
          companyName: provider.companyName || '',
          description: provider.description || '',
          region: provider.region || '',
          wilaya: provider.wilaya || '',
          city: provider.city || '',
          addressLine: provider.addressLine || '',
          avatarUrl: provider.avatarUrl || '',
          coverUrl: provider.coverUrl || '',
          primaryCategoryId: provider.primaryCategoryId || '',
          yearsOfExperience: provider.yearsOfExperience || 0,
          responseTimeMinutes: provider.responseTimeMinutes || 30,
        });
      } catch (error) {
        console.error(error);
        toast.error('فشل تحميل الملف المهني');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'yearsOfExperience' || name === 'responseTimeMinutes'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.companyName.trim()) {
      toast.error('اسم النشاط مطلوب');
      return;
    }

    try {
      setSaving(true);

      await api.put('/providers/me', {
        companyName: form.companyName,
        description: form.description,
        region: form.region,
        wilaya: form.wilaya,
        city: form.city,
        addressLine: form.addressLine,
        avatarUrl: form.avatarUrl,
        coverUrl: form.coverUrl,
        primaryCategoryId: form.primaryCategoryId || null,
        yearsOfExperience: form.yearsOfExperience,
        responseTimeMinutes: form.responseTimeMinutes,
      });

      toast.success('تم حفظ الملف المهني بنجاح');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ الملف المهني');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={panelStyle}>جاري تحميل الملف المهني...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18 }}>
      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>
          معاينة سريعة
        </div>

        <div
          style={{
            height: 140,
            borderRadius: 16,
            backgroundImage: form.coverUrl
              ? `url(${form.coverUrl})`
              : 'linear-gradient(135deg, #1d4ed8, #0f766e)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div style={{ marginTop: -32, paddingLeft: 14 }}>
          <div
            style={{
              width: 74,
              height: 74,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#0f1728',
              border: '3px solid rgba(255,255,255,0.12)',
            }}
          >
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.companyName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 22, fontWeight: 800 }}>
          {form.companyName || 'اسم النشاط'}
        </div>
        <div style={{ color: '#95a3c1', marginTop: 8 }}>
          {[form.city, form.wilaya, form.region].filter(Boolean).join(' - ') || 'أضف الموقع'}
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 14 }}>
          إدارة الملف المهني
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>اسم النشاط / المؤسسة</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>الوصف المهني</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div>
              <label style={labelStyle}>الجهة / المنطقة</label>
              <input name="region" value={form.region} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الولاية</label>
              <input name="wilaya" value={form.wilaya} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>المدينة</label>
              <input name="city" value={form.city} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>العنوان</label>
            <input name="addressLine" value={form.addressLine} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>رابط صورة البروفايل</label>
              <input name="avatarUrl" value={form.avatarUrl} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>رابط صورة الغلاف</label>
              <input name="coverUrl" value={form.coverUrl} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>الفئة الأساسية</label>
              <select
                name="primaryCategoryId"
                value={form.primaryCategoryId}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">اختر فئة</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>سنوات الخبرة</label>
              <input
                type="number"
                name="yearsOfExperience"
                value={form.yearsOfExperience}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>مدة الرد بالدقائق</label>
              <input
                type="number"
                name="responseTimeMinutes"
                value={form.responseTimeMinutes}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} style={primaryButton}>
            {saving ? 'جاري الحفظ...' : 'حفظ الملف المهني'}
          </button>
        </form>
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

export default ProviderProfile;