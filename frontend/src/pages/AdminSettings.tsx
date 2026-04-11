import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface SettingsPayload {
  platformName: string;
  seoTitle: string;
  seoDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemNotificationsEnabled: boolean;
}

export const AdminSettings: React.FC = () => {
  const [form, setForm] = useState<SettingsPayload>({
    platformName: '',
    seoTitle: '',
    seoDescription: '',
    maintenanceMode: false,
    maintenanceMessage: '',
    systemNotificationsEnabled: true,
  });

  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setForm(response.data?.data || form);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      await api.put('/admin/settings', form);
      toast.success('تم حفظ الإعدادات');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل الحفظ');
    }
  };

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل الإعدادات...</div>;
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'grid', gap: 12 }}>
        <input
          value={form.platformName}
          onChange={(e) => setForm((p) => ({ ...p, platformName: e.target.value }))}
          placeholder="اسم المنصة"
          style={inputStyle}
        />

        <input
          value={form.seoTitle}
          onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))}
          placeholder="SEO Title"
          style={inputStyle}
        />

        <textarea
          value={form.seoDescription}
          onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))}
          placeholder="SEO Description"
          style={{ ...inputStyle, minHeight: 100 }}
        />

        <label style={checkRow}>
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(e) => setForm((p) => ({ ...p, maintenanceMode: e.target.checked }))}
          />
          تفعيل وضع الصيانة
        </label>

        <textarea
          value={form.maintenanceMessage}
          onChange={(e) => setForm((p) => ({ ...p, maintenanceMessage: e.target.value }))}
          placeholder="رسالة الصيانة"
          style={{ ...inputStyle, minHeight: 100 }}
        />

        <label style={checkRow}>
          <input
            type="checkbox"
            checked={form.systemNotificationsEnabled}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                systemNotificationsEnabled: e.target.checked,
              }))
            }
          />
          تفعيل إشعارات النظام
        </label>

        <button onClick={save} style={primaryButton}>
          حفظ الإعدادات
        </button>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
};

const checkRow: React.CSSProperties = {
  color: '#fff',
  display: 'flex',
  gap: 10,
  alignItems: 'center',
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

export default AdminSettings;