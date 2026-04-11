import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface ReportsSummary {
  generatedAt: string;
  kpis: Record<string, number>;
  distributions: {
    providerStatuses: Array<{ label: string; value: number }>;
    plans: Array<{ label: string; value: number }>;
    roles: Array<{ label: string; value: number }>;
  };
  latestRequests: Array<{
    id: string;
    subject?: string | null;
    status: string;
    quotedPrice?: string | null;
    currencyCode: string;
    customerName: string;
    providerName: string;
    serviceName: string;
    createdAt: string;
  }>;
}

export const AdminReports: React.FC = () => {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/summary');
      setData(response.data?.data || null);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error(error);
      toast.error('فشل تنزيل الملف');
    }
  };

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل التقارير...</div>;
  }

  if (!data) {
    return <div style={{ color: '#fff' }}>تعذر تحميل التقارير.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => downloadFile('/admin/reports/export/excel', 'admin-reports.xlsx')}
          style={primaryButton}
        >
          تصدير Excel
        </button>

        <button
          onClick={() => downloadFile('/admin/reports/export/pdf', 'admin-reports.pdf')}
          style={secondaryButton}
        >
          تصدير PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {Object.entries(data.kpis).map(([label, value]) => (
          <div key={label} style={cardStyle}>
            <div style={{ color: '#94a3b8' }}>{label}</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, marginTop: 8 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <div style={cardStyle}>
          <div style={titleStyle}>الأدوار</div>
          {data.distributions.roles.map((item) => (
            <div key={item.label} style={rowStyle}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={titleStyle}>حالات المزودين</div>
          {data.distributions.providerStatuses.map((item) => (
            <div key={item.label} style={rowStyle}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={titleStyle}>الخطط</div>
          {data.distributions.plans.length ? (
            data.distributions.plans.map((item) => (
              <div key={item.label} style={rowStyle}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))
          ) : (
            <div style={{ color: '#cbd5e1' }}>لا توجد بيانات خطط بعد.</div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>أحدث الطلبات</div>

        <div style={{ display: 'grid', gap: 10 }}>
          {data.latestRequests.map((item) => (
            <div key={item.id} style={innerCard}>
              <div style={{ color: '#fff', fontWeight: 800 }}>
                {item.subject || 'Request'}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: 6 }}>
                {item.customerName} → {item.providerName}
              </div>
              <div style={{ color: '#93c5fd', marginTop: 6 }}>
                {item.status} {item.quotedPrice ? `• ${item.quotedPrice} ${item.currencyCode}` : ''}
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

const titleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  color: '#e5edf8',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
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
  padding: '12px 16px',
  background: '#172033',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default AdminReports;