import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ShieldCheck, UserRound, Wrench } from 'lucide-react';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface AdminSummary {
  kpis: {
    totalUsers: number;
    totalCustomers: number;
    totalProvidersUsers: number;
    totalReviewers: number;
    totalAdmins: number;
    totalProviders: number;
    pendingProviders: number;
    approvedProviders: number;
    totalServices: number;
    totalRequests: number;
    totalComments: number;
  };
  latestProviders: Array<{
    id: string;
    companyName: string;
    status: string;
    isVerified: boolean;
    city?: string | null;
    wilaya?: string | null;
    createdAt: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  latestModeration: Array<{
    id: string;
    decision: string;
    note?: string | null;
    createdAt: string;
    provider: {
      id: string;
      companyName: string;
    };
    reviewer: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const response = await api.get('/admin/dashboard-summary');
        if (!active) return;
        setData(response.data?.data || null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setData(null);
        setError(requestError.response?.data?.message || t('Failed to load the admin dashboard.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [t]);

  const metrics = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: 'Pending moderation',
        value: data.kpis.pendingProviders,
        caption: 'Providers waiting for a moderation decision.',
        icon: ShieldCheck,
      },
      {
        label: 'Approved providers',
        value: data.kpis.approvedProviders,
        caption: 'Supply currently visible in the marketplace.',
        icon: Wrench,
      },
      {
        label: 'Open demand',
        value: data.kpis.totalRequests,
        caption: 'Customer requests currently flowing through the platform.',
        icon: ClipboardList,
      },
      {
        label: 'Total accounts',
        value: data.kpis.totalUsers,
        caption: 'All user accounts across customer, provider, reviewer, and admin roles.',
        icon: UserRound,
      },
    ];
  }, [data]);

  const actionQueue = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: 'Provider review queue',
        value: data.kpis.pendingProviders,
        caption: 'Clear backlog before it affects supply freshness.',
        to: '/admin/providers?status=pending',
      },
      {
        title: 'Content watch',
        value: data.kpis.totalComments,
        caption: 'Public comments currently visible in the marketplace.',
        to: '/admin/content',
      },
      {
        title: 'Reviewer capacity',
        value: data.kpis.totalReviewers,
        caption: 'Reviewers available to absorb incoming moderation load.',
        to: '/admin/reviewers',
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="psp-loading-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--sm" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Admin dashboard unavailable.')}</div>
        <div>{error || t('Admin dashboard data is not available.')}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              Marketplace control overview
            </div>
            <h2 className="mt-3 text-[32px] font-black tracking-tight text-slate-900">
              Operations dashboard
            </h2>
            <div className="mt-3 max-w-[760px] text-sm leading-8 text-slate-600">
              This view is for queue control, trust supervision, and supply-demand balance. It is not a marketing dashboard. It should tell you what needs action now and where the marketplace may start drifting.
            </div>
          </div>

          <div className="psp-summary-strip">
            {[
              ['Customers', data.kpis.totalCustomers],
              ['Provider users', data.kpis.totalProvidersUsers],
              ['Reviewers', data.kpis.totalReviewers],
              ['Admins', data.kpis.totalAdmins],
            ].map(([label, value]) => (
              <span key={label} className="psp-summary-chip">
                <strong>{value}</strong>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-ops-panel">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon size={18} />
              </div>
              <div className="psp-ops-panel__label mt-4">{item.label}</div>
              <div className="psp-ops-panel__value">{item.value}</div>
              <div className="psp-ops-panel__caption">{item.caption}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {actionQueue.map((item) => (
          <Link key={item.title} to={item.to} className="psp-ops-panel no-underline">
            <div className="psp-ops-panel__label">Action queue</div>
            <div className="mt-3 text-[22px] font-black tracking-tight text-slate-900">{item.title}</div>
            <div className="mt-3 text-[28px] font-black tracking-tight text-slate-900">{item.value}</div>
            <div className="psp-ops-panel__caption">{item.caption}</div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Latest provider intake</h2>
              <div className="psp-surface__sub">
                Newly created provider accounts entering the moderation workflow.
              </div>
            </div>
            <Link to="/admin/providers" className="psp-button psp-button--secondary">
              Open provider desk
            </Link>
          </div>

          {!data.latestProviders.length ? (
            <div className="psp-empty-state">No provider intake items are available right now.</div>
          ) : (
            <table className="psp-data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.latestProviders.map((provider) => (
                  <tr key={provider.id}>
                    <td>
                      <div className="psp-data-table__title">{provider.companyName}</div>
                      <div className="psp-data-table__sub">
                        {provider.owner.firstName} {provider.owner.lastName} | {provider.owner.email}
                      </div>
                    </td>
                    <td>
                      <div className="psp-data-table__title capitalize">{provider.status}</div>
                      <div className="psp-data-table__sub">
                        {provider.isVerified ? 'Verified' : 'Verification pending'}
                      </div>
                    </td>
                    <td>
                      <div className="psp-data-table__title">
                        {[provider.city, provider.wilaya].filter(Boolean).join(', ') || 'Location pending'}
                      </div>
                    </td>
                    <td>
                      <div className="psp-data-table__title">{formatDateLabel(provider.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Latest moderation decisions</h2>
              <div className="psp-surface__sub">
                Reviewer output visible to admin for throughput and decision quality checks.
              </div>
            </div>
          </div>

          {!data.latestModeration.length ? (
            <div className="psp-empty-state">No moderation decisions have been recorded yet.</div>
          ) : (
            <div className="psp-list">
              {data.latestModeration.map((item) => (
                <article key={item.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div>
                      <h3 className="psp-list-card__title">{item.provider.companyName}</h3>
                      <div className="psp-list-card__meta">
                        Reviewed by {item.reviewer.firstName} {item.reviewer.lastName}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      {item.decision}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {item.note || 'No reviewer note was added for this moderation decision.'}
                  </div>
                  <div className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {formatDateLabel(item.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
