import React, { useEffect, useState } from 'react';
import api from '../config/api';

const ReviewerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await api.get('/reviewer/profile');
        setData(response.data?.data || null);
      } catch (error: any) {
        setError(error.response?.data?.message || 'تعذر تحميل ملف المراجع.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>جاري التحميل...</div>;
  if (error) return <div style={{ color: '#fff' }}>{error}</div>;
  if (!data) return <div style={{ color: '#fff' }}>لا توجد بيانات.</div>;

  return (
    <div style={cardStyle}>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>
        {data.firstName} {data.lastName}
      </div>
      <div style={{ color: '#cbd5e1', marginTop: 8 }}>{data.email}</div>
      <div style={{ color: '#cbd5e1', marginTop: 8 }}>الدور: {data.role}</div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
};

export default ReviewerProfile;