import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface ProviderItem {
  id: string;
  companyName: string;
  status: string;
  isVerified: boolean;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  preference: {
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
    selectedPlan: string;
  };
}

export const AdminProviders: React.FC = () => {
  const [items, setItems] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/providers');
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

  const updateProvider = async (
    id: string,
    payload: {
      status?: string;
      isVerified?: boolean;
      featuredOnHomepage?: boolean;
      profileBadgeText?: string | null;
    }
  ) => {
    try {
      await api.patch(`/admin/providers/${id}/moderation`, payload);
      toast.success('تم تحديث المزود');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    }
  };

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل المزودين...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <div key={item.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>
                {item.companyName}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: 6 }}>
                {item.owner.firstName} {item.owner.lastName} • {item.owner.email}
              </div>
              <div style={{ color: '#93c5fd', marginTop: 6 }}>
                الحالة: {item.status} • التوثيق: {item.isVerified ? 'نعم' : 'لا'}
              </div>
              <div style={{ color: '#dbe3f2', marginTop: 8 }}>
                featured: {item.preference.featuredOnHomepage ? 'نعم' : 'لا'} • badge:{' '}
                {item.preference.profileBadgeText || 'بدون'}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => updateProvider(item.id, { status: 'approved' })}
                style={primaryButton}
              >
                موافقة
              </button>

              <button
                onClick={() => updateProvider(item.id, { status: 'rejected' })}
                style={secondaryButton}
              >
                رفض
              </button>

              <button
                onClick={() =>
                  updateProvider(item.id, { isVerified: !item.isVerified })
                }
                style={secondaryButton}
              >
                {item.isVerified ? 'إزالة التوثيق' : 'تفعيل التوثيق'}
              </button>

              <button
                onClick={() =>
                  updateProvider(item.id, {
                    featuredOnHomepage: !item.preference.featuredOnHomepage,
                  })
                }
                style={secondaryButton}
              >
                {item.preference.featuredOnHomepage ? 'إزالة Featured' : 'تفعيل Featured'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 16,
};

const primaryButton: React.CSSProperties = {
  padding: '10px 14px',
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

export default AdminProviders;