import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../config/api';

type MediaType = 'image' | 'video';

interface ServiceItem {
  id: string;
  name: string;
}

interface PortfolioItem {
  id: string;
  serviceId?: string | null;
  service?: { id: string; name: string } | null;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  sortOrder: number;
  likesCount: number;
  commentsCount: number;
}

interface CommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface PreferencePayload {
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

const emptyForm = {
  serviceId: '',
  mediaType: 'image' as MediaType,
  mediaUrl: '',
  thumbnailUrl: '',
  title: '',
  description: '',
  isPublished: true,
  isFeatured: false,
  showPromoBadge: false,
  promoBadgeText: '',
  sortOrder: 0,
};

export const ProviderPortfolio: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [preferenceData, setPreferenceData] = useState<PreferencePayload | null>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [openCommentsMediaId, setOpenCommentsMediaId] = useState<string | null>(null);
  const [commentsLoadingId, setCommentsLoadingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      const [mediaRes, servicesRes] = await Promise.all([
        api.get('/provider-media/me'),
        api.get('/providers/me/services'),
      ]);

      setItems(mediaRes.data?.data?.items || []);
      setPreferenceData({
        preference: mediaRes.data?.data?.preference,
        planFeatures: mediaRes.data?.data?.planFeatures,
      });

      setServices(
        (servicesRes.data?.data || []).map((service: any) => ({
          id: service.id,
          name: service.name,
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل الأعمال والوسائط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const images = items.filter((item) => item.mediaType === 'image').length;
    const videos = items.filter((item) => item.mediaType === 'video').length;
    const totalLikes = items.reduce((sum, item) => sum + item.likesCount, 0);
    const totalComments = items.reduce((sum, item) => sum + item.commentsCount, 0);

    return {
      total: items.length,
      images,
      videos,
      totalLikes,
      totalComments,
    };
  }, [items]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? target.checked
          : name === 'sortOrder'
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('عنوان العمل مطلوب');
      return;
    }

    if (!form.mediaUrl.trim()) {
      toast.error('رابط الصورة أو الفيديو مطلوب');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        serviceId: form.serviceId || null,
        mediaType: form.mediaType,
        mediaUrl: form.mediaUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        showPromoBadge: form.showPromoBadge,
        promoBadgeText: form.promoBadgeText.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/provider-media/${editingId}`, payload);
        toast.success('تم تحديث العمل');
      } else {
        await api.post('/provider-media', payload);
        toast.success('تمت إضافة العمل');
      }

      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشلت العملية');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      serviceId: item.serviceId || '',
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      title: item.title || '',
      description: item.description || '',
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      showPromoBadge: item.showPromoBadge,
      promoBadgeText: item.promoBadgeText || '',
      sortOrder: item.sortOrder || 0,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('هل تريد حذف هذا العمل؟');
    if (!confirmed) return;

    try {
      await api.delete(`/provider-media/${id}`);
      toast.success('تم حذف العمل');
      if (editingId === id) resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف العمل');
    }
  };

  const loadComments = async (mediaId: string) => {
    try {
      setCommentsLoadingId(mediaId);
      const response = await api.get(`/provider-media/${mediaId}/comments`);
      setCommentsMap((prev) => ({
        ...prev,
        [mediaId]: response.data?.data || [],
      }));
      setOpenCommentsMediaId(mediaId);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل التعليقات');
    } finally {
      setCommentsLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string, mediaId: string) => {
    try {
      await api.delete(`/provider-media/comments/${commentId}`);
      toast.success('تم حذف التعليق');
      await loadComments(mediaId);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حذف التعليق');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18 }}>
      <div style={panelStyle}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
          {editingId ? 'تعديل عمل / وسيط' : 'إضافة عمل جديد'}
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            color: '#d3dbeb',
            lineHeight: 1.7,
          }}
        >
          الخطة الحالية: <strong>{preferenceData?.preference.selectedPlan || 'basic'}</strong>
          <br />
          ستيكر العرض: {preferenceData?.planFeatures.canUseServicePromoBadge ? 'متاح' : 'غير متاح'}
          <br />
          تمييز العمل: {preferenceData?.planFeatures.canFeatureServices ? 'متاح' : 'غير متاح'}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>عنوان العمل</label>
            <input name="title" value={form.title} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>نوع الوسيط</label>
            <select name="mediaType" value={form.mediaType} onChange={handleChange} style={inputStyle}>
              <option value="image">image</option>
              <option value="video">video</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>رابط الصورة / الفيديو</label>
            <input
              name="mediaUrl"
              value={form.mediaUrl}
              onChange={handleChange}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>رابط Thumbnail للفيديو (اختياري)</label>
            <input
              name="thumbnailUrl"
              value={form.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>ربط بخدمة</label>
            <select name="serviceId" value={form.serviceId} onChange={handleChange} style={inputStyle}>
              <option value="">بدون ربط</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>الوصف</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>الترتيب</label>
            <input
              type="number"
              name="sortOrder"
              value={form.sortOrder}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
            />
            نشر هذا العمل للعامة
          </label>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            تمييز هذا العمل
          </label>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              name="showPromoBadge"
              checked={form.showPromoBadge}
              onChange={handleChange}
            />
            إظهار ستيكر / عرض على هذا العمل
          </label>

          <div>
            <label style={labelStyle}>نص الستيكر</label>
            <input
              name="promoBadgeText"
              value={form.promoBadgeText}
              onChange={handleChange}
              placeholder="مثال: عرض اليوم / جديد / -15%"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة العمل'}
            </button>

            <button type="button" onClick={resetForm} style={secondaryButton}>
              تفريغ
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 16,
          }}
        >
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>كل الأعمال</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.total}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>صور</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.images}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>فيديوهات</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.videos}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>إجمالي اللايكات</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.totalLikes}</div>
          </div>
          <div style={panelStyle}>
            <div style={{ color: '#96a2bd' }}>إجمالي التعليقات</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{stats.totalComments}</div>
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
            الأرشيف المرئي للأعمال
          </div>

          {loading ? (
            <div>جاري تحميل الأعمال...</div>
          ) : items.length === 0 ? (
            <div style={{ color: '#aeb8cd' }}>لا توجد أعمال منشورة بعد.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    background: '#0f1728',
                  }}
                >
                  <div style={{ position: 'relative', height: 220, background: '#060b14' }}>
                    {item.mediaType === 'image' ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <video
                        src={item.mediaUrl}
                        poster={item.thumbnailUrl || undefined}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}

                    {item.showPromoBadge && item.promoBadgeText ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          padding: '6px 10px',
                          borderRadius: 999,
                          background: '#7c3aed',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {item.promoBadgeText}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{item.title}</div>
                    <div style={{ color: '#9fb0cc', marginTop: 6 }}>
                      {item.service?.name || 'بدون ربط بخدمة'} • {item.isPublished ? 'published' : 'hidden'}
                    </div>

                    {item.description ? (
                      <div style={{ color: '#d3dceb', marginTop: 10, lineHeight: 1.7 }}>
                        {item.description}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        marginTop: 12,
                        color: '#c7d0e1',
                        fontWeight: 600,
                      }}
                    >
                      <div>❤️ {item.likesCount}</div>
                      <div>💬 {item.commentsCount}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      <button onClick={() => handleEdit(item)} style={secondaryButton}>
                        تعديل
                      </button>

                      <button onClick={() => handleDelete(item.id)} style={dangerButton}>
                        حذف
                      </button>

                      <button
                        onClick={() =>
                          openCommentsMediaId === item.id
                            ? setOpenCommentsMediaId(null)
                            : loadComments(item.id)
                        }
                        style={secondaryButton}
                      >
                        {commentsLoadingId === item.id
                          ? 'جاري التحميل...'
                          : openCommentsMediaId === item.id
                          ? 'إخفاء التعليقات'
                          : 'عرض التعليقات'}
                      </button>
                    </div>

                    {openCommentsMediaId === item.id ? (
                      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                        {(commentsMap[item.id] || []).length === 0 ? (
                          <div style={{ color: '#aeb8cd' }}>لا توجد تعليقات بعد.</div>
                        ) : (
                          commentsMap[item.id].map((comment) => (
                            <div
                              key={comment.id}
                              style={{
                                background: '#0b1220',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 14,
                                padding: 12,
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>{comment.authorName}</div>
                              <div style={{ color: '#d3dceb', marginTop: 6, lineHeight: 1.7 }}>
                                {comment.body}
                              </div>

                              <button
                                onClick={() => handleDeleteComment(comment.id, item.id)}
                                style={{ ...dangerButton, marginTop: 10 }}
                              >
                                حذف التعليق
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#d6def0',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0b1220',
  color: '#fff',
};

const primaryButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#172033',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const dangerButton: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: '#7a1f1f',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#d6def0',
};

export default ProviderPortfolio;