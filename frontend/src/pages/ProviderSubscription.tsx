import React, { useEffect, useState } from 'react';
import { BadgeCheck, Crown, Rocket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

interface PreferencesData {
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
    featuredOnHomepage: boolean;
    profileBadgeText?: string | null;
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

const ProviderSubscription: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PreferencesData | null>(null);
  const [form, setForm] = useState({
    selectedPlan: 'basic' as 'basic' | 'pro' | 'business',
    featuredOnHomepage: false,
    profileBadgeText: '',
  });

  const loadPreferences = async () => {
    try {
      const response = await api.get('/providers/me/preferences');
      const payload: PreferencesData = response.data?.data || null;
      setData(payload);
      setForm({
        selectedPlan: payload?.preference.selectedPlan || 'basic',
        featuredOnHomepage: payload?.preference.featuredOnHomepage || false,
        profileBadgeText: payload?.preference.profileBadgeText || '',
      });
    } catch {
      toast.error('Failed to load subscription settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPreferences();
  }, []);

  const savePlan = async () => {
    try {
      setSaving(true);
      const response = await api.put('/providers/me/preferences', {
        selectedPlan: form.selectedPlan,
        featuredOnHomepage: form.featuredOnHomepage,
        profileBadgeText: form.profileBadgeText,
      });
      setData(response.data?.data || null);
      toast.success('Plan and visibility settings updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update subscription settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#111827,#1d4ed8_58%,#7c3aed)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.18)]">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.12em] text-white/90">
              <Sparkles size={14} />
              Visibility and positioning
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Plans control how strongly the provider account stands out
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              This area is not just billing-facing. It determines visibility logic, badges, homepage featuring, and how premium the public profile feels.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            {[
              ['Current plan', form.selectedPlan.toUpperCase()],
              ['Featured on homepage', form.featuredOnHomepage ? 'Enabled' : 'Disabled'],
              ['Profile badge', form.profileBadgeText || 'Not set'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] bg-white/10 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{label}</div>
                <div className="mt-2 text-[22px] font-black">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {[
          {
            key: 'basic',
            title: 'Basic',
            icon: BadgeCheck,
            features: ['Provider profile', 'Service publishing', 'Messaging access'],
          },
          {
            key: 'pro',
            title: 'Pro',
            icon: Crown,
            features: ['Profile badge', 'Featured services', 'Promo badges on services and media'],
          },
          {
            key: 'business',
            title: 'Business',
            icon: Rocket,
            features: ['Homepage featuring', 'Best visibility stack', 'All Pro capabilities'],
          },
        ].map((plan) => {
          const Icon = plan.icon;
          const isActive = form.selectedPlan === plan.key;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  selectedPlan: plan.key as 'basic' | 'pro' | 'business',
                }))
              }
              className={`rounded-[28px] border p-5 text-left shadow-[0_20px_40px_rgba(15,23,42,0.05)] transition ${
                isActive
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-white/80 bg-white/95 text-slate-900 hover:-translate-y-1'
              }`}
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-white/12 text-white' : 'bg-blue-50 text-blue-700'}`}>
                <Icon size={20} />
              </div>
              <div className="mt-4 text-[24px] font-black tracking-tight">{plan.title}</div>
              <div className={`mt-4 grid gap-3 text-sm leading-7 ${isActive ? 'text-white/88' : 'text-slate-600'}`}>
                {plan.features.map((feature) => (
                  <div key={feature}>{feature}</div>
                ))}
              </div>
            </button>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Capability matrix</h2>
              <div className="psp-surface__sub">
                What the current plan unlocks in product behavior and public presentation.
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              ['Profile badge', data?.planFeatures.canUseProfileBadge ? 'Available' : 'Unavailable'],
              ['Promo badges', data?.planFeatures.canUseServicePromoBadge ? 'Available' : 'Unavailable'],
              ['Homepage featuring', data?.planFeatures.canFeatureOnHomepage ? 'Available' : 'Unavailable'],
              ['Featured services', data?.planFeatures.canFeatureServices ? 'Available' : 'Unavailable'],
            ].map(([label, value]) => (
              <div key={label} className="psp-detail-item">
                <div className="psp-detail-item__label">{label}</div>
                <div className="psp-detail-item__value">{value}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Visibility settings</h2>
              <div className="psp-surface__sub">
                These values are consumed directly by the discovery and public-profile layers.
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.featuredOnHomepage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featuredOnHomepage: event.target.checked,
                  }))
                }
                disabled={!data?.planFeatures.canFeatureOnHomepage}
              />
              Show this provider account on homepage featured sections
            </label>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Profile badge text</div>
              <input
                value={form.profileBadgeText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    profileBadgeText: event.target.value,
                  }))
                }
                placeholder="Certified / Fast response / Premium"
                className="psp-input"
                disabled={!data?.planFeatures.canUseProfileBadge}
              />
            </div>

            <button type="button" className="psp-button psp-button--primary" onClick={savePlan} disabled={saving}>
              {saving ? 'Saving plan...' : 'Save plan settings'}
            </button>

            <div className="rounded-[22px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              These settings already persist in the database and directly affect homepage featuring, public badges, and premium discovery behavior.
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Link to="/provider/profile" className="psp-button psp-button--secondary">
                Open public profile setup
              </Link>
              <Link to="/provider/services" className="psp-button psp-button--secondary">
                Improve services
              </Link>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default ProviderSubscription;
