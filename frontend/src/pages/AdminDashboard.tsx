import React, { useEffect, useState } from 'react';
import api from '../config/api';

interface AdminSummary {
  kpis: {
    totalUsers: number;
    totalCustomers: number;
    totalProvidersUsers: number;
    totalReviewers: number;
    totalAdmins: number;
    totalProviders: number;
    pendingProviders: number;
    approvedProviders: number;
    totalServices: number;
    totalRequests: number;
    totalComments: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await api.get('/admin/dashboard-summary');
        setData(response.data?.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل لوحة الإدارة...</div>;
  }

  if (!data) {
    return <div style={{ color: '#fff' }}>تعذر تحميل لوحة الإدارة.</div>;
  }

  const cards = [
    ['إجمالي المستخدمين', data.kpis.totalUsers],
    ['العملاء', data.kpis.totalCustomers],
    ['مزودو الخدمات', data.kpis.totalProvidersUsers],
    ['المراجعون', data.kpis.totalReviewers],
    ['الأدمن', data.kpis.totalAdmins],
    ['الحسابات المهنية', data.kpis.totalProviders],
    ['المعلق منها', data.kpis.pendingProviders],
    ['المقبول منها', data.kpis.approvedProviders],
    ['الخدمات', data.kpis.totalServices],
    ['الطلبات', data.kpis.totalRequests],
    ['التعليقات', data.kpis.totalComments],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {cards.map(([label, value]) => (
        <div key={label} style={cardStyle}>
          <div style={{ color: '#94a3b8' }}>{label}</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginTop: 10 }}>
            {value}
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
  padding: 18,
};

export default AdminDashboard;