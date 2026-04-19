import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Eye, LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

type AutoReplyTone = 'professional' | 'friendly' | 'concise';

interface AccountState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface PreferenceState {
  selectedPlan: 'basic' | 'pro' | 'business';
  autoReplyEnabled: boolean;
  autoReplyTone: AutoReplyTone;
  autoReplySignature: string;
  privacyShowEmail: boolean;
  privacyShowPhone: boolean;
  privacyShowAddress: boolean;
}

const ProviderSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [account, setAccount] = useState<AccountState>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });

  const [preferences, setPreferences] = useState<PreferenceState>({
    selectedPlan: 'basic',
    autoReplyEnabled: false,
    autoReplyTone: 'professional',
    autoReplySignature: '',
    privacyShowEmail: false,
    privacyShowPhone: true,
    privacyShowAddress: false,
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
        const response = await api.get('/providers/me');
        if (!active) return;

        const provider = response.data?.data;
        const preference = provider?.preference;

        setAccount({
          firstName: provider?.user?.firstName || '',
          lastName: provider?.user?.lastName || '',
          email: provider?.user?.email || '',
          phoneNumber: provider?.user?.phoneNumber || '',
        });

        setPreferences({
          selectedPlan: preference?.selectedPlan || 'basic',
          autoReplyEnabled: Boolean(preference?.autoReplyEnabled),
          autoReplyTone: (preference?.autoReplyTone as AutoReplyTone) || 'professional',
          autoReplySignature: preference?.autoReplySignature || '',
          privacyShowEmail: Boolean(preference?.privacyShowEmail),
          privacyShowPhone: preference?.privacyShowPhone ?? true,
          privacyShowAddress: Boolean(preference?.privacyShowAddress),
        });

        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || 'Failed to load provider settings.');
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

  const visibilitySignals = useMemo(
    () =>
      [
        preferences.privacyShowEmail,
        preferences.privacyShowPhone,
        preferences.privacyShowAddress,
      ].filter(Boolean).length,
    [preferences]
  );

  const saveAccount = async () => {
    if (!account.firstName.trim() || !account.lastName.trim() || !account.email.trim()) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    try {
      setSavingAccount(true);
      await api.put('/providers/me/account', account);
      toast.success('Account information updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update account information.');
    } finally {
      setSavingAccount(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSavingPreferences(true);
      await api.put('/providers/me/preferences', {
        autoReplyEnabled: preferences.autoReplyEnabled,
        autoReplyTone: preferences.autoReplyTone,
        autoReplySignature: preferences.autoReplySignature.trim() || null,
        privacyShowEmail: preferences.privacyShowEmail,
        privacyShowPhone: preferences.privacyShowPhone,
        privacyShowAddress: preferences.privacyShowAddress,
      });
      toast.success('Communication and privacy settings updated.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update provider preferences.');
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
      await api.post('/providers/me/change-password', passwordForm);
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
        <div className="font-bold">Provider settings unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#38bdf8)] p-6 text-white shadow-[0_28px_60px_rgba(15,23,42,0.16)]">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <ShieldCheck size={14} />
              Trust, privacy, and security
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Keep account controls clean and customer-facing
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              This workspace controls what customers can see, how quickly the inbox can respond,
              and how safely the provider account is maintained.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Plan', preferences.selectedPlan.toUpperCase()],
                ['Public signals', `${visibilitySignals}/3`],
                ['AI reply', preferences.autoReplyEnabled ? 'Enabled' : 'Disabled'],
                ['Security', 'Password protected'],
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
            label: 'Visible contact channels',
            value: String(visibilitySignals),
            caption: 'How many public contact signals are currently exposed on the public profile.',
            icon: Eye,
          },
          {
            label: 'Inbox support',
            value: preferences.autoReplyEnabled ? 'AI ready' : 'Manual only',
            caption: 'Provider inbox can draft faster replies when AI support is enabled.',
            icon: Bot,
          },
          {
            label: 'Account owner',
            value: `${account.firstName || 'Provider'} ${account.lastName || ''}`.trim(),
            caption: 'Primary account holder information used across the dashboard.',
            icon: UserRound,
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
              <h2>Account identity</h2>
              <div className="psp-surface__sub">
                Maintain the account holder details used for login, moderation, and provider communication.
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
                <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Mail size={14} />
                  Email
                </div>
                <input
                  className="psp-input"
                  type="email"
                  value={account.email}
                  onChange={(event) =>
                    setAccount((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div>
                <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Phone size={14} />
                  Phone number
                </div>
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
                {savingAccount ? 'Saving account...' : 'Save account details'}
              </button>
              <div className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
                Email uniqueness and role ownership are enforced by the backend.
              </div>
            </div>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Visibility and inbox behavior</h2>
              <div className="psp-surface__sub">
                Control what customers can see and whether AI support should assist the provider inbox.
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-3">
              {[
                {
                  key: 'privacyShowEmail' as const,
                  title: 'Show email publicly',
                  body: 'Useful when you want direct contact visible on the public provider page.',
                },
                {
                  key: 'privacyShowPhone' as const,
                  title: 'Show phone publicly',
                  body: 'High-conversion signal for customers who prefer calling before requesting.',
                },
                {
                  key: 'privacyShowAddress' as const,
                  title: 'Show address publicly',
                  body: 'Useful for local trust when customers care about exact physical presence.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-[22px] bg-slate-50 p-4"
                >
                  <div>
                    <div className="text-[17px] font-extrabold tracking-tight text-slate-900">
                      {item.title}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.body}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        [item.key]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <div className="rounded-[24px] bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[20px] font-black tracking-tight text-slate-900">
                    AI reply support
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    This uses the existing provider AI assistant to draft better initial responses.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoReplyEnabled}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      autoReplyEnabled: event.target.checked,
                    }))
                  }
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-bold text-slate-700">Reply tone</div>
                  <select
                    className="psp-select"
                    value={preferences.autoReplyTone}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        autoReplyTone: event.target.value as AutoReplyTone,
                      }))
                    }
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="concise">Concise</option>
                  </select>
                </div>
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/80 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Plan note
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    Current plan is <span className="font-bold text-slate-900">{preferences.selectedPlan.toUpperCase()}</span>. Visibility upgrades remain managed in the subscription workspace.
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-bold text-slate-700">Reply signature</div>
                <textarea
                  className="psp-textarea"
                  value={preferences.autoReplySignature}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      autoReplySignature: event.target.value,
                    }))
                  }
                  placeholder="Optional closing line added after AI generated replies."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={savingPreferences}
                onClick={savePreferences}
              >
                {savingPreferences ? 'Saving preferences...' : 'Save visibility settings'}
              </button>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                <Sparkles size={14} />
                Public profile and inbox behavior update from the same preference source.
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Password and account protection</h2>
            <div className="psp-surface__sub">
              Change the provider password without leaving the dashboard. Backend validation enforces strength requirements.
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <LockKeyhole size={14} />
                Current password
              </div>
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
              Password policy
            </div>
            <div className="mt-3 text-sm leading-8 text-slate-600">
              The backend requires at least 8 characters including uppercase, lowercase, a number,
              and a special character. This page only handles the flow; validation remains server-side.
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

export default ProviderSettings;
