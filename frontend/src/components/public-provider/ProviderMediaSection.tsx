import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Heart, MessageCircle, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { MediaComment, PublicProviderPayload } from './types';

interface ProviderMediaSectionProps {
  media: PublicProviderPayload['media'];
  commentsMap: Record<string, MediaComment[]>;
  commentDrafts: Record<string, string>;
  likedMap: Record<string, boolean>;
  actionMediaId: string | null;
  onRefreshComments: (mediaId: string) => void;
  onToggleLike: (mediaId: string) => void;
  onDraftChange: (mediaId: string, value: string) => void;
  onAddComment: (mediaId: string) => void;
}

const formatTimestamp = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const ProviderMediaSection: React.FC<ProviderMediaSectionProps> = ({
  media,
  commentsMap,
  commentDrafts,
  likedMap,
  actionMediaId,
  onRefreshComments,
  onToggleLike,
  onDraftChange,
  onAddComment,
}) => {
  const { locale, t } = useI18n();
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(media.map((item) => item.service?.name || t('Portfolio')).filter(Boolean))
      ),
    [media, t]
  );

  const filteredMedia = useMemo(() => {
    const items =
      activeCategory === 'all'
        ? media
        : media.filter((item) => (item.service?.name || t('Portfolio')) === activeCategory);

    return showAll ? items : items.slice(0, 6);
  }, [activeCategory, media, showAll, t]);

  const selectedItem = useMemo(
    () => media.find((item) => item.id === selectedMediaId) || null,
    [media, selectedMediaId]
  );

  useEffect(() => {
    if (selectedItem) {
      onRefreshComments(selectedItem.id);
    }
  }, [onRefreshComments, selectedItem]);

  if (!media.length) {
    return null;
  }

  const selectedComments = selectedItem ? commentsMap[selectedItem.id] || [] : [];
  const selectedDraft = selectedItem ? commentDrafts[selectedItem.id] || '' : '';
  const selectedBusy = selectedItem ? actionMediaId === selectedItem.id : false;

  return (
    <section id="provider-portfolio" className="border-t border-slate-200 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{t('Portfolio')}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {media.length} {t('completed projects')}
          </p>
        </div>

        {media.length > 6 && !showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
          >
            {t('View All')}
            <ChevronRight size={16} />
          </button>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t('All')}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${
              activeCategory === category
                ? 'bg-slate-900 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMedia.map((item) => {
          const isBusy = actionMediaId === item.id;
          const isLiked = Boolean(likedMap[item.id]);
          const previewComments = (commentsMap[item.id] || item.latestComments || []).slice(0, 2);

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-200"
            >
              <button
                type="button"
                onClick={() => setSelectedMediaId(item.id)}
                className="group block w-full text-left"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.mediaType === 'image' ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <video
                      src={item.mediaUrl}
                      poster={item.thumbnailUrl || undefined}
                      muted
                      playsInline
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                    <span className="w-fit rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
                      {item.service?.name || t('Portfolio')}
                    </span>
                    {item.createdAt ? (
                      <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                        {formatTimestamp(item.createdAt, locale)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">{item.title}</h3>
                  {item.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </button>

              <div className="border-t border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleLike(item.id)}
                    disabled={isBusy}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      isLiked
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-slate-900'
                    }`}
                  >
                    <Heart size={15} className={isLiked ? 'fill-current' : ''} />
                    {item.likesCount}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMediaId(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-slate-900"
                  >
                    <MessageCircle size={15} />
                    {item.commentsCount}
                  </button>
                </div>

                {previewComments.length ? (
                  <div className="mt-3 space-y-2">
                    {previewComments.map((comment) => (
                      <div key={comment.id} className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {comment.authorName}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                          {comment.body}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-400">
                    {t('No comments yet.')}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6"
          onClick={() => setSelectedMediaId(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMediaId(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label={t('Close')}
          >
            <X size={18} />
          </button>

          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 overflow-hidden rounded-xl bg-slate-900 shadow-2xl">
              {selectedItem.mediaType === 'image' ? (
                <img
                  src={selectedItem.mediaUrl}
                  alt={selectedItem.title}
                  className="w-full rounded-xl"
                />
              ) : (
                <video
                  src={selectedItem.mediaUrl}
                  poster={selectedItem.thumbnailUrl || undefined}
                  controls
                  className="w-full rounded-xl"
                />
              )}
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {selectedItem.service?.name || t('Portfolio')}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-950">{selectedItem.title}</h3>
                  {selectedItem.description ? (
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {selectedItem.description}
                    </p>
                  ) : null}
                </div>

                  <div className="text-xs text-slate-400">
                    {formatTimestamp(selectedItem.createdAt, locale)}
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
                  onClick={() => onToggleLike(selectedItem.id)}
                  disabled={selectedBusy}
                >
                  <Heart
                    size={15}
                    className={likedMap[selectedItem.id] ? 'fill-blue-600 text-blue-600' : ''}
                  />
                  {selectedItem.likesCount}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:text-slate-900"
                  onClick={() => onRefreshComments(selectedItem.id)}
                  disabled={selectedBusy}
                >
                  <MessageCircle size={15} />
                  {selectedItem.commentsCount}
                </button>
              </div>

              <div className="space-y-3">
                {selectedComments.length ? (
                  selectedComments.map((comment) => (
                    <div key={comment.id} className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-slate-900">
                          {comment.authorName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatTimestamp(comment.createdAt, locale)}
                        </div>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{comment.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    {t('No comments yet.')}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={selectedDraft}
                  onChange={(event) => onDraftChange(selectedItem.id, event.target.value)}
                  placeholder={t('Write a comment')}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => onAddComment(selectedItem.id)}
                  disabled={selectedBusy}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('Comment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ProviderMediaSection;
