import React, { useEffect, useState } from 'react';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

interface ReviewerProfilePayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  stats: {
    totalReviewed: number;
    reviewedToday: number;
    approvedCount: number;
  };
}

const ReviewerProfile: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<ReviewerProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/reviewer/profile');
        if (!active) return;
        setData(response.data?.data || null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load reviewer profile.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [t]);

  if (loading) {
    return (
      <div className="psp-loading-stack">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`reviewer-profile-skeleton-${index}`}
            className="psp-loading-block psp-loading-block--sm"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Reviewer profile unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">{t('Reviewer profile data is not available.')}</div>;
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>
              {data.firstName} {data.lastName}
            </h2>
            <div className="psp-surface__sub">
              {data.email} • {t(data.role)} •{' '}
              {data.isActive ? t('Active account') : t('Inactive account')}
            </div>
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {[
          [
            t('Total reviewed'),
            data.stats.totalReviewed,
            t('All moderation decisions stored for this reviewer.'),
          ],
          [
            t('Reviewed today'),
            data.stats.reviewedToday,
            t('Decisions created since the start of today.'),
          ],
          [t('Approved'), data.stats.approvedCount, t('Accounts approved by this reviewer so far.')],
        ].map(([label, value, caption]) => (
          <article key={label as string} className="psp-stat-card">
            <div className="psp-stat-card__label">{label}</div>
            <div className="psp-stat-card__value">{value}</div>
            <div className="psp-stat-card__caption">{caption}</div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default ReviewerProfile;
