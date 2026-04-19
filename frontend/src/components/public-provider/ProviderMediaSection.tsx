import React, { memo, useMemo } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDateTimeLabel } from '../../lib/strings';
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

interface ProviderMediaCardProps {
  item: PublicProviderPayload['media'][number];
  comments: MediaComment[];
  commentDraft: string;
  liked: boolean;
  busy: boolean;
  onRefreshComments: (mediaId: string) => void;
  onToggleLike: (mediaId: string) => void;
  onDraftChange: (mediaId: string, value: string) => void;
  onAddComment: (mediaId: string) => void;
}

const ProviderMediaCard = memo<ProviderMediaCardProps>(
  ({
    item,
    comments,
    commentDraft,
    liked,
    busy,
    onRefreshComments,
    onToggleLike,
    onDraftChange,
    onAddComment,
  }) => {
    const { t } = useI18n();

    return (
      <article className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
      <div className="relative h-[240px] bg-slate-100">
        {item.mediaType === 'image' ? (
          <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <video
            src={item.mediaUrl}
            poster={item.thumbnailUrl || undefined}
            controls
            className="h-full w-full object-cover"
          />
        )}
        {item.showPromoBadge && item.promoBadgeText ? (
          <span className="absolute left-4 top-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
            {item.promoBadgeText}
          </span>
        ) : null}
        {item.isFeatured ? (
          <span className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
            {t('Featured work')}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[22px] font-black tracking-tight text-slate-900">{item.title}</h3>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {item.service?.name || t('Standalone portfolio item')}
          </div>
        </div>

        {item.description ? (
          <p className="text-sm leading-7 text-slate-600">{item.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="psp-control-pill"
            disabled={busy}
            onClick={() => onToggleLike(item.id)}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            {liked ? t('Unlike') : t('Like')} {item.likesCount}
          </button>
          <button
            type="button"
            className="psp-control-pill"
            disabled={busy}
            onClick={() => onRefreshComments(item.id)}
          >
            <MessageCircle size={16} />
            {t('Comments')} {item.commentsCount}
          </button>
        </div>

        <div className="grid gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            {t('Recent comments')}
          </div>

          {comments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              {t('No comments yet.')}
            </div>
          ) : (
            <div className="grid gap-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-slate-800">{comment.authorName}</div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {formatDateTimeLabel(comment.createdAt)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">{comment.body}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={commentDraft}
              onChange={(event) => onDraftChange(item.id, event.target.value)}
              placeholder={t('Write a comment')}
              className="psp-input"
            />
            <button
              type="button"
              className="psp-button psp-button--primary"
              disabled={busy}
              onClick={() => onAddComment(item.id)}
            >
              {t('Comment')}
            </button>
          </div>
        </div>
      </div>
    </article>
    );
  }
);

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
  const { t } = useI18n();
  const stats = useMemo(() => {
    return {
      total: media.length,
      images: media.filter((item) => item.mediaType === 'image').length,
      videos: media.filter((item) => item.mediaType === 'video').length,
      likes: media.reduce((sum, item) => sum + item.likesCount, 0),
      comments: media.reduce((sum, item) => sum + item.commentsCount, 0),
    };
  }, [media]);

  return (
    <section id="provider-portfolio" className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>{t('Portfolio and proof of work')}</h2>
          <div className="psp-surface__sub">
            {t(
              'This is the live proof layer: images, videos, likes, comments, and recent customer reactions.'
            )}
          </div>
        </div>
        {media.length ? (
          <div className="psp-summary-strip">
            <span className="psp-summary-chip">
              <strong>{stats.total}</strong>
              {t('works')}
            </span>
            <span className="psp-summary-chip">
              <strong>{stats.images}</strong>
              {t('images')} / <strong>{stats.videos}</strong> {t('videos')}
            </span>
            <span className="psp-summary-chip">
              <strong>{stats.likes + stats.comments}</strong>
              {t('total interactions')}
            </span>
          </div>
        ) : null}
      </div>

      {!media.length ? (
        <div className="psp-empty-state">{t('No portfolio media has been published yet.')}</div>
      ) : (
        <div className="grid gap-5">
          <div className="psp-card-grid">
            {media.map((item) => (
              <ProviderMediaCard
                key={item.id}
                item={item}
                comments={commentsMap[item.id] || []}
                commentDraft={commentDrafts[item.id] || ''}
                liked={Boolean(likedMap[item.id])}
                busy={actionMediaId === item.id}
                onRefreshComments={onRefreshComments}
                onToggleLike={onToggleLike}
                onDraftChange={onDraftChange}
                onAddComment={onAddComment}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProviderMediaSection;
