import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Globe,
  Heart,
  Lock,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import '../styles/app-primitives.css';

type MediaType = 'image' | 'video';
type StoryAudience = 'public' | 'favorites_only';
type PortfolioFilter = 'all' | 'image' | 'video' | 'published' | 'story';

interface ServiceItem {
  id: string;
  name: string;
}

interface PortfolioItem {
  id: string;
  serviceId?: string | null;
  service?: { id: string; name: string } | null;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  sortOrder: number;
  likesCount: number;
  commentsCount: number;
  isStory: boolean;
  storyAudience: StoryAudience;
  storyExpiresAt?: string | null;
}

interface CommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface PreferencePayload {
  preference: {
    selectedPlan: 'basic' | 'pro' | 'business';
  };
  planFeatures: {
    canUseProfileBadge: boolean;
    canUseServicePromoBadge: boolean;
    canFeatureOnHomepage: boolean;
    canFeatureServices: boolean;
  };
}

interface PortfolioFormState {
  serviceId: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  isPublished: boolean;
  isFeatured: boolean;
  showPromoBadge: boolean;
  promoBadgeText: string;
  sortOrder: number;
  isStory: boolean;
  storyAudience: StoryAudience;
}

const emptyForm: PortfolioFormState = {
  serviceId: '',
  mediaType: 'image',
  mediaUrl: '',
  thumbnailUrl: '',
  title: '',
  description: '',
  isPublished: true,
  isFeatured: false,
  showPromoBadge: false,
  promoBadgeText: '',
  sortOrder: 0,
  isStory: false,
  storyAudience: 'public',
};

