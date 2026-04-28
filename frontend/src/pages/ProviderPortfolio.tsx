import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock3,
  Globe,
  Heart,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { toast } from 'react-toastify';
import ProviderWorkspaceTopNav from '../components/provider/ProviderWorkspaceTopNav';
import api from '../config/api';
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

const FILTERS: Array<{ id: PortfolioFilter; label: string }> = [
  { id: 'all', label: 'All items' },
  { id: 'published', label: 'Published' },
  { id: 'story', label: 'Stories' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
];

const formatPlanLabel = (plan?: 'basic' | 'pro' | 'business') => {
  if (plan === 'business') return 'BUSINESS';
  if (plan === 'pro') return 'PRO';
  return 'BASIC';
};

const formatAudience = (value: StoryAudience) =>
  value === 'favorites_only' ? 'Favorites only' : 'Public';

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const ProviderPortfolio: React.FC = () => {
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
  const editorRef = useRef<HTMLElement | null>(null);

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
      toast.error('Failed to load portfolio data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const images = items.filter((item) => item.mediaType === 'image').length;
    const videos = items.filter((item) => item.mediaType === 'video').length;
    const stories = items.filter((item) => item.isStory).length;
    const totalLikes = items.reduce((sum, item) => sum + Number(item.likesCount || 0), 0);
    const totalComments = items.reduce((sum, item) => sum + Number(item.commentsCount || 0), 0);
    const published = items.filter((item) => item.isPublished).length;

    return {
      total: items.length,
      images,
      videos,
      stories,
      totalLikes,
      totalComments,
      published,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'published') return items.filter((item) => item.isPublished);
    if (filter === 'story') return items.filter((item) => item.isStory);
    return items.filter((item) => item.mediaType === filter);
  }, [filter, items]);

  const showcaseItem = useMemo(
    () =>
      items.find((item) => item.isStory && item.isPublished) ||
      items.find((item) => item.isPublished && item.isFeatured) ||
      items.find((item) => item.isPublished) ||
      items[0] ||
      null,
    [items]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSelectedMediaFile(null);
    setSelectedThumbnailFile(null);
  };

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    if (!editingId && !selectedMediaFile) {
      toast.error('Choose an image or video first.');
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
        toast.success('Item updated successfully.');
      } else {
        await api.post('/provider-media', payload);
        toast.success(form.isStory ? 'Story published successfully.' : 'Portfolio item published successfully.');
      }

      resetForm();
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError?.response?.data?.message || 'Action failed.');
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

    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;

    try {
      await api.delete(`/provider-media/${id}`);
      toast.success('Item deleted successfully.');
      if (editingId === id) resetForm();
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError?.response?.data?.message || 'Failed to delete the item.');
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
      toast.error('Failed to load comments.');
    } finally {
      setCommentsLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string, mediaId: string) => {
    try {
      await api.delete(`/provider-media/comments/${commentId}`);
      toast.success('Comment deleted successfully.');
      await loadComments(mediaId);
      await loadData();
    } catch (requestError: any) {
      toast.error(requestError?.response?.data?.message || 'Failed to delete the comment.');
    }
  };

  const planLabel = formatPlanLabel(preferenceData?.preference.selectedPlan);
  const canFeatureMedia = Boolean(preferenceData?.planFeatures.canFeatureServices);
  const canUsePromoBadge = Boolean(preferenceData?.planFeatures.canUseServicePromoBadge);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ProviderWorkspaceTopNav currentPage="portfolio" fluid />
        <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="grid gap-6">
            <div className="h-[200px] animate-pulse rounded-[28px] bg-white shadow-sm" />
            <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className="h-[760px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              <div className="grid gap-6">
                <div className="h-[160px] animate-pulse rounded-[28px] bg-white shadow-sm" />
                <div className="h-[680px] animate-pulse rounded-[28px] bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ProviderWorkspaceTopNav currentPage="portfolio" fluid />

      <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Proof of work
                </div>
                <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950 sm:text-[36px]">
                  Publish the visual proof customers trust before they request.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Portfolio media and stories are the strongest proof layer after services. Keep them
                  recent, relevant, and tied to real work customers can understand quickly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Current plan
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{planLabel}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {canFeatureMedia
                      ? 'Featured proof and promotional highlights are enabled.'
                      : 'Feature upgrades unlock stronger media visibility.'}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Visibility health
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    {stats.published} published
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {stats.stories > 0
                      ? `${stats.stories} live stories help the profile stay fresh.`
                      : 'No live stories yet. Recent work can strengthen profile momentum.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: 'Total items',
                value: stats.total,
                caption: 'Everything currently in the proof workspace.',
                icon: Camera,
                iconClass: 'bg-sky-50 text-sky-700',
              },
              {
                label: 'Published',
                value: stats.published,
                caption: 'Visible on the public profile right now.',
                icon: CheckCircle2,
                iconClass: 'bg-emerald-50 text-emerald-700',
              },
              {
                label: 'Stories',
                value: stats.stories,
                caption: 'Short-lived proof for timely activity.',
                icon: Sparkles,
                iconClass: 'bg-fuchsia-50 text-fuchsia-700',
              },
              {
                label: 'Images / Videos',
                value: `${stats.images}/${stats.videos}`,
                caption: 'Balanced proof formats help different buyers.',
                icon: Video,
                iconClass: 'bg-violet-50 text-violet-700',
              },
              {
                label: 'Engagement',
                value: `${stats.totalLikes}/${stats.totalComments}`,
                caption: 'Likes and comments combined.',
                icon: Heart,
                iconClass: 'bg-rose-50 text-rose-700',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.iconClass}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-slate-500">{item.label}</div>
                  <div className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
                    {item.value}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{item.caption}</div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside ref={editorRef} className="xl:sticky xl:top-24 xl:self-start">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Media editor
                    </div>
                    <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-950">
                      {editingId ? 'Refine this proof item' : 'Publish work or a story'}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Upload real execution proof, connect it to a service when relevant, and choose whether
                      it should live as durable portfolio or fast-moving story content.
                    </p>
                  </div>

                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Upload size={16} />
                      New
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600">Featured proof</span>
                    <span className={`font-semibold ${canFeatureMedia ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {canFeatureMedia ? 'Enabled' : 'Upgrade required'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600">Promo badges</span>
                    <span className={`font-semibold ${canUsePromoBadge ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {canUsePromoBadge ? 'Enabled' : 'Upgrade required'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Title</div>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="psp-input"
                      placeholder="Kitchen renovation before and after"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Media type</div>
                      <select
                        name="mediaType"
                        value={form.mediaType}
                        onChange={handleChange}
                        className="psp-select"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Related service</div>
                      <select
                        name="serviceId"
                        value={form.serviceId}
                        onChange={handleChange}
                        className="psp-select"
                      >
                        <option value="">No linked service</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="isStory"
                      checked={form.isStory}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Publish this as a story</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Stories expire automatically after 24 hours and support fast, recent proof of activity.
                      </span>
                    </span>
                  </label>

                  {form.isStory ? (
                    <div>
                      <div className="mb-2 text-sm font-semibold text-slate-700">Story audience</div>
                      <select
                        name="storyAudience"
                        value={form.storyAudience}
                        onChange={handleChange}
                        className="psp-select"
                      >
                        <option value="public">Public — everyone can see it</option>
                        <option value="favorites_only">Favorites only — only customers who favorited you</option>
                      </select>
                    </div>
                  ) : null}

                  <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Upload size={14} />
                      Main file
                    </div>
                    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      <span>{selectedMediaFile ? selectedMediaFile.name : 'Choose image or video from computer'}</span>
                      <Camera size={16} />
                      <input
                        type="file"
                        accept={form.mediaType === 'video' ? 'video/*' : 'image/*'}
                        className="hidden"
                        onChange={(event) => setSelectedMediaFile(event.target.files?.[0] || null)}
                      />
                    </label>
                    {!selectedMediaFile && editingId && form.mediaUrl ? (
                      <div className="mt-3 text-xs font-medium text-slate-500">
                        Existing file will remain unless you upload a new one.
                      </div>
                    ) : null}
                  </div>

                  {form.mediaType === 'video' ? (
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Upload size={14} />
                        Video thumbnail
                      </div>
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                        <span>{selectedThumbnailFile ? selectedThumbnailFile.name : 'Optional thumbnail image'}</span>
                        <ImageIcon size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => setSelectedThumbnailFile(event.target.files?.[0] || null)}
                        />
                      </label>
                      {!selectedThumbnailFile && editingId && form.thumbnailUrl ? (
                        <div className="mt-3 text-xs font-medium text-slate-500">
                          Existing thumbnail will remain unless you upload a replacement.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-700">Description</div>
                      <span className="text-xs font-semibold text-slate-400">
                        {form.description.length}/600
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      maxLength={600}
                      className="psp-textarea min-h-[130px]"
                      placeholder="Explain what the work shows, what changed, and why it is relevant to customer trust."
                    />
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Sort order</div>
                    <input
                      type="number"
                      name="sortOrder"
                      value={form.sortOrder}
                      onChange={handleChange}
                      className="psp-input"
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={form.isPublished}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Publish this item</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Hidden items stay in the workspace but do not appear on the public provider page.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      disabled={!canFeatureMedia}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Mark as featured work</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Featured work gets stronger placement when your plan supports it.
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <input
                      type="checkbox"
                      name="showPromoBadge"
                      checked={form.showPromoBadge}
                      onChange={handleChange}
                      disabled={!canUsePromoBadge}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">Show a promo badge</span>
                      <span className="mt-1 block leading-6 text-slate-600">
                        Highlight recency, popularity, or a strong proof angle directly on the card.
                      </span>
                    </span>
                  </label>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-700">Promo badge text</div>
                    <input
                      name="promoBadgeText"
                      value={form.promoBadgeText}
                      onChange={handleChange}
                      className="psp-input"
                      placeholder="New / Popular / Fast delivery"
                      disabled={!canUsePromoBadge || !form.showPromoBadge}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-[14px] bg-[#6e7bf6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5e6dec] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving
                        ? 'Saving...'
                        : editingId
                          ? 'Save changes'
                          : form.isStory
                            ? 'Publish story'
                            : 'Publish item'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </aside>

            <div className="grid gap-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <Sparkles size={14} />
                      Proof preview
                    </div>

                    {showcaseItem ? (
                      <>
                        <div className="mt-4 relative overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                          {showcaseItem.mediaType === 'image' ? (
                            <img
                              src={showcaseItem.mediaUrl}
                              alt={showcaseItem.title}
                              className="h-[260px] w-full object-cover"
                            />
                          ) : (
                            <video
                              src={showcaseItem.mediaUrl}
                              poster={showcaseItem.thumbnailUrl || undefined}
                              controls
                              className="h-[260px] w-full object-cover"
                            />
                          )}

                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            {showcaseItem.isStory ? (
                              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                                Story
                              </span>
                            ) : null}
                            {showcaseItem.isFeatured ? (
                              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                Featured
                              </span>
                            ) : null}
                            {showcaseItem.showPromoBadge && showcaseItem.promoBadgeText ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                {showcaseItem.promoBadgeText}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 text-[28px] font-semibold tracking-tight text-slate-950">
                          {showcaseItem.title}
                        </div>
                        {showcaseItem.description ? (
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                            {showcaseItem.description}
                          </p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {showcaseItem.service?.name || 'Standalone proof'}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                            {showcaseItem.isPublished ? 'Published' : 'Hidden'}
                          </span>
                          {showcaseItem.isStory ? (
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {formatAudience(showcaseItem.storyAudience)}
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 text-sm leading-7 text-slate-600">
                        Publish the first image, video, or story to start building visible proof of work on the provider profile.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <Clock3 size={14} />
                      Publishing guidance
                    </div>
                    <div className="mt-4 grid gap-3">
                      {[
                        {
                          title: 'Stories for recency',
                          body: stats.stories
                            ? `${stats.stories} stories are currently adding freshness to the public profile.`
                            : 'Stories help signal that the business is active right now, not only historically credible.',
                        },
                        {
                          title: 'Portfolio for durable proof',
                          body:
                            'Images and videos should show outcomes customers immediately understand, not decorative filler.',
                        },
                        {
                          title: 'Comments as trust signals',
                          body:
                            'Moderating comments quickly keeps visible proof credible and protects public trust.',
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                        >
                          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                          <div className="mt-2 text-sm leading-6 text-slate-600">{item.body}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Media archive
                    </div>
                    <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-950">
                      Manage every published proof asset from one place.
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                      Keep the archive sharp: best work visible, weak work removed, and recent stories used to support ongoing activity.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {FILTERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFilter(item.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          filter === item.id
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {!filteredItems.length ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm leading-7 text-slate-600">
                    No items match this filter.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 xl:grid-cols-2">
                    {filteredItems.map((item) => (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 transition hover:border-slate-300"
                      >
                        <div className="relative h-[240px] bg-slate-100">
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
                              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                                Story
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                item.isPublished
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-slate-900 text-white'
                              }`}
                            >
                              {item.isPublished ? 'Published' : 'Hidden'}
                            </span>
                            {item.showPromoBadge && item.promoBadgeText ? (
                              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                {item.promoBadgeText}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid gap-4 p-5">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[22px] font-semibold tracking-tight text-slate-950">
                                {item.title}
                              </h3>
                              {item.isFeatured ? (
                                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                                  Featured
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                {item.service?.name || 'Standalone'}
                              </span>
                              {item.isStory ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
                                  {item.storyAudience === 'favorites_only' ? <Lock size={12} /> : <Globe size={12} />}
                                  {formatAudience(item.storyAudience)}
                                </span>
                              ) : null}
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                {item.mediaType === 'image' ? 'Image' : 'Video'}
                              </span>
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
                                Expires: {formatDateTime(item.storyExpiresAt)}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil size={16} />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              onClick={() =>
                                openCommentsMediaId === item.id
                                  ? setOpenCommentsMediaId(null)
                                  : loadComments(item.id)
                              }
                            >
                              {commentsLoadingId === item.id ? (
                                'Loading comments...'
                              ) : openCommentsMediaId === item.id ? (
                                'Hide comments'
                              ) : (
                                <>
                                  <MessageCircle size={16} />
                                  Open comments
                                </>
                              )}
                            </button>
                          </div>

                          {openCommentsMediaId === item.id ? (
                            <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-white p-4">
                              {(commentsMap[item.id] || []).length === 0 ? (
                                <div className="rounded-[16px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                  No comments yet.
                                </div>
                              ) : (
                                (commentsMap[item.id] || []).map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="font-semibold text-slate-800">{comment.authorName}</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">
                                          {formatDateTime(comment.createdAt)}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-[12px] border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                                        onClick={() => handleDeleteComment(comment.id, item.id)}
                                      >
                                        <Trash2 size={14} />
                                        Delete comment
                                      </button>
                                    </div>
                                    <div className="mt-3 text-sm leading-7 text-slate-600">
                                      {comment.body}
                                    </div>
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
      </div>
    </div>
  );
};

export default ProviderPortfolio;
