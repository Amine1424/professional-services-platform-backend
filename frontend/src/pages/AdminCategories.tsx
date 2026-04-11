import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export const AdminCategories: React.FC = () => {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories');
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

  const createCategory = async () => {
    try {
      await api.post('/admin/categories', form);
      toast.success('تم إنشاء الفئة');
      setForm({ name: '', slug: '', description: '' });
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل الإنشاء');
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('تم حذف الفئة');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل الحذف');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={cardStyle}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          إنشاء دومان / فرع
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="اسم الفئة"
            style={inputStyle}
          />

          <input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="slug"
            style={inputStyle}
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="وصف"
            style={{ ...inputStyle, minHeight: 100 }}
          />

          <button onClick={createCategory} style={primaryButton}>
            إنشاء
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          الفئات الحالية
        </div>

        {loading ? (
          <div style={{ color: '#cbd5e1' }}>جاري التحميل...</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={innerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800 }}>{item.name}</div>
                    <div style={{ color: '#93c5fd', marginTop: 6 }}>{item.slug}</div>
                    <div style={{ color: '#cbd5e1', marginTop: 6 }}>
                      {item.description || 'بدون وصف'}
                    </div>
                  </div>

                  <button onClick={() => removeCategory(item.id)} style={secondaryButton}>
                    حذف
                  </button>
                </div>
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
  padding: '10px 14px',
  background: '#172033',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default AdminCategories;