const ProviderPortfolio: React.FC = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [preferenceData, setPreferenceData] = useState<PreferencePayload | null>(null);
  const [filter, setFilter] = useState<PortfolioFilter>('all');
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({});
  const [openCommentsMediaId, setOpenCommentsMediaId] = useState<string | null>(null);
  const [commentsLoadingId, setCommentsLoadingId] = useState<string | null>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
  const [form, setForm] = useState<PortfolioFormState>(emptyForm);

  const loadData = useCallback(async () => {
    try {
      const [mediaRes, servicesRes] = await Promise.all([
        api.get('/provider-media/me'),
        api.get('/providers/me/services'),
      ]);

      setItems((mediaRes.data?.data?.items || []) as PortfolioItem[]);
      setPreferenceData({
        preference: mediaRes.data?.data?.preference,
        planFeatures: mediaRes.data?.data?.planFeatures,
      });
      setServices(
        (servicesRes.data?.data || []).map((service: any) => ({
          id: service.id,
          name: service.name,
        }))
      );
    } catch {
      toast.error(t('Failed to load portfolio data.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const images = items.filter((item) => item.mediaType === 'image').length;
    const videos = items.filter((item) => item.mediaType === 'video').length;
    const stories = items.filter((item) => item.isStory).length;
    const totalLikes = items.reduce((sum, item) => sum + Number(item.likesCount || 0), 0);

    return {
      total: items.length,
      images,
      videos,
      stories,
      totalLikes,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'published') return items.filter((item) => item.isPublished);
    if (filter === 'story') return items.filter((item) => item.isStory);
    return items.filter((item) => item.mediaType === filter);
  }, [filter, items]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target as HTMLInputElement;
    const { name, value, type } = target;

    if (name === 'mediaType') {
      setSelectedMediaFile(null);
      setSelectedThumbnailFile(null);
    }

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? target.checked
          : name === 'sortOrder'
            ? Number(value)
            : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSelectedMediaFile(null);
    setSelectedThumbnailFile(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error(t('Title is required.'));
      return;
    }

    if (!editingId && !selectedMediaFile) {
      toast.error(t('Choose an image or video first.'));
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append('serviceId', form.serviceId);
      payload.append('mediaType', form.mediaType);
      payload.append('title', form.title.trim());
      payload.append('description', form.description.trim());
      payload.append('isPublished', String(form.isPublished));
      payload.append('isFeatured', String(form.isFeatured));
      payload.append('showPromoBadge', String(form.showPromoBadge));
      payload.append('promoBadgeText', form.promoBadgeText.trim());
      payload.append('sortOrder', String(Number(form.sortOrder) || 0));
      payload.append('isStory', String(form.isStory));
      payload.append('storyAudience', form.storyAudience);

      if (selectedMediaFile) {
        payload.append('mediaFile', selectedMediaFile);
      }

      if (form.mediaType === 'video' && selectedThumbnailFile) {
        payload.append('thumbnailFile', selectedThumbnailFile);
      }

      if (editingId) {
        await api.put(`/provider-media/${editingId}`, payload);
        toast.success(t('Item updated successfully.'));
      } else {
        await api.post('/provider-media', payload);
        toast.success(
          form.isStory
            ? t('Story published successfully.')
            : t('Portfolio item published successfully.')
        );
      }

      resetForm();
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError?.response?.data?.message || t('Action failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setSelectedMediaFile(null);
    setSelectedThumbnailFile(null);
    setForm({
      serviceId: item.serviceId || '',
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      title: item.title || '',
      description: item.description || '',
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
      showPromoBadge: item.showPromoBadge,
      promoBadgeText: item.promoBadgeText || '',
      sortOrder: item.sortOrder || 0,
      isStory: item.isStory,
      storyAudience: item.storyAudience || 'public',
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('Delete this item?'))) return;

    try {
      await api.delete(`/provider-media/${id}`);
      toast.success(t('Item deleted successfully.'));
      if (editingId === id) resetForm();
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError?.response?.data?.message || t('Failed to delete the item.'));
    }
  };

  const loadComments = async (mediaId: string) => {
    try {
      setCommentsLoadingId(mediaId);
      const response = await api.get(`/provider-media/${mediaId}/comments`);
      setCommentsMap((current) => ({
        ...current,
        [mediaId]: (response.data?.data || []) as CommentItem[],
      }));
      setOpenCommentsMediaId(mediaId);
    } catch {
      toast.error(t('Failed to load comments.'));
    } finally {
      setCommentsLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string, mediaId: string) => {
    try {
      await api.delete(`/provider-media/comments/${commentId}`);
      toast.success(t('Comment deleted successfully.'));
      await loadComments(mediaId);
      await loadData();
    } catch (requestError: any) {
      toast.error(
        requestError?.response?.data?.message || t('Failed to delete the comment.')
      );
    }
  };

  if (loading) {
    return (
      <div className="psp-page-stack">
        <div className="h-[240px] animate-pulse rounded-[30px] bg-white/80" />
        <div className="h-[360px] animate-pulse rounded-[28px] bg-white/80" />
      </div>
    );
  }

  return (
    <div className="psp-page-stack">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>{editingId ? t('Edit media / story') : t('Publish portfolio item or story')}</h2>
              <div className="psp-surface__sub">
                {t('Stories now support two audiences: public and favorite-followers only.')}
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {t('Current plan')}:{' '}
            <strong className="text-slate-900">
              {preferenceData?.preference.selectedPlan || t('basic')}
            </strong>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">{t('Title')}</div>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="psp-input"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">{t('Media type')}</div>
                <select
                  name="mediaType"
                  value={form.mediaType}
                  onChange={handleChange}
                  className="psp-select"
                >
                  <option value="image">{t('image')}</option>
                  <option value="video">{t('video')}</option>
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">{t('Related service')}</div>
                <select
                  name="serviceId"
                  value={form.serviceId}
                  onChange={handleChange}
                  className="psp-select"
                >
                  <option value="">{t('No linked service')}</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="isStory"
                checked={form.isStory}
                onChange={handleChange}
              />
              {t('Publish this as a story (expires automatically after 24 hours)')}
            </label>

            {form.isStory ? (
              <div>
                <div className="mb-2 text-sm font-bold text-slate-700">{t('Story audience')}</div>
                <select
                  name="storyAudience"
                  value={form.storyAudience}
                  onChange={handleChange}
                  className="psp-select"
                >
                          <option value="public">
                            {t('Public — everyone can see it')}
                          </option>
                          <option value="favorites_only">
                            {t('Favorites only — only customers who favorited you')}
                          </option>
                </select>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <Upload size={14} />
                {t('Main file')}
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                <span>
                  {selectedMediaFile
                    ? selectedMediaFile.name
                    : t('Choose image or video from computer')}
                </span>
                <Camera size={16} />
                <input
                  type="file"
                  accept={form.mediaType === 'video' ? 'video/*' : 'image/*'}
                  className="hidden"
                  onChange={(event) => setSelectedMediaFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            {form.mediaType === 'video' ? (
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Upload size={14} />
                  {t('Video thumbnail')}
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                  <span>
                    {selectedThumbnailFile
                      ? selectedThumbnailFile.name
                      : t('Optional thumbnail image')}
                  </span>
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setSelectedThumbnailFile(event.target.files?.[0] || null)
                    }
                  />
                </label>
              </div>
            ) : null}

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">{t('Description')}</div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="psp-textarea"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">{t('Sort order')}</div>
              <input
                type="number"
                name="sortOrder"
                value={form.sortOrder}
                onChange={handleChange}
                className="psp-input"
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
              />
              {t('Publish this item')}
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
              />
              {t('Mark as featured work')}
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="showPromoBadge"
                checked={form.showPromoBadge}
                onChange={handleChange}
              />
              {t('Show promo badge')}
            </label>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">{t('Promo badge text')}</div>
              <input
                name="promoBadgeText"
                value={form.promoBadgeText}
                onChange={handleChange}
                className="psp-input"
                placeholder={t('New / Popular / Fast delivery')}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="psp-button psp-button--primary">
                {saving
                  ? t('Saving...')
                  : editingId
                    ? t('Save changes')
                    : form.isStory
                      ? t('Publish story')
                      : t('Publish item')}
              </button>
              <button
                type="button"
                className="psp-button psp-button--secondary"
                onClick={resetForm}
              >
                {t('Reset')}
              </button>
            </div>
          </form>
        </article>

        <div className="grid gap-6">
          <section className="psp-stat-grid">
            {[
              { label: t('Total items'), value: stats.total, icon: Camera },
              { label: t('Images'), value: stats.images, icon: Camera },
              { label: t('Videos'), value: stats.videos, icon: PlayCircle },
              { label: t('Stories'), value: stats.stories, icon: Sparkles },
              { label: t('Likes'), value: stats.totalLikes, icon: Heart },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="psp-stat-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Icon size={18} />
                  </div>
                  <div className="psp-stat-card__label mt-4">{item.label}</div>
                  <div className="psp-stat-card__value">{item.value}</div>
                </article>
              );
            })}
          </section>

          <section className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>{t('Media archive')}</h2>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-3 rounded-[24px] bg-slate-50 p-5">
              {[
                ['all', t('All')],
                ['published', t('Published')],
                ['story', t('Stories')],
                ['image', t('Images')],
                ['video', t('Videos')],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as PortfolioFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!filteredItems.length ? (
              <div className="psp-empty-state">{t('No items match this filter.')}</div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-[0_20px_40px_rgba(15,23,42,0.06)]"
                  >
                    <div className="relative h-[220px] bg-slate-100">
                      {item.mediaType === 'image' ? (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.mediaUrl}
                          poster={item.thumbnailUrl || undefined}
                          controls
                          className="h-full w-full object-cover"
                        />
                      )}

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {item.isStory ? (
                          <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white">
                            {t('Story')}
                          </span>
                        ) : null}

                        {item.isStory ? (
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                              {item.storyAudience === 'favorites_only'
                                ? t('Favorites only')
                                : t('Public')}
                          </span>
                        ) : null}

                        {item.showPromoBadge && item.promoBadgeText ? (
                          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                            {item.promoBadgeText}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-4 p-5">
                      <div>
                        <div className="text-[22px] font-black tracking-tight text-slate-900">
                          {item.title}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {item.service?.name || t('Standalone')}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {item.isPublished ? t('Published') : t('Hidden')}
                          </span>
                          {item.isStory ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                              {item.storyAudience === 'favorites_only' ? (
                                <Lock size={12} />
                              ) : (
                                <Globe size={12} />
                              )}
                              {item.storyAudience === 'favorites_only'
                                ? t('Favorites')
                                : t('Public')}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.description ? (
                        <div className="text-sm leading-7 text-slate-600">{item.description}</div>
                      ) : null}

                      <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Heart size={14} />
                          {item.likesCount}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MessageCircle size={14} />
                          {item.commentsCount}
                        </span>
                        {item.isStory && item.storyExpiresAt ? (
                          <span className="inline-flex items-center gap-2">
                            <Sparkles size={14} />
                            {t('Expires')}: {new Date(item.storyExpiresAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>

                      <div className="psp-list-card__actions">
                        <button
                          type="button"
                          className="psp-button psp-button--secondary"
                          onClick={() => handleEdit(item)}
                        >
                          {t('Edit')}
                        </button>
                        <button
                          type="button"
                          className="psp-button psp-button--danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          {t('Delete')}
                        </button>
                        <button
                          type="button"
                          className="psp-button psp-button--secondary"
                          onClick={() =>
                            openCommentsMediaId === item.id
                              ? setOpenCommentsMediaId(null)
                              : loadComments(item.id)
                          }
                        >
                          {commentsLoadingId === item.id
                            ? t('Loading comments...')
                            : openCommentsMediaId === item.id
                              ? t('Hide comments')
                              : t('Open comments')}
                        </button>
                      </div>

                      {openCommentsMediaId === item.id ? (
                        <div className="grid gap-3">
                          {(commentsMap[item.id] || []).length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                              {t('No comments yet.')}
                            </div>
                          ) : (
                            (commentsMap[item.id] || []).map((comment) => (
                              <div key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                                <div className="font-bold text-slate-800">{comment.authorName}</div>
                                <div className="mt-2 text-sm leading-7 text-slate-600">
                                  {comment.body}
                                </div>
                                <button
                                  type="button"
                                  className="psp-button psp-button--danger mt-3"
                                  onClick={() => handleDeleteComment(comment.id, item.id)}
                                >
                                  {t('Delete comment')}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
};

export default ProviderPortfolio;
