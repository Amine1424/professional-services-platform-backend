import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, FileSpreadsheet, FileText, RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { formatDateTimeLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface ReportsSummary {
  generatedAt: string;
  kpis: Record<string, number>;
  distributions: {
    providerStatuses: Array<{ label: string; value: number }>;
    plans: Array<{ label: string; value: number }>;
    roles: Array<{ label: string; value: number }>;
  };
  latestRequests: Array<{
    id: string;
    subject?: string | null;
    status: string;
    quotedPrice?: string | null;
    currencyCode: string;
    customerName: string;
    providerName: string;
    serviceName: string;
    createdAt: string;
  }>;
}

export const AdminReports: React.FC = () => {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reports/summary');
      setData(response.data?.data || null);
      setError(null);
    } catch (requestError: any) {
      setData(null);
      setError(requestError.response?.data?.message || 'Failed to load reports summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const downloadFile = async (kind: 'excel' | 'pdf') => {
    try {
      setDownloading(kind);
      const target = kind === 'excel' ? '/admin/reports/export/excel' : '/admin/reports/export/pdf';
      const fileName = kind === 'excel' ? 'admin-reports.xlsx' : 'admin-reports.pdf';

      const response = await api.get(target, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(href);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to export report.');
    } finally {
      setDownloading(null);
    }
  };

  const headlineStats = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: 'Users',
        value: String(data.kpis.totalUsers || 0),
        caption: 'Full account footprint across the marketplace.',
      },
      {
        label: 'Approved providers',
        value: String(data.kpis.approvedProviders || 0),
        caption: 'Supply currently visible to customers.',
      },
      {
        label: 'Requests',
        value: String(data.kpis.totalRequests || 0),
        caption: 'Demand flowing through messaging and lead management.',
      },
      {
        label: 'Reviews and comments',
        value: `${data.kpis.totalReviews || 0}/${data.kpis.totalComments || 0}`,
        caption: 'Public trust signals plus comment volume.',
      },
    ];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Reports unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">No reports summary is available yet.</div>;
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#2563eb_40%,#14b8a6)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <BarChart3 size={14} />
              Marketplace reporting
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Turn marketplace activity into exportable operating insight
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              This is the operational view for admin: supply, demand, moderation footprint, and the data
              exports needed for stakeholders or internal ops reviews.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="text-sm font-semibold text-white/78">
              Last generated: {formatDateTimeLabel(data.generatedAt)}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={downloading !== null}
                onClick={() => void downloadFile('excel')}
              >
                <FileSpreadsheet size={16} />
                {downloading === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
              </button>
              <button
                type="button"
                className="psp-button psp-button--secondary"
                disabled={downloading !== null}
                onClick={() => void downloadFile('pdf')}
              >
                <FileText size={16} />
                {downloading === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
              </button>
              <button type="button" className="psp-button psp-button--secondary" onClick={() => void load()}>
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {headlineStats.map((item) => (
          <article key={item.label} className="psp-stat-card">
            <div className="psp-stat-card__label">{item.label}</div>
            <div className="psp-stat-card__value">{item.value}</div>
            <div className="psp-stat-card__caption">{item.caption}</div>
          </article>
        ))}
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Role distribution</h2>
              <div className="psp-surface__sub">Who is populating the platform right now.</div>
            </div>
          </div>

          <div className="psp-list">
            {data.distributions.roles.map((item) => (
              <div key={item.label} className="psp-detail-item">
                <div className="psp-detail-item__label">{item.label}</div>
                <div className="psp-detail-item__value">{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Provider status</h2>
              <div className="psp-surface__sub">How much provider supply is pending, approved, or blocked.</div>
            </div>
          </div>

          <div className="psp-list">
            {data.distributions.providerStatuses.map((item) => (
              <div key={item.label} className="psp-detail-item">
                <div className="psp-detail-item__label">{item.label}</div>
                <div className="psp-detail-item__value">{item.value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Plan mix</h2>
              <div className="psp-surface__sub">Provider plan adoption and visibility positioning.</div>
            </div>
          </div>

          {!data.distributions.plans.length ? (
            <div className="psp-empty-state">No plan distribution is available yet.</div>
          ) : (
            <div className="psp-list">
              {data.distributions.plans.map((item) => (
                <div key={item.label} className="psp-detail-item">
                  <div className="psp-detail-item__label">{item.label}</div>
                  <div className="psp-detail-item__value">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Latest requests</h2>
            <div className="psp-surface__sub">
              Recent demand moving through providers, quotes, and customer conversations.
            </div>
          </div>
        </div>

        {!data.latestRequests.length ? (
          <div className="psp-empty-state">No recent requests are available.</div>
        ) : (
          <div className="psp-list">
            {data.latestRequests.map((item) => (
              <article key={item.id} className="psp-list-card">
                <div className="psp-list-card__row">
                  <div>
                    <h3 className="psp-list-card__title">{item.subject || 'Service request'}</h3>
                    <div className="psp-list-card__meta">
                      {item.customerName} {'->'} {item.providerName} | {item.serviceName}
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                    {item.status}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="psp-detail-item">
                    <div className="psp-detail-item__label">Quoted price</div>
                    <div className="psp-detail-item__value">
                      {item.quotedPrice ? `${item.quotedPrice} ${item.currencyCode}` : 'Not quoted'}
                    </div>
                  </div>
                  <div className="psp-detail-item">
                    <div className="psp-detail-item__label">Created</div>
                    <div className="psp-detail-item__value">{formatDateTimeLabel(item.createdAt)}</div>
                  </div>
                  <div className="psp-detail-item">
                    <div className="psp-detail-item__label">Export status</div>
                    <div className="psp-detail-item__value">Included in current summary</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminReports;
