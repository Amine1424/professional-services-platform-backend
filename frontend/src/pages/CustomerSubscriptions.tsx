import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Crown, Heart, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

type CustomerPlan = 'free' | 'premium';

const CustomerSubscriptions: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<CustomerPlan>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/customers/me/preferences');
        if (!active) return;
        setSelectedPlan(response.data?.data?.selectedPlan || 'free');
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Failed to load customer plan.');
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
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      await api.put('/customers/me/preferences', {
        selectedPlan,
      });
      toast.success('Customer plan updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update customer plan.');
    } finally {
      setSaving(false);
    }
  };

  const planCards = useMemo(
    () => [
      {
        key: 'free' as CustomerPlan,
        title: 'Free',
        eyebrow: 'Default access',
        description:
          'Best for discovery, first requests, saving favorites, and validating the marketplace fit.',
        features: [
          'Explore providers and public profiles',
          'Save favorites and compare later',
          'Open messages and create requests',
          'Publish customer reviews',
        ],
        icon: Search,
      },
      {
        key: 'premium' as CustomerPlan,
        title: 'Premium',
        eyebrow: 'Preference upgrade',
        description:
          'Stored today as a stronger customer preference so the product can grow into richer alerts and personalization.',
        features: [
          'Higher-priority recommendation intent',
          'Richer provider update awareness',
          'Future-facing premium alert behavior',
          'Cleaner path for advanced loyalty features',
        ],
        icon: Crown,
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Subscription preferences unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_52%,#7dd3fc)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <Sparkles size={14} />
              Customer plan layer
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Treat subscription as part of customer intelligence
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              This plan preference is already stored in the account model. It can shape future recommendations,
              notification priority, and loyalty logic without breaking the current customer flow.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Current plan', selectedPlan.toUpperCase()],
                ['Plan state', selectedPlan === 'premium' ? 'Enhanced' : 'Standard'],
                ['Search experience', 'Active'],
                ['Messaging access', 'Enabled'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">{label}</div>
                  <div className="mt-2 text-[24px] font-black">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {[
          {
            label: 'Discovery',
            value: 'Core',
            caption: 'Explore remains available regardless of plan.',
            icon: Search,
          },
          {
            label: 'Favorites',
            value: 'Included',
            caption: 'Shortlisting providers stays part of the default customer flow.',
            icon: Heart,
          },
          {
            label: 'Alerts',
            value: selectedPlan === 'premium' ? 'Priority ready' : 'Standard',
            caption: 'Plan preference can evolve into richer marketplace alerts later.',
            icon: Bell,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-stat-card">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="psp-stat-card__label mt-4">{item.label}</div>
              <div className="psp-stat-card__value text-[24px]">{item.value}</div>
              <div className="psp-stat-card__caption">{item.caption}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {planCards.map((plan) => {
          const Icon = plan.icon;
          const isActive = selectedPlan === plan.key;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedPlan(plan.key)}
              className={`rounded-[30px] border p-6 text-left shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition ${
                isActive
                  ? 'border-blue-300 bg-[linear-gradient(180deg,#eff6ff,#dbeafe)]'
                  : 'border-white/80 bg-white/90'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {plan.eyebrow}
                  </div>
                  <div className="mt-3 text-[30px] font-black tracking-tight text-slate-900">
                    {plan.title}
                  </div>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-sm leading-8 text-slate-600">{plan.description}</p>

              <div className="mt-5 grid gap-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-[18px] bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
                    {feature}
                  </div>
                ))}
              </div>

              {isActive ? (
                <div className="mt-5 inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">
                  Current selection
                </div>
              ) : null}
            </button>
          );
        })}
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Plan decision</h2>
            <div className="psp-surface__sub">
              This currently stores customer intent cleanly without inventing fake billing behavior.
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="text-[20px] font-black tracking-tight text-slate-900">
              What this changes today
            </div>
            <div className="mt-3 text-sm leading-8 text-slate-600">
              The selected plan is persisted inside customer preferences. That gives the product a real place to attach future premium behavior without shipping fake payment or entitlement flows prematurely.
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="text-[20px] font-black tracking-tight text-slate-900">
              Best next actions
            </div>
            <div className="mt-3 grid gap-3">
              <Link to="/customer/explore" className="psp-button psp-button--primary">
                Explore providers
              </Link>
              <Link to="/customer/favorites" className="psp-button psp-button--secondary">
                Open favorites
              </Link>
              <Link to="/customer/notifications?filter=unread" className="psp-button psp-button--secondary">
                Review unread alerts
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={saving} className="psp-button psp-button--primary">
            {saving ? 'Saving plan...' : 'Save plan preference'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomerSubscriptions;
