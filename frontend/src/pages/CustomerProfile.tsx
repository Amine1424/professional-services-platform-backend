import React, { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { ALGERIA_WILAYAS, MARKET_REGIONS } from '../lib/algeria';
import '../styles/app-primitives.css';

type CustomerPlan = 'free' | 'premium';

const CustomerProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const [preferences, setPreferences] = useState({
    interestsInput: '',
    selectedPlan: 'free' as CustomerPlan,
    preferredRegion: '',
    preferredWilaya: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get('/customers/me');
        if (!active) return;

        const user = response.data?.data?.user;
        const preference = response.data?.data?.preference;

        setAccount({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
        });

        setPreferences({
          interestsInput: (preference?.interests || []).join(', '),
          selectedPlan: preference?.selectedPlan || 'free',
          preferredRegion: preference?.preferredRegion || '',
          preferredWilaya: preference?.preferredWilaya || '',
        });

        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Failed to load customer profile.');
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

  const parsedInterests = useMemo(
    () =>
      preferences.interestsInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [preferences.interestsInput]
  );

  const profileReadiness = useMemo(() => {
    const checks = [
      Boolean(account.firstName.trim()),
      Boolean(account.lastName.trim()),
      Boolean(account.email.trim()),
      Boolean(account.phoneNumber.trim()),
      Boolean(preferences.preferredRegion.trim()),
      Boolean(preferences.preferredWilaya.trim()),
      parsedInterests.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [account, parsedInterests.length, preferences.preferredRegion, preferences.preferredWilaya]);

  const saveAccount = async () => {
    if (!account.firstName.trim() || !account.lastName.trim() || !account.email.trim()) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    try {
      setSavingAccount(true);
      await api.put('/customers/me', account);
      toast.success('Customer profile updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update customer profile.');
    } finally {
      setSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSavingPreferences(true);
      await api.put('/customers/me/preferences', {
        interests: parsedInterests,
        selectedPlan: preferences.selectedPlan,
        preferredRegion: preferences.preferredRegion.trim() || null,
        preferredWilaya: preferences.preferredWilaya.trim() || null,
      });
      toast.success('Customer preferences updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update customer preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await api.post('/customers/me/change-password', passwordForm);
      toast.success('Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[28px] bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Customer profile unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#2563eb_55%,#93c5fd)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <UserRound size={14} />
              Personal workspace
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Keep your account ready for faster discovery and follow-up
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              Customer profile data powers saved providers, discovery preferences, and smoother follow-up
              after requests or conversations.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Profile readiness', `${profileReadiness}%`],
                ['Plan', preferences.selectedPlan.toUpperCase()],
                ['Interest tags', String(parsedInterests.length)],
                ['Preferred area', preferences.preferredWilaya || preferences.preferredRegion || 'Not set'],
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
            label: 'Discovery focus',
            value: parsedInterests.length ? `${parsedInterests.length} interests` : 'Unset',
            caption: 'Topics used to make the account feel more relevant in future recommendations.',
            icon: Search,
          },
          {
            label: 'Preferred location',
            value: preferences.preferredWilaya || preferences.preferredRegion || 'Unset',
            caption: 'Useful when exploring local providers and reviewing location-based suggestions.',
            icon: MapPin,
          },
          {
            label: 'Trust readiness',
            value: account.phoneNumber ? 'Complete' : 'Needs phone',
            caption: 'Phone number helps when providers need a stronger follow-up channel.',
            icon: ShieldCheck,
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Personal identity</h2>
              <div className="psp-surface__sub">
                These details anchor the customer account used across messages, requests, and reviews.
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">First name</div>
                <input
                  className="psp-input"
                  value={account.firstName}
                  onChange={(event) =>
                    setAccount((current) => ({ ...current, firstName: event.target.value }))
                  }
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Last name</div>
                <input
                  className="psp-input"
                  value={account.lastName}
                  onChange={(event) =>
                    setAccount((current) => ({ ...current, lastName: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Email</div>
                <input
                  type="email"
                  className="psp-input"
                  value={account.email}
                  onChange={(event) =>
                    setAccount((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Phone number</div>
                <input
                  className="psp-input"
                  value={account.phoneNumber}
                  onChange={(event) =>
                    setAccount((current) => ({ ...current, phoneNumber: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={savingAccount}
                onClick={saveAccount}
              >
                {savingAccount ? 'Saving profile...' : 'Save personal details'}
              </button>
            </div>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Discovery preferences</h2>
              <div className="psp-surface__sub">
                These values guide the type of providers and regions that should feel more relevant.
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <Heart size={14} />
                Interest tags
              </div>
              <textarea
                className="psp-textarea"
                value={preferences.interestsInput}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    interestsInput: event.target.value,
                  }))
                }
                placeholder="Write interests separated by commas, for example: electrician, interior design, cleaning"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {parsedInterests.length ? (
                  parsedInterests.map((interest) => (
                    <span key={interest} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No interests added yet.</span>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Account plan</div>
                <select
                  className="psp-select"
                  value={preferences.selectedPlan}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      selectedPlan: event.target.value as CustomerPlan,
                    }))
                  }
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Usage note
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  This preference is stored now and can later drive membership behavior without changing the current flow.
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Preferred region</div>
                <select
                  className="psp-input"
                  value={preferences.preferredRegion}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      preferredRegion: event.target.value,
                    }))
                  }
                >
                  <option value="">Select preferred region</option>
                  {MARKET_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">Preferred wilaya</div>
                <select
                  className="psp-input"
                  value={preferences.preferredWilaya}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      preferredWilaya: event.target.value,
                    }))
                  }
                >
                  <option value="">Select preferred wilaya</option>
                  {ALGERIA_WILAYAS.map((wilaya) => (
                    <option key={wilaya} value={wilaya}>
                      {wilaya}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={savingPreferences}
                onClick={savePreferences}
              >
                {savingPreferences ? 'Saving preferences...' : 'Save discovery preferences'}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Password and account protection</h2>
            <div className="psp-surface__sub">
              This uses the existing customer password endpoint with server-side strength validation.
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Current password</div>
              <input
                type="password"
                className="psp-input"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">New password</div>
              <input
                type="password"
                className="psp-input"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Confirm new password</div>
              <input
                type="password"
                className="psp-input"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 p-5">
            <div className="text-[20px] font-black tracking-tight text-slate-900">
              Security guidance
            </div>
            <div className="mt-3 text-sm leading-8 text-slate-600">
              Use a unique password. The backend enforces the actual password complexity rules, so this page stays aligned with server validation.
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="psp-button psp-button--primary"
            disabled={savingPassword}
            onClick={changePassword}
          >
            {savingPassword ? 'Updating password...' : 'Change password'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CustomerProfile;
