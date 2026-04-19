import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

interface ProviderItem {
  id: string;
  companyName: string;
  avatarUrl?: string | null;
  status: string;
  isVerified: boolean;
  city?: string | null;
  wilaya?: string | null;
  region?: string | null;
  createdAt: string;
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  primaryCategory?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  preference: {
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
    selectedPlan: string;
  };
}

const statusToneMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  suspended: 'bg-slate-200 text-slate-700',
};

const getNextActionLabel = (item: ProviderItem) => {
  if (item.status === 'pending') return 'Review or send to reviewer';
  if (!item.isVerified) return 'Assign trust if approval is still valid';
  if (!item.preference.featuredOnHomepage) return 'Decide whether discovery featuring is justified';
  return 'Monitor badge and visibility state';
};

const AdminProviders: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [badgeDrafts, setBadgeDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async (currentSearch = '', currentStatus = 'all') => {
    try {
      setLoading(true);
      const response = await api.get('/admin/providers', {
        params: {
          search: currentSearch.trim() || undefined,
          status: currentStatus !== 'all' ? currentStatus : undefined,
        },
      });

      const data = response.data?.data || [];
      setItems(data);
      setBadgeDrafts(
        data.reduce((acc: Record<string, string>, item: ProviderItem) => {
          acc[item.id] = item.preference.profileBadgeText || '';
          return acc;
        }, {})
      );
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || t('Failed to load providers.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    const nextStatus = searchParams.get('status') || 'all';
    setSearch(nextSearch);
    setStatusFilter(nextStatus);
    void load(nextSearch, nextStatus);
  }, [load, searchParams]);

  const updateProvider = async (
    id: string,
    payload: {
      status?: string;
      isVerified?: boolean;
      featuredOnHomepage?: boolean;
      profileBadgeText?: string | null;
    }
  ) => {
    try {
      setActionId(id);
      await api.patch(`/admin/providers/${id}/moderation`, payload);
      toast.success(t('Provider moderation updated.'));
      await load(search, statusFilter);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t('Failed to update provider moderation.'));
    } finally {
      setActionId(null);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set('search', search.trim());
    }

    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }

    setSearchParams(params, { replace: true });
  };

  const openReviewComposer = (item: ProviderItem) => {
    const params = new URLSearchParams({
      subjectType: 'provider',
      subjectId: item.id,
      subjectLabel: item.companyName,
    });

    const secondaryLabel = [
      `${item.owner.firstName} ${item.owner.lastName}`.trim(),
      item.owner.email,
      item.primaryCategory?.name || t('Category pending'),
      [item.city, item.wilaya, item.region].filter(Boolean).join(', ') || t('Algeria'),
    ]
      .filter(Boolean)
      .join(' | ');

    if (secondaryLabel) {
      params.set('subjectSecondary', secondaryLabel);
    }

    navigate(`/admin/review-inbox?${params.toString()}`);
  };

  const stats = useMemo(() => {
    const approved = items.filter((item) => item.status === 'approved').length;
    const pending = items.filter((item) => item.status === 'pending').length;
    const verified = items.filter((item) => item.isVerified).length;
    const featured = items.filter((item) => item.preference.featuredOnHomepage).length;

    return [
      {
        label: 'Pending review',
        value: pending,
        caption: 'Accounts still waiting for a clean moderation decision.',
      },
      {
        label: 'Approved',
        value: approved,
        caption: 'Providers currently cleared for marketplace visibility.',
      },
      {
        label: 'Verified',
        value: verified,
        caption: 'Trust-confirmed providers visible to customers.',
      },
      {
        label: 'Homepage featured',
        value: featured,
        caption: 'Providers currently promoted in discovery surfaces.',
      },
    ];
  }, [items]);

  if (loading && !items.length) {
    return (
      <div className="psp-page-stack">
        <div className="psp-loading-block psp-loading-block--sm" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Provider moderation unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Provider moderation desk')}
            </div>
            <h2 className="mt-3 text-[32px] font-black tracking-tight text-slate-900">
              {t('Approval, trust, and visibility controls')}
            </h2>
            <div className="mt-3 max-w-[760px] text-sm leading-8 text-slate-600">
              {t(
                'This workspace is for provider intake review, trust assignment, homepage featuring, and badge control. Search and filter first, then apply only operationally justified changes.'
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {stats.map((item) => (
              <div key={item.label} className="psp-ops-panel">
                <div className="psp-ops-panel__label">{t(item.label)}</div>
                <div className="psp-ops-panel__value">{item.value}</div>
                <div className="psp-ops-panel__caption">{t(item.caption)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Provider queue filters')}</h2>
            <div className="psp-surface__sub">
              {t('Filter before acting so verification and featuring decisions stay deliberate.')}
            </div>
          </div>
          <div className="psp-summary-chip">
            <strong>{t('Visible')}</strong>
            {items.length} {t('providers')}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_220px_auto]">
          <label className="psp-input-shell">
            <Search size={18} className="psp-input-shell__icon" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search by provider, owner, email, or location')}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="psp-select"
          >
            <option value="all">{t('All statuses')}</option>
            <option value="pending">{t('Pending')}</option>
            <option value="approved">{t('Approved')}</option>
            <option value="rejected">{t('Rejected')}</option>
            <option value="suspended">{t('Suspended')}</option>
          </select>

          <div className="psp-button-group">
            <button type="button" className="psp-button psp-button--primary" onClick={applyFilters}>
              {t('Refresh queue')}
            </button>
            <button
              type="button"
              className="psp-button psp-button--ghost"
              onClick={() => navigate('/admin/review-inbox')}
            >
              {t('Open review inbox')}
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      {!items.length ? (
        <div className="psp-empty-state">{t('No providers match the current filters.')}</div>
      ) : (
        <section className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{t('Provider moderation queue')}</h2>
              <div className="psp-surface__sub">
                {t('Use direct actions on each row to approve, reject, verify, feature, or update badge text.')}
              </div>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="psp-data-table min-w-[1160px]">
              <thead>
                <tr>
                  <th>{t('Provider')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Location')}</th>
                  <th>{t('Commercial state')}</th>
                  <th>{t('Badge control')}</th>
                  <th>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="psp-data-table__title">{item.companyName}</div>
                      <div className="psp-data-table__sub">
                        {item.owner.firstName} {item.owner.lastName} | {item.owner.email}
                      </div>
                      <div className="psp-data-table__sub">
                        {item.primaryCategory?.name || t('Category pending')}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                            statusToneMap[item.status] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t(item.status)}
                        </span>
                      </div>
                      <div className="psp-data-table__sub">
                        {t(item.isVerified ? 'Verified provider' : 'Verification not assigned')}
                      </div>
                      <div className="psp-data-table__sub">{t(getNextActionLabel(item))}</div>
                    </td>
                    <td>
                      <div className="psp-data-table__title">
                        {[item.city, item.wilaya, item.region].filter(Boolean).join(', ') || t('Location pending')}
                      </div>
                    </td>
                    <td>
                      <div className="psp-data-table__title capitalize">{item.preference.selectedPlan}</div>
                      <div className="psp-data-table__sub">
                        {t(item.preference.featuredOnHomepage ? 'Homepage featured' : 'Standard discovery visibility')}
                      </div>
                    </td>
                    <td>
                      <input
                        value={badgeDrafts[item.id] || ''}
                        onChange={(event) =>
                          setBadgeDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        className="psp-input"
                        placeholder={t('Optional profile badge')}
                      />
                    </td>
                    <td>
                      <div className="grid gap-3">
                        <div>
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {t('Moderation')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              onClick={() => openReviewComposer(item)}
                            >
                              {t('Send to reviewer')}
                            </button>
                            <button
                              type="button"
                              className="psp-button psp-button--primary"
                              disabled={actionId === item.id}
                              onClick={() => void updateProvider(item.id, { status: 'approved' })}
                            >
                              {t('Approve')}
                            </button>
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              disabled={actionId === item.id}
                              onClick={() => void updateProvider(item.id, { status: 'rejected' })}
                            >
                              {t('Reject')}
                            </button>
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              disabled={actionId === item.id}
                              onClick={() => void updateProvider(item.id, { status: 'suspended' })}
                            >
                              {t('Suspend')}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {t('Visibility and trust')}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              disabled={actionId === item.id}
                              onClick={() => void updateProvider(item.id, { isVerified: !item.isVerified })}
                            >
                              {t(item.isVerified ? 'Unverify' : 'Verify')}
                            </button>
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              disabled={actionId === item.id}
                              onClick={() =>
                                void updateProvider(item.id, {
                                  featuredOnHomepage: !item.preference.featuredOnHomepage,
                                })
                              }
                            >
                              {t(item.preference.featuredOnHomepage ? 'Unfeature' : 'Feature')}
                            </button>
                            <button
                              type="button"
                              className="psp-button psp-button--ghost"
                              disabled={actionId === item.id}
                              onClick={() =>
                                void updateProvider(item.id, {
                                  profileBadgeText: (badgeDrafts[item.id] || '').trim() || null,
                                })
                              }
                            >
                              <ShieldCheck size={15} />
                              {t('Save badge')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminProviders;
