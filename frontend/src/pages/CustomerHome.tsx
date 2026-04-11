import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';

interface HomePayload {
  featuredProviders: Array<{
    id: string;
    companyName: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    averageRating: string;
    reviewsCount: number;
    isVerified: boolean;
    profileBadgeText?: string | null;
    primaryCategory?: { id: string; name: string } | null;
  }>;
  featuredServices: Array<{
    id: string;
    providerId: string;
    name: string;
    description: string;
    price?: string | null;
    currencyCode: string;
    showPromoBadge: boolean;
    promoBadgeText?: string | null;
    category?: { id: string; name: string } | null;
  }>;
  stories: Array<{
    id: string;
    providerId: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    thumbnailUrl?: string | null;
    title: string;
    likesCount: number;
    commentsCount: number;
    promoBadgeText?: string | null;
    showPromoBadge: boolean;
  }>;
}

export const CustomerHome: React.FC = () => {
  const [data, setData] = useState<HomePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/discovery/home');
        setData(response.data?.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div style={panelStyle}>جاري تحميل الرئيسية...</div>;
  if (!data) return <div style={panelStyle}>تعذر تحميل الصفحة الرئيسية.</div>;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={heroStyle}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>اكتشف أفضل أصحاب الخدمات</div>
          <div style={{ color: '#c9d3e4', marginTop: 10, lineHeight: 1.8 }}>
            منصة تربطك مع مزودين حقيقيين، أعمال منشورة، عروض، وتقييمات واضحة.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/customer/explore" style={primaryLink}>
            ابدأ الاستكشاف
          </Link>
          <Link to="/customer/favorites" style={secondaryLink}>
            المفضلة
          </Link>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={sectionTitle}>Stories / أعمال جديدة</div>

        {!data.stories.length ? (
          <div style={bodyText}>لا توجد وسائط حديثة الآن.</div>
        ) : (
          <div style={storyRow}>
            {data.stories.map((story) => (
              <Link key={story.id} to={`/providers/${story.providerId}`} style={storyCard}>
                <div
                  style={{
                    height: 180,
                    borderRadius: 14,
                    backgroundImage: `url(${story.thumbnailUrl || story.mediaUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {story.showPromoBadge && story.promoBadgeText ? (
                    <span style={badgePurple}>{story.promoBadgeText}</span>
                  ) : null}
                </div>
                <div style={{ marginTop: 10, fontWeight: 700 }}>{story.title}</div>
                <div style={{ color: '#9fb0cc', marginTop: 6 }}>
                  ❤️ {story.likesCount} • 💬 {story.commentsCount}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <div style={sectionTitle}>مزودون مميزون</div>

        {!data.featuredProviders.length ? (
          <div style={bodyText}>لا يوجد مزودون مميزون الآن.</div>
        ) : (
          <div style={providerGrid}>
            {data.featuredProviders.map((provider) => (
              <Link key={provider.id} to={`/providers/${provider.id}`} style={providerCard}>
                <div
                  style={{
                    height: 140,
                    borderRadius: 16,
                    backgroundImage: provider.coverUrl
                      ? `url(${provider.coverUrl})`
                      : 'linear-gradient(135deg, #1d4ed8, #0f766e)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div style={{ display: 'flex', gap: 12, marginTop: -24, padding: '0 14px' }}>
                  <div style={avatarStyle}>
                    {provider.avatarUrl ? (
                      <img
                        src={provider.avatarUrl}
                        alt={provider.companyName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800 }}>{provider.companyName}</div>
                    {provider.profileBadgeText ? <span style={badgePurple}>{provider.profileBadgeText}</span> : null}
                    {provider.isVerified ? <span style={badgeGreen}>موثّق</span> : null}
                  </div>

                  <div style={{ color: '#9fb0cc', marginTop: 8 }}>
                    {[provider.city, provider.wilaya, provider.region].filter(Boolean).join(' - ')}
                  </div>

                  <div style={{ color: '#d8e0ef', marginTop: 8 }}>
                    {provider.primaryCategory?.name || 'بدون فئة'}
                  </div>

                  <div style={{ color: '#cbd5e1', marginTop: 8 }}>
                    {provider.averageRating} ⭐ ({provider.reviewsCount})
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <div style={sectionTitle}>عروض وخدمات مميزة</div>

        {!data.featuredServices.length ? (
          <div style={bodyText}>لا توجد خدمات مميزة الآن.</div>
        ) : (
          <div style={serviceGrid}>
            {data.featuredServices.map((service) => (
              <Link key={service.id} to={`/providers/${service.providerId}`} style={serviceCard}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800 }}>{service.name}</div>
                  {service.showPromoBadge && service.promoBadgeText ? (
                    <span style={badgePurple}>{service.promoBadgeText}</span>
                  ) : null}
                </div>

                <div style={{ color: '#9fb0cc', marginTop: 8 }}>
                  {service.category?.name || 'بدون فئة'}
                </div>

                <div style={{ color: '#dbe3f2', marginTop: 10, lineHeight: 1.7 }}>
                  {service.description}
                </div>

                <div style={{ color: '#e5edf8', marginTop: 10 }}>
                  {service.price ? `${service.price} ${service.currencyCode}` : 'السعر حسب الطلب'}
                </div>
              </Link>
            ))}
          </div>
        )}
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

const heroStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #172554, #0f766e)',
  borderRadius: 24,
  padding: 24,
  color: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  alignItems: 'center',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 12,
};

const bodyText: React.CSSProperties = {
  color: '#cdd7e7',
  lineHeight: 1.8,
};

const primaryLink: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  background: '#2563eb',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
};

const secondaryLink: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  background: '#172033',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid rgba(255,255,255,0.12)',
};

const storyRow: React.CSSProperties = {
  display: 'grid',
  gridAutoFlow: 'column',
  gridAutoColumns: '260px',
  gap: 16,
  overflowX: 'auto',
};

const storyCard: React.CSSProperties = {
  textDecoration: 'none',
  color: '#fff',
};

const providerGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

const providerCard: React.CSSProperties = {
  textDecoration: 'none',
  color: '#fff',
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  overflow: 'hidden',
};

const avatarStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  overflow: 'hidden',
  background: '#0b1220',
  border: '3px solid rgba(255,255,255,0.12)',
};

const serviceGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

const serviceCard: React.CSSProperties = {
  textDecoration: 'none',
  color: '#fff',
  background: '#0f1728',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 18,
  padding: 16,
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

export default CustomerHome;