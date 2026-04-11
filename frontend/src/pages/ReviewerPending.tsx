import React, { useEffect, useState } from 'react';
import api from '../config/api';

const ReviewerPending: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await api.get('/reviewer/pending');
        setItems(response.data?.data || []);
      } catch (error: any) {
        setError(error.response?.data?.message || 'تعذر تحميل الحسابات المعلقة.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <div style={{ color: '#fff' }}>جاري التحميل...</div>;
  if (error) return <div style={{ color: '#fff' }}>{error}</div>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {!items.length ? (
        <div style={{ color: '#fff' }}>لا توجد حسابات معلقة حالياً.</div>
      ) : (
        items.map((item) => (
          <div key={item.id} style={cardStyle}>
            <div style={{ color: '#fff', fontWeight: 800 }}>{item.companyName}</div>
            <div style={{ color: '#cbd5e1', marginTop: 6 }}>
              {item.owner?.firstName} {item.owner?.lastName} • {item.owner?.email}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 16,
};

export default ReviewerPending;