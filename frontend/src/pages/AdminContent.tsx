import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

interface CommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  media?: {
    id: string;
    title: string;
    providerId: string;
  } | null;
}

export const AdminContent: React.FC = () => {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/content/comments');
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

  const removeComment = async (id: string) => {
    try {
      await api.delete(`/admin/content/comments/${id}`);
      toast.success('تم حذف التعليق');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل الحذف');
    }
  };

  if (loading) {
    return <div style={{ color: '#fff' }}>جاري تحميل المحتوى...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <div key={item.id} style={cardStyle}>
          <div style={{ color: '#fff', fontWeight: 800 }}>{item.authorName}</div>
          <div style={{ color: '#cbd5e1', marginTop: 8, lineHeight: 1.8 }}>{item.body}</div>
          <div style={{ color: '#93c5fd', marginTop: 8 }}>
            {item.media?.title || 'بدون عمل مرتبط'}
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={() => removeComment(item.id)} style={secondaryButton}>
              حذف التعليق
            </button>
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

const secondaryButton: React.CSSProperties = {
  padding: '10px 14px',
  background: '#172033',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

export default AdminContent;