import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Inbox, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface PendingProvider {
  id: string;
  companyName: string;
  description?: string | null;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  yearsOfExperience: number;
  createdAt: string;
  status?: string;
  isVerified?: boolean;
  owner: { firstName: string; lastName: string; email: string };
  primaryCategory?: { name: string } | null;
  servicesCount: number;
}

const ReviewerPending: React.FC = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<PendingProvider[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/reviewer/pending');
        if (!active) return;
        setItems(response.data?.data || []);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load pending providers.'));
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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      [
        item.companyName,
        item.owner.firstName,
        item.owner.lastName,
        item.owner.email,
        item.primaryCategory?.name || '',
        item.city || '',
        item.wilaya || '',
        item.region || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [items, query]);

  const stats = useMemo(() => {
    const categories = new Set(
      items.map((item) => item.primaryCategory?.name).filter(Boolean)
    ).size;
    const experienced = items.filter((item) => item.yearsOfExperience >= 5).length;

    return [
      {
        label: 'Pending accounts',
        value: String(items.length),
        caption: 'Provider records currently waiting for first review.',
        icon: Inbox,
      },
      {
        label: 'Visible results',
        value: String(filteredItems.length),
        caption: 'Rows matching the current search state.',
        icon: Search,
      },
      {
        label: 'Experienced profiles',
        value: String(experienced),
        caption: 'Queue entries declaring five or more years of experience.',
        icon: ShieldCheck,
      },
      {
        label: 'Category spread',
        value: String(categories),
        caption: 'Distinct primary categories currently represented in the queue.',
        icon: Clock3,
      },
    ];
  }, [filteredItems.length, items]);

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
        <div className="font-bold">{t('Pending queue unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              {t('Reviewer pending queue')}
            </div>
            <h2 className="mt-3 text-[34px] font-black tracking-tight text-slate-900">
              {t('Move cleanly from intake to an explicit moderation decision')}
            </h2>
            <div className="mt-4 max-w-[760px] text-sm leading-8 text-slate-600">
              {t(
                'Search the queue, scan provider credibility signals, then open the full review record only when the account is ready for a real decision.'
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <Link to="/reviewer/inbox" className="psp-button psp-button--primary">
              {t('Open review inbox')}
            </Link>
            <Link to="/reviewer/history" className="psp-button psp-button--secondary">
              {t('Decision history')}
            </Link>
            <div className="psp-summary-strip">
              <Link to="/reviewer/dashboard" className="psp-summary-chip">
                <strong>{t('Dashboard')}</strong>
                {t('Queue overview')}
              </Link>
              <Link to="/reviewer/profile" className="psp-summary-chip">
                <strong>{t('Reviewer profile')}</strong>
                {t('Personal workload')}
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
            <h2>{t('Queue filters')}</h2>
            <div className="psp-surface__sub">
              {t('Search by provider, owner, category, or location before opening a record.')}
            </div>
          </div>
          <div className="psp-summary-chip">
            <strong>{t('Visible')}</strong>
            {filteredItems.length} {t('visible')}
          </div>
        </div>

        <label className="psp-input-shell">
          <Search size={18} className="psp-input-shell__icon" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Search pending accounts')}
          />
        </label>
      </section>

      {!filteredItems.length ? (
        <div className="psp-empty-state">
          {items.length
            ? t('No pending providers match the current search.')
            : t('There are no pending providers right now.')}
        </div>
      ) : (
        <section className="psp-list">
          {filteredItems.map((item) => (
            <article key={item.id} className="psp-list-card">
              <div className="psp-list-card__row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="psp-list-card__title">{item.companyName}</h3>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                      {item.status || t('pending')}
                    </span>
                    {item.isVerified ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                        {t('verified')}
                      </span>
                    ) : null}
                  </div>
                  <div className="psp-list-card__meta">
                    {item.primaryCategory?.name || t('No category')} | {item.yearsOfExperience}{' '}
                    {t('years experience')} | {item.servicesCount} {t(item.servicesCount === 1 ? 'service' : 'services')}
                  </div>
                  <div className="psp-list-card__meta">
                    {[item.city, item.wilaya, item.region].filter(Boolean).join(', ') || t('Algeria')}
                  </div>
                  <div className="psp-list-card__meta">
                    {item.owner.firstName} {item.owner.lastName} | {item.owner.email}
                  </div>

                  {item.description ? (
                    <div className="mt-3 text-sm leading-7 text-slate-600">{item.description}</div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      {t('Created')} {formatDateLabel(item.createdAt)}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      {t('Next step: review account')}
                    </span>
                  </div>
                </div>

                <div className="psp-list-card__actions">
                  <Link to={`/reviewer/providers/${item.id}`} className="psp-button psp-button--primary">
                    {t('Review account')}
                  </Link>
                  <Link to={`/providers/${item.id}`} className="psp-button psp-button--ghost">
                    {t('Public page')}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default ReviewerPending;
