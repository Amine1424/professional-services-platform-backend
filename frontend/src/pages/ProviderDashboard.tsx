import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';

interface DashboardData {
  provider: {
    companyName: string;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    primaryCategory?: { name: string } | null;
    user?: { firstName: string; lastName: string };
  };
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
    autoReplyEnabled: boolean;
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
  stats: {
    totalServices: number;
    publishedServices: number;
    draftServices: number;
    pausedServices: number;
    featuredServices: number;
    reviewsCount: number;
    averageRating: string;
    responseTimeMinutes: number;
    completionPercentage: number;
    isVerified: boolean;
    status: string;
  };
  recentServices: Array<{
    id: string;
    name: string;
    status: string;
    price?: string | null;
    currencyCode: string;
    promoBadgeText?: string | null;
    showPromoBadge: boolean;
    category?: { name: string } | null;
  }>;
}

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'قيد المراجعة';
    case 'approved':
      return 'مقبول';
    case 'rejected':
      return 'مرفوض';
    case 'suspended':
      return 'معلّق';
    default:
      return status;
  }
};

export const ProviderDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/providers/me/dashboard');
        setData(response.data?.data || null);
      } catch (error) {
        console.error('Failed to load provider dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div style={cardStyle}>جاري تحميل لوحة المزود...</div>;
  if (!data) return <div style={cardStyle}>تعذر تحميل بيانات المزود.</div>;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        style={{
          ...cardStyle,
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <div
          style={{
            height: 180,
            backgroundImage: data.provider.coverUrl
              ? `url(${data.provider.coverUrl})`
              : 'linear-gradient(135deg, #172554, #0f766e)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div style={{ padding: 18, display: 'flex', gap: 18, alignItems: 'center' }}>
          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#0f1728',
              border: '3px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}
          >
            {data.provider.avatarUrl ? (
              <img
                src={data.provider.avatarUrl}
                alt={data.provider.companyName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : null}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{data.provider.companyName}</div>
            <div style={{ color: '#cbd5e1', marginTop: 6 }}>
              {data.provider.user?.firstName} {data.provider.user?.lastName}
            </div>
            <div style={{ color: '#8da0c6', marginTop: 8 }}>
              {[data.provider.city, data.provider.wilaya, data.provider.region]
                .filter(Boolean)
                .join(' - ') || 'أكمل الموقع المهني'}
            </div>
            <div style={{ color: '#8da0c6', marginTop: 8 }}>
              الفئة الأساسية: {data.provider.primaryCategory?.name || 'غير محددة'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                fontWeight: 700,
              }}
            >
              {statusLabel(data.stats.status)}
            </div>

            <div style={{ marginTop: 10, color: '#d3dbeb' }}>
              موثّق: {data.stats.isVerified ? 'نعم' : 'لا'}
            </div>

            <div style={{ marginTop: 10, color: '#d3dbeb' }}>
              اكتمال الملف: {data.stats.completionPercentage}%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ color: '#96a2bd' }}>كل الخدمات</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {data.stats.totalServices}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: '#96a2bd' }}>الخدمات المنشورة</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {data.stats.publishedServices}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: '#96a2bd' }}>الخدمات المميزة</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {data.stats.featuredServices}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ color: '#96a2bd' }}>التقييم</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {data.stats.averageRating} ⭐
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
            الاستوديو المهني
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <Link to="/provider/profile" style={linkStyle}>
              الملف المهني والصور والخصوصية
            </Link>
            <Link to="/provider/services" style={linkStyle}>
              الخدمات + البادجات + الأسعار
            </Link>
            <Link to="/provider/messages" style={linkStyle}>
              الرسائل + الذكاء الاصطناعي
            </Link>
            <Link to="/provider/subscription" style={linkStyle}>
              الخطط والمزايا والظهور في الواجهة
            </Link>
            <Link to="/provider/settings" style={linkStyle}>
              المعلومات الشخصية والأمان
            </Link>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
            خطة الاشتراك الحالية
          </div>

          <div style={{ color: '#d3dbeb', display: 'grid', gap: 8 }}>
            <div>الخطة: {data.preference.selectedPlan}</div>
            <div>
              ظهور في الصفحة الرئيسية:{' '}
              {data.preference.featuredOnHomepage ? 'مفعل' : 'غير مفعل'}
            </div>
            <div>
              بادج الملف:{' '}
              {data.preference.profileBadgeText || 'غير محدد'}
            </div>
            <div>
              الرد الذكي التلقائي:{' '}
              {data.preference.autoReplyEnabled ? 'مفعل' : 'غير مفعل'}
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
          آخر الخدمات
        </div>

        {!data.recentServices.length ? (
          <div style={{ color: '#aeb8cd' }}>
            لا توجد خدمات بعد. ابدأ بإضافة أول خدمة من صفحة خدماتي.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {data.recentServices.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  background: '#0f1728',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{service.name}</div>
                    <div style={{ color: '#9eabc3', marginTop: 4 }}>
                      {service.category?.name || 'بدون فئة'} • {service.status}
                    </div>
                    <div style={{ color: '#d3dbeb', marginTop: 4 }}>
                      {service.price
                        ? `${service.price} ${service.currencyCode}`
                        : 'بدون سعر'}
                    </div>
                  </div>

                  {service.showPromoBadge && service.promoBadgeText ? (
                    <div
                      style={{
                        alignSelf: 'start',
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: '#7c3aed',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {service.promoBadgeText}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const linkStyle: React.CSSProperties = {
  color: '#7cc4ff',
  textDecoration: 'none',
  fontWeight: 600,
};

export default ProviderDashboard;