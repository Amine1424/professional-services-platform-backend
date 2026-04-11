import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';

interface FavoriteProvider {
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
}

export const CustomerFavorites: React.FC = () => {
  const [items, setItems] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/favorites/providers');
        setItems(response.data?.data || []);
      } catch (error) {
        console.error(error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
        المفضلة
      </div>

      {loading ? (
        <div style={bodyText}>جاري تحميل المفضلة...</div>
      ) : !items.length ? (
        <div style={bodyText}>لا توجد صفحات محفوظة في المفضلة بعد.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {items.map((provider) => (
            <Link key={provider.id} to={`/providers/${provider.id}`} style={cardLink}>
              <div
                style={{
                  height: 150,
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

                <div style={{ color: '#dbe3f2', marginTop: 8 }}>
                  {provider.averageRating} ⭐ ({provider.reviewsCount})
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: 18,
};

const bodyText: React.CSSProperties = {
  color: '#cfd8e6',
  lineHeight: 1.8,
};

const cardLink: React.CSSProperties = {
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

export default CustomerFavorites;