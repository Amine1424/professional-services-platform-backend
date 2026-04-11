import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';

interface ReviewItem {
  id: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  authorName: string;
}

interface MediaComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface PublicProviderPayload {
  provider: {
    id: string;
    companyName: string;
    description?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    region?: string | null;
    wilaya?: string | null;
    city?: string | null;
    addressLine?: string | null;
    yearsOfExperience: number;
    averageRating: string;
    reviewsCount: number;
    responseTimeMinutes: number;
    isVerified: boolean;
    status: string;
    primaryCategory?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    owner: {
      firstName: string;
      lastName: string;
    };
    contact: {
      email?: string | null;
      phoneNumber?: string | null;
      addressLine?: string | null;
    };
    preference: {
      selectedPlan: 'basic' | 'pro' | 'business';
      featuredOnHomepage: boolean;
      profileBadgeText?: string | null;
    };
  };
  services: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    price?: string | null;
    currencyCode: string;
    deliveryMode: string;
    responseTimeHours: number;
    isFeatured: boolean;
    showPromoBadge: boolean;
    promoBadgeText?: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
  media: Array<{
    id: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    thumbnailUrl?: string | null;
    title: string;
    description?: string | null;
    isFeatured: boolean;
    showPromoBadge: boolean;
    promoBadgeText?: string | null;
    likesCount: number;
    commentsCount: number;
    service?: {
      id: string;
      name: string;
    } | null;
    latestComments: Array<{
      id: string;
      authorName: string;
      body: string;
      createdAt: string;
    }>;
  }>;
}

