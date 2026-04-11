import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface Category {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price?: string | null;
  currencyCode: string;
  status: 'draft' | 'published' | 'paused';
  deliveryMode: 'online' | 'on_site' | 'hybrid';
  responseTimeHours: number;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

interface PreferencePayload {
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

const emptyForm = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  currencyCode: 'DZD',
  status: 'draft' as 'draft' | 'published' | 'paused',
  deliveryMode: 'on_site' as 'online' | 'on_site' | 'hybrid',
  responseTimeHours: 24,
  isFeatured: false,
  showPromoBadge: false,
  promoBadgeText: '',
};

export const ProviderServices: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [preferenceData, setPreferenceData] = useState<PreferencePayload | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      const [servicesRes, categoriesRes, preferencesRes] = await Promise.all([
        api.get('/providers/me/services'),
        api.get('/categories'),
        api.get('/providers/me/preferences'),
      ]);

      setServices(servicesRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
      setPreferenceData(preferencesRes.data?.data || null);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل خدمات المزود');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? target.checked
          : name === 'responseTimeHours'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('اسم الخدمة مطلوب');
      return;
    }

    if (!form.description.trim()) {
      toast.error('وصف الخدمة مطلوب');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        categoryId: form.categoryId || null,
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price ? Number(form.price) : null,
        currencyCode: form.currencyCode,
        status: form.status,
        deliveryMode: form.deliveryMode,
        responseTimeHours: Number(form.responseTimeHours) || 24,
        isFeatured: form.isFeatured,
        showPromoBadge: form.showPromoBadge,
        promoBadgeText: form.promoBadgeText,
      };

      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast.success('تم تحديث الخدمة');
      } else {
        await api.post('/services', payload);
        toast.success('تم إنشاء الخدمة');
      }

      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشلت العملية');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setForm({
      categoryId: service.categoryId || '',
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      currencyCode: service.currencyCode || 'DZD',
      status: service.status,
      deliveryMode: service.deliveryMode,
      responseTimeHours: service.responseTimeHours || 24,
      isFeatured: service.isFeatured,
      showPromoBadge: service.showPromoBadge,
      promoBadgeText: service.promoBadgeText || '',
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('هل تريد حذف هذه الخدمة؟');
    if (!confirmed) return;

    try {
      await api.delete(`/services/${id}`);
      toast.success('تم حذف الخدمة');
      if (editingId === id) resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف الخدمة');
    }
  };

  const stats = useMemo(() => {
    return {
      total: services.length,
      published: services.filter((service) => service.status === 'published').length,
      draft: services.filter((service) => service.status === 'draft').length,
      paused: services.filter((service) => service.status === 'paused').length,
    };
  }, [services]);

  const planLabel = preferenceData?.preference.selectedPlan || 'basic';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18 }}>
      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          {editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            color: '#d3dbeb',
            lineHeight: 1.7,
          }}
        >
          الخطة الحالية: <strong>{planLabel}</strong>
          <br />
          تفعيل الخدمة المميزة: {preferenceData?.planFeatures.canFeatureServices ? 'متاح' : 'غير متاح'}
          <br />
          ستيكر العرض على الخدمة: {preferenceData?.planFeatures.canUseServicePromoBadge ? 'متاح' : 'غير متاح'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>اسم الخدمة</label>
            <input name="name" value={form.name} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>الوصف</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>الفئة / الفرع</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} style={inputStyle}>
              <option value="">بدون فئة</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <label style={labelStyle}>السعر</label>
              <input name="price" value={form.price} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>العملة</label>
              <input name="currencyCode" value={form.currencyCode} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>الحالة</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="paused">paused</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>نوع الخدمة</label>
              <select name="deliveryMode" value={form.deliveryMode} onChange={handleChange} style={inputStyle}>
                <option value="on_site">on_site</option>
                <option value="online">online</option>
                <option value="hybrid">hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>مدة الرد بالساعات</label>
            <input
              type="number"
              name="responseTimeHours"
              value={form.responseTimeHours}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <label style={checkRowStyle}>
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
            جعل الخدمة مميزة
          </label>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              name="showPromoBadge"
              checked={form.showPromoBadge}
              onChange={handleChange}
            />
            إظهار ستيكر/عرض على الخدمة
          </label>

          <div>
            <label style={labelStyle}>نص الستيكر / العرض</label>
            <input
              name="promoBadgeText"
              value={form.promoBadgeText}
              onChange={handleChange}
              placeholder="مثال: -20% / عرض اليوم / خدمة سريعة"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الخدمة'}
            </button>

            <button type="button" onClick={resetForm} style={secondaryButton}>
              تفريغ
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>كل الخدمات</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>منشورة</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.published}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>مسودات</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.draft}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>موقوفة</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.paused}</div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
            خدماتي الحالية
          </div>

          {loading ? (
            <div>جاري تحميل الخدمات...</div>
          ) : services.length === 0 ? (
            <div style={{ color: '#aeb8cd' }}>لا توجد خدمات بعد.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 14,
                    background: '#0f1728',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{service.name}</div>

                        {service.showPromoBadge && service.promoBadgeText ? (
                          <div
                            style={{
                              padding: '5px 10px',
                              borderRadius: 999,
                              background: '#7c3aed',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            {service.promoBadgeText}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ color: '#97a5c1', marginTop: 6 }}>
                        {service.category?.name || 'بدون فئة'} • {service.deliveryMode} • {service.status}
                      </div>

                      <div style={{ color: '#d0d8e9', marginTop: 6 }}>
                        {service.price ? `${service.price} ${service.currencyCode}` : 'بدون سعر'}
                      </div>

                      <div style={{ color: '#9eabc3', marginTop: 6, lineHeight: 1.6 }}>
                        {service.description}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                      <button onClick={() => handleEdit(service)} style={secondaryButton}>
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        style={{
                          ...secondaryButton,
                          background: '#7a1f1f',
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#172033',
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

export default ProviderServices;