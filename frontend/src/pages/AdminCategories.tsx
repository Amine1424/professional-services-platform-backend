import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderTree,
  PencilLine,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import { slugifyValue } from '../lib/strings';
import '../styles/app-primitives.css';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  depth?: number;
}

interface CategoryNode extends CategoryItem {
  children: CategoryNode[];
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
};

const buildCategoryTree = (items: CategoryItem[]): CategoryNode[] => {
  const nodeMap = new Map<string, CategoryNode>();

  items.forEach((item) => {
    nodeMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  const roots: CategoryNode[] = [];

  items.forEach((item) => {
    const node = nodeMap.get(item.id);
    if (!node) return;

    if (item.parentId) {
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
        return;
      }
    }

    roots.push(node);
  });

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((left, right) => left.name.localeCompare(right.name));
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
};

const collectBranchIds = (items: CategoryItem[], categoryId: string) => {
  const branchIds = new Set<string>([categoryId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const item of items) {
      if (item.parentId && branchIds.has(item.parentId) && !branchIds.has(item.id)) {
        branchIds.add(item.id);
        changed = true;
      }
    }
  }

  return branchIds;
};

const countDescendants = (node: CategoryNode): number =>
  node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);

export const AdminCategories: React.FC = () => {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories');
      setItems(response.data?.data || []);
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const tree = useMemo(() => buildCategoryTree(items), [items]);
  const parentLookup = useMemo(
    () =>
      items.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.name;
        return acc;
      }, {}),
    [items]
  );

  const blockedParentIds = useMemo(
    () => (editingId ? collectBranchIds(items, editingId) : new Set<string>()),
    [editingId, items]
  );

  const availableParents = useMemo(
    () => items.filter((item) => !blockedParentIds.has(item.id)),
    [blockedParentIds, items]
  );

  const stats = useMemo(() => {
    const roots = items.filter((item) => !item.parentId).length;
    const nested = items.filter((item) => item.parentId).length;
    const described = items.filter((item) => item.description?.trim()).length;

    return [
      {
        label: 'Category set',
        value: String(items.length),
        caption: 'Total categories shaping the public marketplace taxonomy.',
      },
      {
        label: 'Primary groups',
        value: String(roots),
        caption: 'Top-level categories used as the discovery backbone.',
      },
      {
        label: 'Nested branches',
        value: String(nested),
        caption: 'Child categories adding precision inside each service family.',
      },
      {
        label: 'Documented',
        value: String(described),
        caption: 'Categories that already include descriptive guidance.',
      },
    ];
  }, [items]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startRootCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startChildCreate = (parentId: string) => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      parentId,
    });
  };

  const startEdit = (item: CategoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      parentId: item.parentId || '',
    });
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        slug: (form.slug.trim() || slugifyValue(form.name)).trim(),
        description: form.description.trim() || undefined,
        parentId: form.parentId || undefined,
      };

      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, payload);
        toast.success('Category updated.');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Category created.');
      }

      resetForm();
      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    try {
      setDeletingId(id);
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category removed.');

      if (editingId === id) {
        resetForm();
      }

      await load();
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to remove category.');
    } finally {
      setDeletingId(null);
    }
  };

  const formTitle = editingId
    ? t('Edit category')
    : form.parentId
      ? t('Create subcategory')
      : t('Create main category');
  const formDescription = editingId
    ? t('Manage roots and branches from one workspace')
    : t(
        'Use the main-category action for high-level discovery sections, then add child categories directly inside each card.'
      );

  const renderBranch = (node: CategoryNode, level = 0): React.ReactNode => {
    const descendants = countDescendants(node);
    const isRoot = level === 0;
    const parentLabel = node.parentId ? parentLookup[node.parentId] : '';

    return (
      <article
        key={node.id}
        className={`rounded-[24px] border border-slate-200 ${
          isRoot ? 'bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.06)]' : 'bg-slate-50 p-4'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {isRoot
                ? t('Main category')
                : `${t('Subcategory under')} ${parentLabel}`.trim()}
            </div>
            <h3 className="mt-2 text-[24px] font-black tracking-tight text-slate-900">
              {node.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
              <span>{node.slug}</span>
              <span>&bull;</span>
              <span>
                {descendants}{' '}
                {new Intl.NumberFormat(locale).format(descendants) === '1'
                  ? t('thread')
                  : t('threads')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="psp-button psp-button--secondary"
              onClick={() => startChildCreate(node.id)}
            >
              <Plus size={16} />
              {t(isRoot ? 'Add subcategory' : 'Add nested category')}
            </button>
            <button
              type="button"
              className="psp-button psp-button--secondary"
              onClick={() => startEdit(node)}
            >
              <PencilLine size={16} />
              {t('Edit')}
            </button>
            <button
              type="button"
              className="psp-button psp-button--danger"
              disabled={deletingId === node.id}
              onClick={() => void removeCategory(node.id)}
            >
              <Trash2 size={16} />
              {t('Delete')}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
          {node.description?.trim() || t('No description has been added yet.')}
        </div>

        {node.children.length ? (
          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
            {node.children.map((child) => renderBranch(child, level + 1))}
          </div>
        ) : null}
      </article>
    );
  };

  if (loading && !items.length) {
    return (
      <div className="psp-page-stack">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[360px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">Category management unavailable.</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,#0f172a,#1d4ed8_46%,#60a5fa)] p-6 text-white shadow-[0_26px_55px_rgba(15,23,42,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-bold tracking-[0.14em] text-white/90">
              <FolderTree size={14} />
              {t('Discovery taxonomy')}
            </div>
            <h2 className="mt-5 text-[34px] font-black tracking-tight md:text-[42px]">
              {t('Shape how customers browse the marketplace')}
            </h2>
            <p className="mt-4 max-w-[620px] text-[15px] leading-8 text-white/82">
              {t(
                'Categories are not static labels. They control the search structure, provider onboarding, and how clean the marketplace feels when users browse services.'
              )}
            </p>
          </div>

          <div className="grid gap-4 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[22px] bg-white/10 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/62">
                    {t(item.label)}
                  </div>
                  <div className="mt-2 text-[24px] font-black">
                    {new Intl.NumberFormat(locale).format(Number(item.value))}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-white/72">{t(item.caption)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{formTitle}</h2>
              <div className="psp-surface__sub">{formDescription}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="psp-button psp-button--secondary"
                onClick={startRootCreate}
              >
                <Plus size={16} />
                {t('Create root')}
              </button>
              {(editingId || form.parentId) && (
                <button
                  type="button"
                  className="psp-button psp-button--secondary"
                  onClick={resetForm}
                >
                  {t('Cancel')}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">{t('Category name')}</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="psp-input"
                placeholder="Health Services"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">{t('Slug')}</span>
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  className="psp-input"
                  placeholder="health-services"
                />
              </label>

              <button
                type="button"
                className="psp-button psp-button--secondary self-end"
                onClick={() =>
                  setForm((current) => ({ ...current, slug: slugifyValue(current.name) }))
                }
              >
                <Sparkles size={16} />
                {t('Generate slug')}
              </button>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Parent category</span>
              <select
                value={form.parentId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parentId: event.target.value }))
                }
                className="psp-select"
              >
                <option value="">{t('Main category')}</option>
                {availableParents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {`${'· '.repeat(item.depth || 0)}${item.name}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">{t('Description')}</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="psp-textarea"
                placeholder="Clarify which providers belong in this category."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="psp-button psp-button--primary"
                disabled={saving}
                onClick={() => void submit()}
              >
                {editingId ? t('Save changes') : t(form.parentId ? 'Create subcategory' : 'Create root')}
              </button>
              <button
                type="button"
                className="psp-button psp-button--secondary"
                disabled={saving}
                onClick={resetForm}
              >
                {t('Reset form')}
              </button>
            </div>
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Current category tree</h2>
              <div className="psp-surface__sub">
                Manage main categories first, then maintain the subcategories inside each branch.
              </div>
            </div>
            <button
              type="button"
              className="psp-button psp-button--secondary"
              onClick={() => void load()}
            >
              <RefreshCcw size={16} />
              {t('Refresh')}
            </button>
          </div>

          {error ? <div className="psp-error-state">{error}</div> : null}

          {!tree.length ? (
            <div className="psp-empty-state">
              {t('No categories exist yet. Create the first main category.')}
            </div>
          ) : (
            <div className="grid gap-4">{tree.map((node) => renderBranch(node))}</div>
          )}
        </article>
      </section>
    </div>
  );
};

export default AdminCategories;
