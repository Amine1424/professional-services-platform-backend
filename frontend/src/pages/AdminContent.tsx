import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link2, MessageSquareText, RefreshCcw, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateTimeLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface CommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  media?: {
    id: string;
    title: string;
    providerId: string;
  } | null;
}

export const AdminContent: React.FC = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await api.get('/admin/content/comments', {
        params: {
          search: searchTerm.trim() || undefined,
        },
      });
      setItems(response.data?.data || []);
      setError(null);
    } catch (requestError: any) {
      setItems([]);
      setError(requestError.response?.data?.message || t('Failed to load content moderation feed.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load('');
  }, [load]);

  const removeComment = async (id: string) => {
    try {
      setDeletingId(id);
      await api.delete(`/admin/content/comments/${id}`);
      toast.success(t('Comment removed.'));
      await load(search);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t('Failed to remove comment.'));
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const linked = items.filter((item) => item.media?.providerId).length;
    const orphan = items.filter((item) => !item.media).length;

    return [
      {
        label: 'Visible queue',
        value: String(items.length),
        caption: 'Comments currently loaded into the moderation feed.',
      },
      {
        label: 'Linked to media',
        value: String(linked),
        caption: 'Comments attached to public provider proof and portfolio items.',
      },
      {
        label: 'Orphan comments',
        value: String(orphan),
        caption: 'Entries missing active media context and needing manual review.',
      },
    ];
  }, [items]);

  if (loading && !items.length) {
    return (
      <div className="psp-page-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Content moderation unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              {t('Admin content moderation')}
            </div>
            <h2 className="mt-3 text-[34px] font-black tracking-tight text-slate-900">
              {t('Keep public engagement clean without leaving the operations shell')}
            </h2>
            <div className="mt-4 max-w-[760px] text-sm leading-8 text-slate-600">
              {t(
                'Comments shape provider credibility. Search public commentary, inspect media context, and remove abusive or low-quality content directly from the moderation workspace.'
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <article key={item.label} className="psp-stat-card">
                <div className="psp-stat-card__label">{t(item.label)}</div>
                <div className="psp-stat-card__value">{item.value}</div>
                <div className="psp-stat-card__caption">{t(item.caption)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>{t('Moderation queue')}</h2>
            <div className="psp-surface__sub">
              {t('Search by author, body text, or media title before taking a removal action.')}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="psp-button psp-button--primary" onClick={() => void load(search)}>
              {t('Search queue')}
            </button>
            <button type="button" className="psp-button psp-button--secondary" onClick={() => void load(search)}>
              <RefreshCcw size={16} />
              {t('Refresh')}
            </button>
          </div>
        </div>

        <label className="psp-input-shell">
          <Search size={18} className="psp-input-shell__icon" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search comment body, author name, or media title')}
          />
        </label>
      </section>

      {error ? <div className="psp-error-state">{error}</div> : null}

      {!items.length ? (
        <div className="psp-empty-state">{t('No public comments match the current search.')}</div>
      ) : (
        <div className="psp-list">
          {items.map((item) => (
            <article key={item.id} className="psp-list-card">
              <div className="psp-list-card__row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="psp-list-card__title">{item.authorName || t('Anonymous author')}</h3>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      <MessageSquareText size={12} />
                      {t('Public comment')}
                    </span>
                    {!item.media ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                        <ShieldAlert size={12} />
                        {t('Missing media context')}
                      </span>
                    ) : null}
                  </div>
                  <div className="psp-list-card__meta">{formatDateTimeLabel(item.createdAt)}</div>
                  <div className="mt-4 rounded-[20px] bg-slate-50 p-4 text-[15px] leading-8 text-slate-700">
                    {item.body}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      {item.media?.title || t('No media context')}
                    </span>
                  </div>
                </div>

                <div className="psp-list-card__actions">
                  {item.media?.providerId ? (
                    <a
                      className="psp-button psp-button--secondary"
                      href={`/providers/${item.media.providerId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Link2 size={16} />
                      {t('Open provider page')}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="psp-button psp-button--danger"
                    disabled={deletingId === item.id}
                    onClick={() => void removeComment(item.id)}
                  >
                    <Trash2 size={16} />
                    {t('Delete comment')}
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

export default AdminContent;