export const PublicProviderPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<PublicProviderPayload | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [commentsMap, setCommentsMap] = useState<Record<string, MediaComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [actionMediaId, setActionMediaId] = useState<string | null>(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    serviceId: '',
    subject: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    currencyCode: 'DZD',
    preferredDate: '',
    initialMessage: '',
  });

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem('accessToken');

  const loadPage = async () => {
    try {
      const [providerRes, reviewsRes] = await Promise.all([
        api.get(`/public-providers/${id}`),
        api.get(`/provider-reviews/provider/${id}`),
      ]);

      const payload = providerRes.data?.data || null;
      setData(payload);
      setReviews(reviewsRes.data?.data || []);

      if (payload?.media?.length) {
        const initialComments: Record<string, MediaComment[]> = {};
        payload.media.forEach((item: any) => {
          initialComments[item.id] = item.latestComments || [];
        });
        setCommentsMap(initialComments);
      }
    } catch (error) {
      console.error(error);
      setData(null);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritesState = async () => {
    if (!token) return;

    try {
      const response = await api.get('/favorites/providers');
      const items = response.data?.data || [];
      setIsFavorite(items.some((item: any) => item.id === id));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      loadPage();
      loadFavoritesState();
    }
  }, [id]);

  const requireCustomer = () => {
    if (!token) {
      navigate('/login');
      return false;
    }

    if (currentUser?.role !== 'customer') {
      toast.error('هذه العملية متاحة للزبون فقط');
      return false;
    }

    return true;
  };

  const handleContact = () => {
    if (!requireCustomer()) return;
    navigate(`/customer/messages?providerId=${id}`);
  };

  const handleRequest = () => {
    if (!requireCustomer()) return;
    setShowRequestForm(true);
  };

  const toggleFavorite = async () => {
    if (!requireCustomer()) return;

    try {
      if (isFavorite) {
        await api.delete(`/favorites/providers/${id}`);
        setIsFavorite(false);
        toast.success('تمت إزالة المزود من المفضلة');
      } else {
        await api.post(`/favorites/providers/${id}`);
        setIsFavorite(true);
        toast.success('تمت إضافة المزود إلى المفضلة');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشلت العملية');
    }
  };

  const submitReview = async () => {
    if (!requireCustomer()) return;

    try {
      await api.post(`/provider-reviews/provider/${id}`, reviewForm);
      toast.success('تم حفظ التقييم');
      loadPage();
      setReviewForm({
        rating: 5,
        comment: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل حفظ التقييم');
    }
  };

  const submitRequest = async () => {
    if (!requireCustomer()) return;

    if (!requestForm.description.trim()) {
      toast.error('وصف الطلب مطلوب');
      return;
    }

    try {
      setSubmittingRequest(true);

      const response = await api.post('/orders', {
        providerId: id,
        serviceId: requestForm.serviceId || null,
        subject: requestForm.subject || null,
        description: requestForm.description,
        budgetMin: requestForm.budgetMin ? Number(requestForm.budgetMin) : null,
        budgetMax: requestForm.budgetMax ? Number(requestForm.budgetMax) : null,
        currencyCode: requestForm.currencyCode,
        preferredDate: requestForm.preferredDate || null,
        initialMessage: requestForm.initialMessage || requestForm.description,
      });

      toast.success('تم إرسال طلب الخدمة بنجاح');
      setShowRequestForm(false);
      setRequestForm({
        serviceId: '',
        subject: '',
        description: '',
        budgetMin: '',
        budgetMax: '',
        currencyCode: 'DZD',
        preferredDate: '',
        initialMessage: '',
      });
      navigate(
        response.data?.data?.id
          ? `/customer/orders?requestId=${response.data.data.id}`
          : '/customer/orders'
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إرسال طلب الخدمة');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const refreshMediaComments = async (mediaId: string) => {
    try {
      const response = await api.get(`/provider-media/${mediaId}/comments`);
      setCommentsMap((prev) => ({
        ...prev,
        [mediaId]: response.data?.data || [],
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleLike = async (mediaId: string) => {
    if (!requireCustomer()) return;

    try {
      setActionMediaId(mediaId);

      if (likedMap[mediaId]) {
        await api.delete(`/provider-media/${mediaId}/like`);
        setLikedMap((prev) => ({ ...prev, [mediaId]: false }));
      } else {
        await api.post(`/provider-media/${mediaId}/like`);
        setLikedMap((prev) => ({ ...prev, [mediaId]: true }));
      }

      await loadPage();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل تحديث الإعجاب');
    } finally {
      setActionMediaId(null);
    }
  };

  const handleAddComment = async (mediaId: string) => {
    if (!requireCustomer()) return;

    const body = commentDrafts[mediaId]?.trim();
    if (!body) {
      toast.error('اكتب تعليقًا أولًا');
      return;
    }

    try {
      setActionMediaId(mediaId);
      await api.post(`/provider-media/${mediaId}/comments`, {
        body,
      });

      setCommentDrafts((prev) => ({
        ...prev,
        [mediaId]: '',
      }));

      await refreshMediaComments(mediaId);
      await loadPage();
      toast.success('تمت إضافة التعليق');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إضافة التعليق');
    } finally {
      setActionMediaId(null);
    }
  };

  if (loading) {
    return <div style={pageWrap}>جاري تحميل صفحة المزود...</div>;
  }

  if (!data) {
    return <div style={pageWrap}>تعذر العثور على صفحة هذا المزود.</div>;
  }

  const { provider, services, media } = data;

  return (
    <div style={pageWrap}>
      <div style={heroCard}>
        <div
          style={{
            height: 240,
            backgroundImage: provider.coverUrl
              ? `url(${provider.coverUrl})`
              : 'linear-gradient(135deg, #1d4ed8, #0f766e)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div style={{ padding: 20, display: 'flex', gap: 18, alignItems: 'center' }}>
          <div style={avatarWrap}>
            {provider.avatarUrl ? (
              <img
                src={provider.avatarUrl}
                alt={provider.companyName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 30 }}>{provider.companyName}</h1>
              {provider.preference.profileBadgeText ? (
                <span style={badgePurple}>{provider.preference.profileBadgeText}</span>
              ) : null}
              {provider.isVerified ? <span style={badgeGreen}>موثّق</span> : null}
            </div>

            <div style={{ color: '#cbd5e1', marginTop: 8 }}>
              {provider.owner.firstName} {provider.owner.lastName}
            </div>

            <div style={{ color: '#9fb0cc', marginTop: 8 }}>
              {[provider.city, provider.wilaya, provider.region].filter(Boolean).join(' - ') ||
                'الموقع غير محدد'}
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, color: '#d6deec' }}>
              <div>الفئة: {provider.primaryCategory?.name || 'غير محددة'}</div>
              <div>الخبرة: {provider.yearsOfExperience} سنة</div>
              <div>
                التقييم: {provider.averageRating} ⭐ ({provider.reviewsCount})
              </div>
              <div>زمن الرد: {provider.responseTimeMinutes || 0} دقيقة</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <button onClick={handleContact} style={primaryButton}>
              راسل المزود
            </button>
            <button onClick={handleRequest} style={secondaryButton}>
              اطلب الخدمة
            </button>
            <button onClick={toggleFavorite} style={secondaryButton}>
              {isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            </button>
          </div>
        </div>
      </div>

      {showRequestForm ? (
        <div style={sectionCard}>
          <div style={sectionTitle}>طلب خدمة / Quote Request</div>

          <div style={{ display: 'grid', gap: 12 }}>
            <select
              value={requestForm.serviceId}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  serviceId: e.target.value,
                }))
              }
              style={inputStyle}
            >
              <option value="">بدون خدمة محددة</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <input
              value={requestForm.subject}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              placeholder="عنوان مختصر للطلب"
              style={inputStyle}
            />

            <textarea
              value={requestForm.description}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="اشرح طلبك بالتفصيل..."
              style={{ ...inputStyle, minHeight: 130, resize: 'vertical' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
              <input
                value={requestForm.budgetMin}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    budgetMin: e.target.value,
                  }))
                }
                placeholder="الميزانية الدنيا"
                style={inputStyle}
              />

              <input
                value={requestForm.budgetMax}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    budgetMax: e.target.value,
                  }))
                }
                placeholder="الميزانية القصوى"
                style={inputStyle}
              />

              <input
                value={requestForm.currencyCode}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    currencyCode: e.target.value,
                  }))
                }
                placeholder="DZD"
                style={inputStyle}
              />
            </div>

            <input
              type="datetime-local"
              value={requestForm.preferredDate}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  preferredDate: e.target.value,
                }))
              }
              style={inputStyle}
            />

            <textarea
              value={requestForm.initialMessage}
              onChange={(e) =>
                setRequestForm((prev) => ({
                  ...prev,
                  initialMessage: e.target.value,
                }))
              }
              placeholder="رسالة أولية داخل المحادثة (اختياري)"
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={submitRequest} disabled={submittingRequest} style={primaryButton}>
                {submittingRequest ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>

              <button onClick={() => setShowRequestForm(false)} style={secondaryButton}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={sectionCard}>
        <div style={sectionTitle}>نبذة مهنية</div>
        <div style={bodyText}>
          {provider.description || 'لا يوجد وصف مهني بعد.'}
        </div>
      </div>

      <div style={twoCols}>
        <div style={sectionCard}>
          <div style={sectionTitle}>معلومات التواصل</div>
          <div style={contactGrid}>
            <div>
              <strong>البريد:</strong>{' '}
              {provider.contact.email || 'مخفي حسب إعدادات الخصوصية'}
            </div>
            <div>
              <strong>الهاتف:</strong>{' '}
              {provider.contact.phoneNumber || 'مخفي حسب إعدادات الخصوصية'}
            </div>
            <div>
              <strong>العنوان:</strong>{' '}
              {provider.contact.addressLine || 'مخفي حسب إعدادات الخصوصية'}
            </div>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>الخطة والظهور</div>
          <div style={contactGrid}>
            <div>
              <strong>الخطة:</strong> {provider.preference.selectedPlan}
            </div>
            <div>
              <strong>ظهور رئيسي:</strong>{' '}
              {provider.preference.featuredOnHomepage ? 'نعم' : 'لا'}
            </div>
            <div>
              <strong>التوثيق:</strong> {provider.isVerified ? 'نعم' : 'لا'}
            </div>
          </div>
        </div>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>الخدمات المنشورة</div>

        {!services.length ? (
          <div style={bodyText}>لا توجد خدمات منشورة بعد.</div>
        ) : (
          <div style={serviceGrid}>
            {services.map((service) => (
              <div key={service.id} style={serviceCard}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{service.name}</div>
                  {service.isFeatured ? <span style={badgeBlue}>مميزة</span> : null}
                  {service.showPromoBadge && service.promoBadgeText ? (
                    <span style={badgePurple}>{service.promoBadgeText}</span>
                  ) : null}
                </div>

                <div style={{ color: '#9fb0cc', marginTop: 8 }}>
                  {service.category?.name || 'بدون فئة'} • {service.deliveryMode}
                </div>

                <div style={{ color: '#dce4f2', marginTop: 10 }}>
                  {service.price
                    ? `${service.price} ${service.currencyCode}`
                    : 'السعر حسب الطلب'}
                </div>

                <div style={{ color: '#c9d3e4', marginTop: 10, lineHeight: 1.7 }}>
                  {service.description}
                </div>

                <div style={{ color: '#90a4c3', marginTop: 10 }}>
                  زمن الرد التقديري: {service.responseTimeHours} ساعة
                </div>

                <button
                  onClick={() => {
                    handleRequest();
                    setRequestForm((prev) => ({
                      ...prev,
                      serviceId: service.id,
                      subject: service.name,
                    }));
                  }}
                  style={{ ...primaryButton, marginTop: 12 }}
                >
                  اطلب هذه الخدمة
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>الأعمال السابقة والوسائط</div>

        {!media.length ? (
          <div style={bodyText}>لا توجد أعمال منشورة بعد.</div>
        ) : (
          <div style={mediaGrid}>
            {media.map((item) => (
              <div key={item.id} style={mediaCard}>
                <div style={{ position: 'relative', height: 240, background: '#09101b' }}>
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
                    <span style={{ ...badgePurple, position: 'absolute', top: 12, left: 12 }}>
                      {item.promoBadgeText}
                    </span>
                  ) : null}
                </div>

                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{item.title}</div>
                    {item.isFeatured ? <span style={badgeBlue}>Featured</span> : null}
                  </div>

                  <div style={{ color: '#9fb0cc', marginTop: 8 }}>
                    {item.service?.name || 'غير مربوط بخدمة'}
                  </div>

                  {item.description ? (
                    <div style={{ color: '#dce4f2', marginTop: 10, lineHeight: 1.7 }}>
                      {item.description}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                    <button
                      onClick={() => handleToggleLike(item.id)}
                      disabled={actionMediaId === item.id}
                      style={secondaryButton}
                    >
                      {likedMap[item.id] ? 'إلغاء الإعجاب' : 'إعجاب'} • ❤️ {item.likesCount}
                    </button>

                    <button
                      onClick={() => refreshMediaComments(item.id)}
                      disabled={actionMediaId === item.id}
                      style={secondaryButton}
                    >
                      التعليقات • 💬 {item.commentsCount}
                    </button>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>التعليقات</div>

                    {(commentsMap[item.id] || []).length === 0 ? (
                      <div style={{ color: '#91a2bd' }}>لا توجد تعليقات بعد.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {(commentsMap[item.id] || []).map((comment) => (
                          <div key={comment.id} style={commentCard}>
                            <div style={{ fontWeight: 700 }}>{comment.authorName}</div>
                            <div style={{ marginTop: 6, color: '#d7e0ef', lineHeight: 1.6 }}>
                              {comment.body}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 12 }}>
                      <input
                        value={commentDrafts[item.id] || ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="اكتب تعليقك..."
                        style={inputStyle}
                      />
                      <button
                        onClick={() => handleAddComment(item.id)}
                        disabled={actionMediaId === item.id}
                        style={primaryButton}
                      >
                        تعليق
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>التقييمات</div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={reviewFormCard}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>اترك تقييمك</div>

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12 }}>
              <select
                value={reviewForm.rating}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                style={inputStyle}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} ⭐
                  </option>
                ))}
              </select>

              <input
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="اكتب تعليقك..."
                style={inputStyle}
              />

              <button onClick={submitReview} style={primaryButton}>
                إرسال
              </button>
            </div>
          </div>

          {!reviews.length ? (
            <div style={bodyText}>لا توجد تقييمات بعد.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {reviews.map((review) => (
                <div key={review.id} style={reviewCard}>
                  <div style={{ fontWeight: 800 }}>{review.authorName}</div>
                  <div style={{ color: '#facc15', marginTop: 6 }}>{review.rating} ⭐</div>
                  <div style={{ color: '#dce4f2', marginTop: 8, lineHeight: 1.7 }}>
                    {review.comment || 'بدون تعليق'}
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

const pageWrap: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0b0f19',
  color: '#f5f7fb',
  padding: 24,
  display: 'grid',
  gap: 18,
};

const heroCard: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  overflow: 'hidden',
};

const sectionCard: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const reviewFormCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 14,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const bodyText: React.CSSProperties = {
  color: '#d3dceb',
  lineHeight: 1.8,
};

const twoCols: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const contactGrid: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  color: '#dce4f2',
  lineHeight: 1.7,
};

const serviceGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

const serviceCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  padding: 16,
};

const mediaGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

const mediaCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  overflow: 'hidden',
};

const commentCard: React.CSSProperties = {
  background: '#0b1220',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  padding: 12,
};

const reviewCard: React.CSSProperties = {
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 14,
};

const avatarWrap: React.CSSProperties = {
  width: 92,
  height: 92,
  borderRadius: '50%',
  overflow: 'hidden',
  background: '#0f1728',
  border: '3px solid rgba(255,255,255,0.12)',
  flexShrink: 0,
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
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#172033',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const badgePurple: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 10px',
  borderRadius: 999,
  background: '#7c3aed',
  color: '#fff',
  fontWeight: 700,
  fontSize: 12,
};

const badgeGreen: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 10px',
  borderRadius: 999,
  background: '#15803d',
  color: '#fff',
  fontWeight: 700,
  fontSize: 12,
};

const badgeBlue: React.CSSProperties = {
  display: 'inline-block',
  padding: '5px 10px',
  borderRadius: 999,
  background: '#1d4ed8',
  color: '#fff',
  fontWeight: 700,
  fontSize: 12,
};

export default PublicProviderPage;
