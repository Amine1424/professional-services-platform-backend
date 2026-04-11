import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

export const AdminUsers: React.FC = () => {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { search, role, status },
      });
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

  const updateStatus = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive });
      toast.success('تم تحديث حالة المستخدم');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      toast.success('تم تحديث الدور');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الدور');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={headerStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          style={inputStyle}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          <option value="all">كل الأدوار</option>
          <option value="customer">customer</option>
          <option value="service_provider">service_provider</option>
          <option value="reviewer">reviewer</option>
          <option value="admin">admin</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
        </select>

        <button onClick={load} style={primaryButton}>
          بحث
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#fff' }}>جاري تحميل المستخدمين...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800 }}>
                    {item.firstName} {item.lastName}
                  </div>
                  <div style={{ color: '#cbd5e1', marginTop: 6 }}>{item.email}</div>
                  <div style={{ color: '#93c5fd', marginTop: 6 }}>
                    {item.role} • {item.isActive ? 'نشط' : 'معطل'}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <select
                    value={item.role}
                    onChange={(e) => updateRole(item.id, e.target.value)}
                    style={inputStyle}
                  >
                    <option value="customer">customer</option>
                    <option value="service_provider">service_provider</option>
                    <option value="reviewer">reviewer</option>
                    <option value="admin">admin</option>
                  </select>

                  <button
                    onClick={() => updateStatus(item.id, !item.isActive)}
                    style={secondaryButton}
                  >
                    {item.isActive ? 'تعطيل' : 'تفعيل'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 220px 220px auto',
  gap: 12,
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

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: 16,
};

export default AdminUsers;