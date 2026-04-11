import React, { useEffect, useState } from 'react';
import api from '../config/api';

const ReviewerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await api.get('/reviewer/dashboard-summary');
        setData(response.data?.data || null);
      } catch (error: any) {
        setError(error.response?.data?.message || 'تعذر تحميل لوحة المراجع.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>جاري التحميل...</div>;
  if (error) return <div style={{ color: '#fff' }}>{error}</div>;
  if (!data) return <div style={{ color: '#fff' }}>لا توجد بيانات حالياً.</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={cardStyle}>الحسابات المعلقة: {data.pendingCount ?? 0}</div>
      <div style={cardStyle}>المراجعات اليوم: {data.reviewedToday ?? 0}</div>
      <div style={cardStyle}>إجمالي القرارات: {data.totalReviewed ?? 0}</div>
      <div style={cardStyle}>الموافقات: {data.approvedCount ?? 0}</div>
      <div style={cardStyle}>معدل القبول: {data.approvalRate ?? 0}%</div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
  color: '#fff',
};

export default ReviewerDashboard;