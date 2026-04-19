import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, Search, Shield, Users2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async (currentSearch = search, currentRole = role, currentStatus = status) => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          search: currentSearch.trim() || undefined,
          role: currentRole !== 'all' ? currentRole : undefined,
          status: currentStatus !== 'all' ? currentStatus : undefined,
        },
      });
      const data = response.data?.data || [];
      setItems(data);
      setRoleDrafts(
        data.reduce((acc: Record<string, string>, item: UserItem) => {
          acc[item.id] = item.role;
          return acc;
        }, {})
      );
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [role, search, status]);

  useEffect(() => {
    void load('', 'all', 'all');
  }, [load]);

  const updateStatus = async (id: string, isActive: boolean) => {
    try {
      setActionId(id);
      await api.patch(`/admin/users/${id}/status`, { isActive });
      toast.success('User status updated.');
      await load(search, role, status);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionId(null);
    }
  };

  const updateRole = async (id: string) => {
    try {
      setActionId(id);
      await api.patch(`/admin/users/${id}/role`, { role: roleDrafts[id] });
      toast.success('User role updated.');
      await load(search, role, status);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update user role.');
    } finally {
      setActionId(null);
    }
  };

  const stats = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;
    const admins = items.filter((item) => item.role === 'admin').length;
    const reviewers = items.filter((item) => item.role === 'reviewer').length;

    return [
      {
        label: 'Visible users',
        value: String(items.length),
        caption: 'Accounts currently matching the active admin filters.',
      },
      {
        label: 'Active accounts',
        value: String(active),
        caption: 'Users who can still access the product normally.',
      },
      {
        label: 'Admin accounts',
        value: String(admins),
        caption: 'Operational staff with administrative privileges.',
      },
      {
        label: 'Reviewer accounts',
        value: String(reviewers),
        caption: 'Moderation-specific accounts inside the staffing pool.',
      },
    ];
  }, [items]);

  const openCustomerReviewComposer = (item: UserItem) => {
    const params = new URLSearchParams({
      subjectType: 'customer',
      subjectId: item.id,
      subjectLabel: `${item.firstName} ${item.lastName}`.trim() || item.email,
      subjectSecondary: `${item.email} | ${item.role} | ${item.isActive ? 'Active' : 'Inactive'}`,
    });

    navigate(`/admin/review-inbox?${params.toString()}`);
  };

  if (loading && !items.length) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">User management unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#2563eb_45%,#14b8a6)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <Users2 size={14} />
              Account control
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Search, activate, and reassign platform accounts without leaving admin ops
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              This workspace controls account hygiene. Search the full user base, filter by role or state,
              and update access or responsibility when marketplace operations need it.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur md:grid-cols-2">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[22px] bg-white/10 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">{item.label}</div>
                <div className="mt-2 text-[24px] font-black">{item.value}</div>
                <div className="mt-2 text-sm leading-6 text-white/70">{item.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>User filters</h2>
            <div className="psp-surface__sub">
              Search by name or email, then narrow the view by role and activation state.
            </div>
          </div>
          <button
            type="button"
            className="psp-button psp-button--secondary"
            onClick={() => navigate('/admin/review-inbox')}
          >
            Open review inbox
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>

          <select value={role} onChange={(event) => setRole(event.target.value)} className="psp-select">
            <option value="all">All roles</option>
            <option value="customer">Customer</option>
            <option value="service_provider">Service provider</option>
            <option value="reviewer">Reviewer</option>
            <option value="admin">Admin</option>
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="psp-select">
            <option value="all">All states</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="psp-button psp-button--primary" onClick={() => void load(search, role, status)}>
              Apply
            </button>
            <button type="button" className="psp-button psp-button--secondary" onClick={() => void load(search, role, status)}>
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      {!items.length ? (
        <div className="psp-empty-state">No users match the current filters.</div>
      ) : (
        <div className="psp-list">
          {items.map((item) => (
            <article key={item.id} className="psp-list-card">
              <div className="psp-list-card__row">
                <div>
                  <h3 className="psp-list-card__title">
                    {item.firstName} {item.lastName}
                  </h3>
                  <div className="psp-list-card__meta">{item.email}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      {item.role}
                    </span>
                    <span className={`psp-chip ${item.isActive ? 'psp-chip--active' : ''}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={roleDrafts[item.id] || item.role}
                    onChange={(event) =>
                      setRoleDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    className="psp-select min-w-[220px]"
                  >
                    <option value="customer">Customer</option>
                    <option value="service_provider">Service provider</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    type="button"
                    className="psp-button psp-button--secondary"
                    disabled={actionId === item.id || roleDrafts[item.id] === item.role}
                    onClick={() => void updateRole(item.id)}
                  >
                    <Shield size={16} />
                    Save role
                  </button>

                  <button
                    type="button"
                    className="psp-button psp-button--secondary"
                    disabled={actionId === item.id}
                    onClick={() => void updateStatus(item.id, !item.isActive)}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  {item.role === 'customer' ? (
                    <button
                      type="button"
                      className="psp-button psp-button--secondary"
                      onClick={() => openCustomerReviewComposer(item)}
                    >
                      Send customer to reviewer
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
