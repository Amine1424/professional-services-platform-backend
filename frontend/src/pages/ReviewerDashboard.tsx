import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ClipboardCheck,
  Clock3,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface ReviewerDashboardPayload {
  stats: {
    totalProviders: number;
    pendingProviders: number;
    approvedProviders: number;
    rejectedProviders: number;
    suspendedProviders: number;
  };
  latestPending: Array<{
    id: string;
    companyName: string;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    createdAt: string;
    owner: { firstName: string; lastName: string; email: string };
    primaryCategory?: { name: string } | null;
    servicesCount: number;
    status?: string;
    isVerified?: boolean;
  }>;
  summary: {
    pendingCount: number;
    reviewedToday: number;
    totalReviewed: number;
    approvedCount: number;
    approvalRate: number;
  };
}

const ReviewerDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<ReviewerDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/reviewer/dashboard');
        if (!active) return;
        setData(response.data?.data || null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load the reviewer dashboard.'));
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

  const statCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: 'Pending reviews',
        value: String(data.summary.pendingCount),
        caption: 'Provider accounts currently waiting for moderation.',
        icon: ClipboardCheck,
      },
      {
        label: 'Reviewed today',
        value: String(data.summary.reviewedToday),
        caption: 'Decisions completed since the start of the day.',
        icon: Clock3,
      },
      {
        label: 'Total reviewed',
        value: String(data.summary.totalReviewed),
        caption: 'All moderation decisions stored in history.',
        icon: ShieldCheck,
      },
      {
        label: 'Approval rate',
        value: `${data.summary.approvalRate}%`,
        caption: 'Approval ratio across recorded moderation decisions.',
        icon: Inbox,
      },
    ];
  }, [data]);

  const nextProvider = data?.latestPending?.[0] || null;

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--sm" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Reviewer dashboard unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">{t('No reviewer data is available yet.')}</div>;
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              {t('Reviewer operations desk')}
            </div>
            <h2 className="mt-3 text-[34px] font-black tracking-tight text-slate-900">
              {t('Review queue, next action, and decision quality in one place')}
            </h2>
            <div className="mt-4 max-w-[760px] text-sm leading-8 text-slate-600">
              {t(
                'Start here when you need to understand workload quickly, identify the next provider to open, and keep moderation moving without drifting across unrelated screens.'
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={nextProvider ? `/reviewer/providers/${nextProvider.id}` : '/reviewer/pending'}
                className="psp-button psp-button--primary"
              >
                {t(nextProvider ? 'Open next review' : 'Open pending queue')}
                <ArrowRight size={16} />
              </Link>
              <Link to="/reviewer/inbox" className="psp-button psp-button--secondary">
                {t('Review inbox')}
              </Link>
            </div>
            <div className="mt-4 psp-summary-strip">
              <Link to="/reviewer/history" className="psp-summary-chip">
                <strong>{t('History')}</strong>
                {t('Audit past decisions')}
              </Link>
              <Link to="/reviewer/profile" className="psp-summary-chip">
                <strong>{t('Profile')}</strong>
                {t('Reviewer stats')}
              </Link>
            </div>
          </div>

          <article className="psp-surface psp-surface--muted">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Immediate focus')}
            </div>
            {nextProvider ? (
              <div className="mt-4 grid gap-4">
                <div>
                  <div className="text-[24px] font-black tracking-tight text-slate-900">
                    {nextProvider.companyName}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {[nextProvider.city, nextProvider.wilaya, nextProvider.region]
                      .filter(Boolean)
                      .join(', ') || 'Algeria'}{' '}
                    | {nextProvider.primaryCategory?.name || t('No category')} | {nextProvider.servicesCount}{' '}
                    {t(nextProvider.servicesCount === 1 ? 'service' : 'services')}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {nextProvider.owner.firstName} {nextProvider.owner.lastName} |{' '}
                    {nextProvider.owner.email}
                  </div>
                </div>

                <div className="psp-summary-strip">
                  <span className="psp-summary-chip">
                    <strong>{t('Created')}</strong>
                    {formatDateLabel(nextProvider.createdAt)}
                  </span>
                  <span className="psp-summary-chip">
                    <strong>{t('Next step')}</strong>
                    {t('Open provider review')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm leading-7 text-slate-600">
                {t('No provider is currently waiting in the queue.')}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-stat-card">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="psp-stat-card__label mt-4">{t(item.label)}</div>
              <div className="psp-stat-card__value">{item.value}</div>
              <div className="psp-stat-card__caption">{t(item.caption)}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Next providers to review</h2>
              <div className="psp-surface__sub">
                {t('Open the provider record directly or jump into the inbox if admin already sent a thread.')}
              </div>
            </div>
            <Link to="/reviewer/pending" className="psp-button psp-button--secondary">
              {t('Full queue')}
            </Link>
          </div>

          {!data.latestPending.length ? (
            <div className="psp-empty-state">{t('There are no pending providers right now.')}</div>
          ) : (
            <div className="psp-list">
              {data.latestPending.slice(0, 5).map((provider) => (
                <article key={provider.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="psp-list-card__title">{provider.companyName}</h3>
                        {provider.isVerified ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                            {t('verified')}
                          </span>
                        ) : null}
                      </div>
                      <div className="psp-list-card__meta">
                        {[provider.city, provider.wilaya, provider.region].filter(Boolean).join(', ') || 'Algeria'} |{' '}
                        {provider.primaryCategory?.name || t('No category')} | {provider.servicesCount}{' '}
                        {t(provider.servicesCount === 1 ? 'service' : 'services')}
                      </div>
                      <div className="psp-list-card__meta">
                        {provider.owner.firstName} {provider.owner.lastName} | {provider.owner.email}
                      </div>
                      <div className="mt-3 psp-summary-strip">
                        <span className="psp-summary-chip">
                          <strong>{t('Created')}</strong>
                          {formatDateLabel(provider.createdAt)}
                        </span>
                        <span className="psp-summary-chip">
                          <strong>{t('Next')}</strong>
                          {t('Review account')}
                        </span>
                      </div>
                    </div>

                    <div className="psp-list-card__actions">
                      <Link
                        to={`/reviewer/providers/${provider.id}`}
                        className="psp-button psp-button--primary"
                      >
                        {t('Review account')}
                      </Link>
                      <Link
                        to={`/providers/${provider.id}`}
                        className="psp-button psp-button--secondary"
                      >
                        {t('Public page')}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Moderation state</h2>
              <div className="psp-surface__sub">
                {t('Current provider status distribution across the moderation system.')}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              ['Total providers', data.stats.totalProviders],
              ['Pending', data.stats.pendingProviders],
              ['Approved', data.stats.approvedProviders],
              ['Rejected', data.stats.rejectedProviders],
              ['Suspended', data.stats.suspendedProviders],
              ['Approved decisions', data.summary.approvedCount],
            ].map(([label, value]) => (
              <div key={label} className="psp-detail-item">
                <div className="psp-detail-item__label">{t(label as string)}</div>
                <div className="psp-detail-item__value">{value}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ReviewerDashboard;
