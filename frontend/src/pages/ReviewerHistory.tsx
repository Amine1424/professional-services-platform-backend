import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateTimeLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface ReviewHistoryItem {
  id: string;
  decision: 'approved' | 'rejected' | 'request_info' | 'suspended';
  note?: string | null;
  createdAt: string;
  provider?: { id: string; companyName: string; status: string } | null;
  reviewer?: { firstName: string; lastName: string } | null;
}

const decisionLabelMap: Record<ReviewHistoryItem['decision'], string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  request_info: 'Request info',
  suspended: 'Suspended',
};

const decisionToneMap: Record<ReviewHistoryItem['decision'], string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  request_info: 'bg-amber-50 text-amber-700',
  suspended: 'bg-slate-200 text-slate-700',
};

const ReviewerHistory: React.FC = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<ReviewHistoryItem[]>([]);
  const [decisionFilter, setDecisionFilter] = useState<'all' | ReviewHistoryItem['decision']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/reviewer/history');
        if (!active) return;
        setItems(response.data?.data || []);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load reviewer history.'));
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

  const filteredItems = useMemo(() => {
    if (decisionFilter === 'all') return items;
    return items.filter((item) => item.decision === decisionFilter);
  }, [decisionFilter, items]);

  const stats = useMemo(() => {
    const approved = items.filter((item) => item.decision === 'approved').length;
    const rejected = items.filter((item) => item.decision === 'rejected').length;
    const requestInfo = items.filter((item) => item.decision === 'request_info').length;

    return [
      {
        label: 'Recorded decisions',
        value: String(items.length),
        caption: 'All moderation decisions currently stored in reviewer history.',
        icon: ShieldCheck,
      },
      {
        label: 'Approved',
        value: String(approved),
        caption: 'Providers cleared for marketplace visibility.',
        icon: CheckCircle2,
      },
      {
        label: 'Rejected',
        value: String(rejected),
        caption: 'Provider records explicitly blocked from approval.',
        icon: ShieldAlert,
      },
      {
        label: 'Request info',
        value: String(requestInfo),
        caption: 'Cases that needed additional evidence before a final decision.',
        icon: Clock3,
      },
    ];
  }, [items]);

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
        <div className="font-bold">{t('Reviewer history unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              {t('Reviewer decision archive')}
            </div>
            <h2 className="mt-3 text-[34px] font-black tracking-tight text-slate-900">
              {t('Audit previous moderation calls without leaving the shell workflow')}
            </h2>
            <div className="mt-4 max-w-[760px] text-sm leading-8 text-slate-600">
              {t(
                'Use history to check the quality of previous decisions, reopen provider records when context is missing, and keep moderation reasoning consistent across the team.'
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <Link to="/reviewer/pending" className="psp-button psp-button--primary">
              {t('Open pending queue')}
            </Link>
            <Link to="/reviewer/inbox" className="psp-button psp-button--secondary">
              {t('Review inbox')}
            </Link>
            <div className="psp-summary-strip">
              <Link to="/reviewer/dashboard" className="psp-summary-chip">
                <strong>{t('Dashboard')}</strong>
                {t('Current queue')}
              </Link>
              <Link to="/reviewer/profile" className="psp-summary-chip">
                <strong>{t('Reviewer profile')}</strong>
                {t('Personal stats')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((item) => {
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

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Decision filters</h2>
            <div className="psp-surface__sub">
              {t('Narrow the archive by moderation outcome before reopening a provider record.')}
            </div>
          </div>
          <div className="psp-summary-chip">
            <strong>{t('Visible')}</strong>
            {filteredItems.length} {t('visible')}
          </div>
        </div>

        <div className="psp-control-bar">
          {[
            ['all', 'All decisions'],
            ['approved', 'Approved'],
            ['rejected', 'Rejected'],
            ['request_info', 'Request info'],
            ['suspended', 'Suspended'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`psp-control-pill ${decisionFilter === key ? 'psp-control-pill--active' : ''}`}
              onClick={() => setDecisionFilter(key as typeof decisionFilter)}
              aria-pressed={decisionFilter === key}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </section>

      {!filteredItems.length ? (
        <div className="psp-empty-state">{t('No review history matches the selected filter.')}</div>
      ) : (
        <section className="psp-list">
          {filteredItems.map((item) => (
            <article key={item.id} className="psp-list-card">
              <div className="psp-list-card__row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="psp-list-card__title">
                      {item.provider?.companyName || t('Provider record')}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${decisionToneMap[item.decision]}`}
                    >
                      {t(decisionLabelMap[item.decision])}
                    </span>
                  </div>
                  <div className="psp-list-card__meta">
                    {t('Provider status')}: {item.provider?.status || t('unknown')}
                  </div>
                  <div className="psp-list-card__meta">
                    {t('Reviewer')}: {item.reviewer?.firstName || t('Reviewer')} {item.reviewer?.lastName || ''}
                  </div>
                  <div className="psp-list-card__meta">{formatDateTimeLabel(item.createdAt)}</div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {item.note || t('No moderation note was added.')}
                  </div>
                </div>

                {item.provider?.id ? (
                  <div className="psp-list-card__actions">
                    <Link to={`/reviewer/providers/${item.provider.id}`} className="psp-button psp-button--primary">
                      {t('Open review')}
                    </Link>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default ReviewerHistory;
