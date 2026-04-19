import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, ShieldCheck, UserPlus, UserRoundCog } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

interface ReviewerItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export const AdminReviewers: React.FC = () => {
  const [items, setItems] = useState<ReviewerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/reviewers');
      setItems(response.data?.data || []);
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || 'Failed to load reviewer roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const promote = async () => {
    if (!email.trim()) {
      toast.error('Reviewer email is required.');
      return;
    }

    try {
      setActionId('promote');
      await api.post('/admin/reviewers/promote', { email: email.trim() });
      toast.success('Reviewer access granted.');
      setEmail('');
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to grant reviewer access.');
    } finally {
      setActionId(null);
    }
  };

  const toggleStatus = async (item: ReviewerItem) => {
    try {
      setActionId(item.id);
      await api.patch(`/admin/reviewers/${item.id}/status`, {
        isActive: !item.isActive,
      });
      toast.success(`Reviewer ${item.isActive ? 'disabled' : 'activated'}.`);
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update reviewer status.');
    } finally {
      setActionId(null);
    }
  };

  const stats = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;
    const inactive = items.length - active;

    return [
      {
        label: 'Reviewer seats',
        value: String(items.length),
        caption: 'Current moderation headcount inside the platform.',
      },
      {
        label: 'Active reviewers',
        value: String(active),
        caption: 'Reviewers currently allowed to process provider intake.',
      },
      {
        label: 'Paused reviewers',
        value: String(inactive),
        caption: 'Accounts kept on standby without deleting role assignment.',
      },
    ];
  }, [items]);

  if (loading && !items.length) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Reviewer staffing unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#4f46e5_42%,#0ea5e9)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <UserRoundCog size={14} />
              Moderation staffing
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Control who can review provider quality and onboarding readiness
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              Reviewer access should stay intentional. This workspace lets admin assign reviewer seats
              and pause them without destroying the moderation structure.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur md:grid-cols-3">
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
            <h2>Grant reviewer access</h2>
            <div className="psp-surface__sub">
              Promote an existing account by email. The backend already guards against invalid admin conversions.
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="psp-input"
            placeholder="reviewer@example.com"
          />
          <button
            type="button"
            className="psp-button psp-button--primary"
            disabled={actionId === 'promote'}
            onClick={() => void promote()}
          >
            <UserPlus size={16} />
            Grant reviewer role
          </button>
          <button type="button" className="psp-button psp-button--secondary" onClick={() => void load()}>
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      {!items.length ? (
        <div className="psp-empty-state">No reviewers have been assigned yet.</div>
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
                </div>
                <div className="psp-list-card__actions">
                  <span className={`psp-chip ${item.isActive ? 'psp-chip--active' : ''}`}>
                    {item.isActive ? 'Active reviewer' : 'Paused reviewer'}
                  </span>
                  <button
                    type="button"
                    className="psp-button psp-button--secondary"
                    disabled={actionId === item.id}
                    onClick={() => void toggleStatus(item)}
                  >
                    <ShieldCheck size={16} />
                    {item.isActive ? 'Pause reviewer' : 'Activate reviewer'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviewers;
