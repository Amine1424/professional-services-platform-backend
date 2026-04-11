import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface ReviewerItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export const AdminReviewers: React.FC = () => {
  const [items, setItems] = useState<ReviewerItem[]>([]);
  const [email, setEmail] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/admin/reviewers');
      setItems(response.data?.data || []);
    } catch (error) {
      console.error(error);
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const promote = async () => {
    try {
      await api.post('/admin/reviewers/promote', { email });
      toast.success('تمت الترقية إلى Reviewer');
      setEmail('');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشلت الترقية');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/reviewers/${id}/status`, { isActive });
      toast.success('تم تحديث الحالة');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={cardStyle}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          إضافة Reviewer من مستخدم موجود
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="إيميل المستخدم"
            style={inputStyle}
          />
          <button onClick={promote} style={primaryButton}>
            ترقية
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
          قائمة المراجعين
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={innerCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>
                    {item.firstName} {item.lastName}
                  </div>
                  <div style={{ color: '#cbd5e1', marginTop: 6 }}>{item.email}</div>
                </div>

                <button
                  onClick={() => toggleStatus(item.id, !item.isActive)}
                  style={secondaryButton}
                >
                  {item.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            </div>
          ))}
        </div>
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

export default AdminReviewers;