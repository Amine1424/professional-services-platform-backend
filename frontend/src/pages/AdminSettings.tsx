import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Settings2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import '../styles/app-primitives.css';

interface SettingsPayload {
  platformName: string;
  seoTitle: string;
  seoDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  systemNotificationsEnabled: boolean;
}

const AdminSettings: React.FC = () => {
  const [form, setForm] = useState<SettingsPayload>({
    platformName: '',
    seoTitle: '',
    seoDescription: '',
    maintenanceMode: false,
    maintenanceMessage: '',
    systemNotificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      setForm((current) => response.data?.data || current);
      setError(null);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Failed to load platform settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', form);
      toast.success('Platform settings saved.');
      setError(null);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const healthSignals = useMemo(
    () => [
      {
        label: 'Maintenance mode',
        value: form.maintenanceMode ? 'Enabled' : 'Disabled',
        caption: form.maintenanceMode
          ? 'Public access is expected to show the maintenance message.'
          : 'The marketplace is currently open to users.',
      },
      {
        label: 'System notifications',
        value: form.systemNotificationsEnabled ? 'Enabled' : 'Disabled',
        caption: form.systemNotificationsEnabled
          ? 'Core system updates can still reach users.'
          : 'Platform-level notifications are paused.',
      },
      {
        label: 'SEO status',
        value: form.seoTitle?.trim() ? 'Configured' : 'Needs review',
        caption: form.seoDescription?.trim()
          ? 'Search metadata has both title and description.'
          : 'Description metadata is still incomplete.',
      },
    ],
    [form]
  );

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !form.platformName && !form.seoTitle) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Platform settings unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#4338ca_42%,#38bdf8)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <Settings2 size={14} />
              Platform posture
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Control how the marketplace presents itself and behaves globally
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              These settings affect platform identity, public metadata, maintenance posture, and whether
              system-level notifications remain active across the product.
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            {healthSignals.map((item) => (
              <div key={item.label} className="rounded-[22px] bg-white/10 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">{item.label}</div>
                <div className="mt-2 text-[22px] font-black">{item.value}</div>
                <div className="mt-2 text-sm leading-6 text-white/70">{item.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Identity and SEO</h2>
              <div className="psp-surface__sub">
                Keep brand naming and marketplace metadata aligned before launch or marketing pushes.
              </div>
            </div>
            <button type="button" className="psp-button psp-button--secondary" onClick={() => void load()}>
              <RefreshCcw size={16} />
              Reload
            </button>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Platform name</span>
              <input
                value={form.platformName}
                onChange={(event) => setForm((current) => ({ ...current, platformName: event.target.value }))}
                className="psp-input"
                placeholder="ProServices Algeria"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">SEO title</span>
              <input
                value={form.seoTitle}
                onChange={(event) => setForm((current) => ({ ...current, seoTitle: event.target.value }))}
                className="psp-input"
                placeholder="Professional services marketplace in Algeria"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">SEO description</span>
              <textarea
                value={form.seoDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, seoDescription: event.target.value }))
                }
                className="psp-textarea"
                placeholder="Describe the marketplace for search engines and previews."
              />
            </label>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Runtime controls</h2>
              <div className="psp-surface__sub">
                Toggle global maintenance state and platform notifications without touching code.
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maintenanceMode: event.target.checked }))
                }
              />
              Maintenance mode is active
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Maintenance message</span>
              <textarea
                value={form.maintenanceMessage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maintenanceMessage: event.target.value }))
                }
                className="psp-textarea"
                placeholder="Explain why the platform is temporarily unavailable."
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.systemNotificationsEnabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    systemNotificationsEnabled: event.target.checked,
                  }))
                }
              />
              System notifications are enabled
            </label>

            {form.maintenanceMode ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-800">
                <div className="inline-flex items-center gap-2 font-bold">
                  <ShieldAlert size={16} />
                  Maintenance mode warning
                </div>
                <div className="mt-2">
                  When enabled, verify that the public message is explicit and that admins know the expected
                  rollback plan.
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Commit platform settings</h2>
            <div className="psp-surface__sub">
              Save after confirming brand, metadata, maintenance messaging, and notification posture.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="psp-button psp-button--primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving settings...' : 'Save platform settings'}
          </button>
          <button type="button" className="psp-button psp-button--secondary" disabled={saving} onClick={() => void load()}>
            Reset from server
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
