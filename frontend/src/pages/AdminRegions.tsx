import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, MapPinned, PencilLine, RefreshCcw, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { slugifyValue } from '../lib/strings';
import '../styles/app-primitives.css';

interface RegionItem {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  displayOrder: number;
  isActive: boolean;
  wilayas: Array<{
    id: string;
    name: string;
    slug: string;
    isActive?: boolean;
  }>;
}

interface WilayaItem {
  id: string;
  regionId?: string | null;
  name: string;
  slug: string;
  code?: string | null;
  displayOrder: number;
  isActive: boolean;
  region?: {
    id: string;
    name: string;
  } | null;
}

const emptyRegionForm = {
  name: '',
  slug: '',
  code: '',
  displayOrder: '0',
  isActive: true,
};

const emptyWilayaForm = {
  regionId: '',
  name: '',
  slug: '',
  code: '',
  displayOrder: '0',
  isActive: true,
};

export const AdminRegions: React.FC = () => {
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [wilayas, setWilayas] = useState<WilayaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  const [editingWilayaId, setEditingWilayaId] = useState<string | null>(null);
  const [regionForm, setRegionForm] = useState(emptyRegionForm);
  const [wilayaForm, setWilayaForm] = useState(emptyWilayaForm);

  const load = async () => {
    try {
      setLoading(true);
      const [regionsRes, wilayasRes] = await Promise.all([
        api.get('/admin/regions/regions'),
        api.get('/admin/regions/wilayas'),
      ]);

      setRegions(regionsRes.data?.data || []);
      setWilayas(wilayasRes.data?.data || []);
      setError(null);
    } catch (requestError: any) {
      setRegions([]);
      setWilayas([]);
      setError(requestError.response?.data?.message || 'Failed to load region coverage data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const activeRegions = regions.filter((item) => item.isActive).length;
    const activeWilayas = wilayas.filter((item) => item.isActive).length;
    const linkedWilayas = wilayas.filter((item) => item.regionId).length;

    return [
      {
        label: 'Regions',
        value: String(regions.length),
        caption: 'Top-level coverage zones used across onboarding and search.',
      },
      {
        label: 'Wilayas',
        value: String(wilayas.length),
        caption: 'Operational local areas providers can attach themselves to.',
      },
      {
        label: 'Active coverage',
        value: `${activeRegions}/${activeWilayas}`,
        caption: 'Active regions compared with active wilayas currently exposed.',
      },
      {
        label: 'Linked wilayas',
        value: String(linkedWilayas),
        caption: 'Wilayas already assigned to a parent region.',
      },
    ];
  }, [regions, wilayas]);

  const resetRegionForm = () => {
    setEditingRegionId(null);
    setRegionForm(emptyRegionForm);
  };

  const resetWilayaForm = () => {
    setEditingWilayaId(null);
    setWilayaForm(emptyWilayaForm);
  };

  const submitRegion = async () => {
    if (!regionForm.name.trim()) {
      toast.error('Region name is required.');
      return;
    }

    try {
      setActionId(editingRegionId || 'new-region');
      const payload = {
        name: regionForm.name.trim(),
        slug: regionForm.slug.trim() || slugifyValue(regionForm.name),
        code: regionForm.code.trim() || undefined,
        displayOrder: Number(regionForm.displayOrder || 0),
        isActive: regionForm.isActive,
      };

      if (editingRegionId) {
        await api.put(`/admin/regions/regions/${editingRegionId}`, payload);
        toast.success('Region updated.');
      } else {
        await api.post('/admin/regions/regions', payload);
        toast.success('Region created.');
      }

      resetRegionForm();
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to save region.');
    } finally {
      setActionId(null);
    }
  };

  const submitWilaya = async () => {
    if (!wilayaForm.name.trim()) {
      toast.error('Wilaya name is required.');
      return;
    }

    try {
      setActionId(editingWilayaId || 'new-wilaya');
      const payload = {
        regionId: wilayaForm.regionId || undefined,
        name: wilayaForm.name.trim(),
        slug: wilayaForm.slug.trim() || slugifyValue(wilayaForm.name),
        code: wilayaForm.code.trim() || undefined,
        displayOrder: Number(wilayaForm.displayOrder || 0),
        isActive: wilayaForm.isActive,
      };

      if (editingWilayaId) {
        await api.put(`/admin/regions/wilayas/${editingWilayaId}`, payload);
        toast.success('Wilaya updated.');
      } else {
        await api.post('/admin/regions/wilayas', payload);
        toast.success('Wilaya created.');
      }

      resetWilayaForm();
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to save wilaya.');
    } finally {
      setActionId(null);
    }
  };

  const removeRegion = async (id: string) => {
    try {
      setActionId(id);
      await api.delete(`/admin/regions/regions/${id}`);
      toast.success('Region removed.');
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to remove region.');
    } finally {
      setActionId(null);
    }
  };

  const removeWilaya = async (id: string) => {
    try {
      setActionId(id);
      await api.delete(`/admin/regions/wilayas/${id}`);
      toast.success('Wilaya removed.');
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to remove wilaya.');
    } finally {
      setActionId(null);
    }
  };

  const toggleRegionState = async (item: RegionItem) => {
    try {
      setActionId(item.id);
      await api.put(`/admin/regions/regions/${item.id}`, {
        isActive: !item.isActive,
      });
      toast.success(`Region ${item.isActive ? 'disabled' : 'activated'}.`);
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update region state.');
    } finally {
      setActionId(null);
    }
  };

  const toggleWilayaState = async (item: WilayaItem) => {
    try {
      setActionId(item.id);
      await api.put(`/admin/regions/wilayas/${item.id}`, {
        isActive: !item.isActive,
      });
      toast.success(`Wilaya ${item.isActive ? 'disabled' : 'activated'}.`);
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to update wilaya state.');
    } finally {
      setActionId(null);
    }
  };

  const startRegionEdit = (item: RegionItem) => {
    setEditingRegionId(item.id);
    setRegionForm({
      name: item.name,
      slug: item.slug,
      code: item.code || '',
      displayOrder: String(item.displayOrder ?? 0),
      isActive: item.isActive,
    });
  };

  const startWilayaEdit = (item: WilayaItem) => {
    setEditingWilayaId(item.id);
    setWilayaForm({
      regionId: item.regionId || '',
      name: item.name,
      slug: item.slug,
      code: item.code || '',
      displayOrder: String(item.displayOrder ?? 0),
      isActive: item.isActive,
    });
  };

  if (loading && !regions.length && !wilayas.length) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[380px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !regions.length && !wilayas.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Coverage management unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#0f766e_45%,#38bdf8)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <MapPinned size={14} />
              Coverage control
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              Manage the geographic layer behind discovery and onboarding
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              Regions and wilayas shape how providers present themselves and how customers filter the
              marketplace. This layer needs to stay clean, active, and locally accurate.
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

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{editingRegionId ? 'Update region' : 'Create region'}</h2>
              <div className="psp-surface__sub">
                Use regions to group wilayas and keep public discovery coherent.
              </div>
            </div>
            {editingRegionId ? (
              <button type="button" className="psp-button psp-button--secondary" onClick={resetRegionForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Region name</span>
              <input
                value={regionForm.name}
                onChange={(event) =>
                  setRegionForm((current) => ({ ...current, name: event.target.value }))
                }
                className="psp-input"
                placeholder="Central Algeria"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Slug</span>
                <input
                  value={regionForm.slug}
                  onChange={(event) =>
                    setRegionForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  className="psp-input"
                  placeholder="central-algeria"
                />
              </label>
              <button
                type="button"
                className="psp-button psp-button--secondary self-end"
                onClick={() =>
                  setRegionForm((current) => ({ ...current, slug: slugifyValue(current.name) }))
                }
              >
                <Sparkles size={16} />
                Generate slug
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Code</span>
                <input
                  value={regionForm.code}
                  onChange={(event) =>
                    setRegionForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="psp-input"
                  placeholder="CTR"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Display order</span>
                <input
                  type="number"
                  value={regionForm.displayOrder}
                  onChange={(event) =>
                    setRegionForm((current) => ({ ...current, displayOrder: event.target.value }))
                  }
                  className="psp-input"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={regionForm.isActive}
                onChange={(event) =>
                  setRegionForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Region is active in discovery and onboarding
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={actionId === (editingRegionId || 'new-region')}
                onClick={() => void submitRegion()}
              >
                {editingRegionId ? 'Save region' : 'Create region'}
              </button>
              <button type="button" className="psp-button psp-button--secondary" onClick={resetRegionForm}>
                Reset form
              </button>
            </div>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{editingWilayaId ? 'Update wilaya' : 'Create wilaya'}</h2>
              <div className="psp-surface__sub">
                Wilayas are the local coverage layer customers see and providers select.
              </div>
            </div>
            {editingWilayaId ? (
              <button type="button" className="psp-button psp-button--secondary" onClick={resetWilayaForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Parent region</span>
              <select
                value={wilayaForm.regionId}
                onChange={(event) =>
                  setWilayaForm((current) => ({ ...current, regionId: event.target.value }))
                }
                className="psp-select"
              >
                <option value="">No parent region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Wilaya name</span>
              <input
                value={wilayaForm.name}
                onChange={(event) =>
                  setWilayaForm((current) => ({ ...current, name: event.target.value }))
                }
                className="psp-input"
                placeholder="Algiers"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Slug</span>
                <input
                  value={wilayaForm.slug}
                  onChange={(event) =>
                    setWilayaForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  className="psp-input"
                  placeholder="algiers"
                />
              </label>
              <button
                type="button"
                className="psp-button psp-button--secondary self-end"
                onClick={() =>
                  setWilayaForm((current) => ({ ...current, slug: slugifyValue(current.name) }))
                }
              >
                <Sparkles size={16} />
                Generate slug
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Code</span>
                <input
                  value={wilayaForm.code}
                  onChange={(event) =>
                    setWilayaForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="psp-input"
                  placeholder="16"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Display order</span>
                <input
                  type="number"
                  value={wilayaForm.displayOrder}
                  onChange={(event) =>
                    setWilayaForm((current) => ({ ...current, displayOrder: event.target.value }))
                  }
                  className="psp-input"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={wilayaForm.isActive}
                onChange={(event) =>
                  setWilayaForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Wilaya is active in customer filters and provider profiles
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={actionId === (editingWilayaId || 'new-wilaya')}
                onClick={() => void submitWilaya()}
              >
                {editingWilayaId ? 'Save wilaya' : 'Create wilaya'}
              </button>
              <button type="button" className="psp-button psp-button--secondary" onClick={resetWilayaForm}>
                Reset form
              </button>
            </div>
          </div>
        </article>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Region map</h2>
              <div className="psp-surface__sub">Top-level coverage groups and their linked wilayas.</div>
            </div>
            <button type="button" className="psp-button psp-button--secondary" onClick={() => void load()}>
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          {!regions.length ? (
            <div className="psp-empty-state">No regions exist yet.</div>
          ) : (
            <div className="psp-list">
              {regions.map((item) => (
                <article key={item.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div>
                      <h3 className="psp-list-card__title">{item.name}</h3>
                      <div className="psp-list-card__meta">
                        {item.slug} | {item.code || 'No code'} | Order {item.displayOrder}
                      </div>
                    </div>
                    <div className="psp-list-card__actions">
                      <span className={`psp-chip ${item.isActive ? 'psp-chip--active' : ''}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      <Globe2 size={12} className="mr-1 inline-flex" />
                      {item.wilayas.length} linked wilayas
                    </span>
                    {item.wilayas.slice(0, 4).map((wilaya) => (
                      <span key={wilaya.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {wilaya.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="psp-button psp-button--secondary" onClick={() => startRegionEdit(item)}>
                      <PencilLine size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="psp-button psp-button--secondary"
                      disabled={actionId === item.id}
                      onClick={() => void toggleRegionState(item)}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="psp-button psp-button--danger"
                      disabled={actionId === item.id}
                      onClick={() => void removeRegion(item.id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Wilaya list</h2>
              <div className="psp-surface__sub">
                Local coverage records that drive filters, profile setup, and ranking signals.
              </div>
            </div>
          </div>

          {!wilayas.length ? (
            <div className="psp-empty-state">No wilayas exist yet.</div>
          ) : (
            <div className="psp-list">
              {wilayas.map((item) => (
                <article key={item.id} className="psp-list-card">
                  <div className="psp-list-card__row">
                    <div>
                      <h3 className="psp-list-card__title">{item.name}</h3>
                      <div className="psp-list-card__meta">
                        {item.slug} | {item.region?.name || 'No parent region'} | Order {item.displayOrder}
                      </div>
                    </div>
                    <div className="psp-list-card__actions">
                      <span className={`psp-chip ${item.isActive ? 'psp-chip--active' : ''}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="psp-button psp-button--secondary" onClick={() => startWilayaEdit(item)}>
                      <PencilLine size={16} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="psp-button psp-button--secondary"
                      disabled={actionId === item.id}
                      onClick={() => void toggleWilayaState(item)}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="psp-button psp-button--danger"
                      disabled={actionId === item.id}
                      onClick={() => void removeWilaya(item.id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AdminRegions;
