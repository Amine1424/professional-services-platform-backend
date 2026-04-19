import React from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  MessageCircle,
  PlayCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDateTimeLabel } from '../../lib/strings';

export interface StoryViewerItem {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  providerLocation?: string | null;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  likesCount: number;
  commentsCount: number;
  promoBadgeText?: string | null;
  showPromoBadge: boolean;
  storyAudience: 'public' | 'favorites_only';
  storyExpiresAt?: string | null;
  service?: { id: string; name: string } | null;
}

interface StoryViewerProps {
  stories: StoryViewerItem[];
  activeIndex: number | null;
  replyDraft: string;
  replying?: boolean;
  replyButtonLabel: string;
  replyPlaceholder: string;
  replyInputDisabled?: boolean;
  replyActionDisabled?: boolean;
  onReplyDraftChange: (value: string) => void;
  onReply: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onProviderAction?: (story: StoryViewerItem) => void;
  providerActionLabel?: string;
}

const fallbackProviderAvatar =
  'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=200&q=80';

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  activeIndex,
  replyDraft,
  replying = false,
  replyButtonLabel,
  replyPlaceholder,
  replyInputDisabled = false,
  replyActionDisabled = false,
  onReplyDraftChange,
  onReply,
  onClose,
  onPrev,
  onNext,
  onProviderAction,
  providerActionLabel,
}) => {
  const { t } = useI18n();
  const activeStory =
    activeIndex !== null && activeIndex >= 0 && activeIndex < stories.length
      ? stories[activeIndex]
      : null;

  if (!activeStory) {
    return null;
  }

  const effectiveProviderActionLabel = providerActionLabel || t('Open provider profile');

  const canGoPrev = activeIndex !== null && activeIndex > 0;
  const canGoNext =
    activeIndex !== null && activeIndex >= 0 && activeIndex < stories.length - 1;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/15 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.42)] md:grid md:grid-cols-[1.1fr_0.9fr]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[320px] bg-slate-950 md:min-h-[72vh]">
          <div className="absolute inset-x-0 top-0 z-[1] flex gap-2 px-5 py-4">
            {stories.map((story, index) => (
              <span
                key={story.id}
                className={`h-1 flex-1 rounded-full ${
                  activeIndex !== null && index <= activeIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {activeStory.mediaType === 'video' ? (
            <video
              src={activeStory.mediaUrl}
              poster={activeStory.thumbnailUrl || undefined}
              controls
              autoPlay
              className="h-full max-h-[72vh] w-full object-cover"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.title}
              className="h-full max-h-[72vh] w-full object-cover"
            />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.72))] p-5 text-white">
            <div className="flex items-center gap-3">
              <img
                src={activeStory.providerAvatarUrl || fallbackProviderAvatar}
                alt={activeStory.providerName}
                className="h-11 w-11 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-[17px] font-black">{activeStory.providerName}</div>
                <div className="truncate text-sm text-white/75">
                  {activeStory.providerLocation || t('Algeria')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                {t('Story viewer')}
              </div>
              <h3 className="mt-3 text-[28px] font-black tracking-tight text-slate-900">
                {activeStory.title}
              </h3>
              {activeStory.description ? (
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {activeStory.description}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">
              {t('Story')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {activeStory.storyAudience === 'favorites_only' ? (
                <Lock size={12} />
              ) : (
                <Globe size={12} />
              )}
              {activeStory.storyAudience === 'favorites_only'
                ? t('Favorites only')
                : t('Public')}
            </span>
            {activeStory.service?.name ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                {activeStory.service.name}
              </span>
            ) : null}
            {activeStory.showPromoBadge && activeStory.promoBadgeText ? (
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                {activeStory.promoBadgeText}
              </span>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {t('Story stats')}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  {stories.length} {t(stories.length === 1 ? 'story' : 'stories')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle size={14} />
                  {activeStory.commentsCount} {t('comments')}
                </span>
              </div>
            </div>

            <div className="rounded-[22px] bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {t('Format')}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  {activeStory.mediaType === 'video' ? (
                    <PlayCircle size={14} />
                  ) : (
                    <Camera size={14} />
                  )}
                  {activeStory.mediaType === 'video' ? t('Video story') : t('Image story')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  {activeStory.storyExpiresAt
                    ? `${t('Expires')} ${formatDateTimeLabel(activeStory.storyExpiresAt)}`
                    : t('Active now')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="text-sm font-bold text-slate-700">{t('Reply to this story')}</div>
            <textarea
              value={replyDraft}
              onChange={(event) => onReplyDraftChange(event.target.value)}
              className="psp-textarea"
              placeholder={replyPlaceholder}
              disabled={replyInputDisabled}
            />
          </div>

          <div className="mt-auto flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={!canGoPrev}
              className="psp-button psp-button--secondary"
            >
              <ChevronLeft size={16} />
              {t('Previous')}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              className="psp-button psp-button--secondary"
            >
              {t('Next')}
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onReply}
              disabled={replyActionDisabled}
              className="psp-button psp-button--primary"
            >
              <Send size={16} />
              {replying ? t('Sending...') : replyButtonLabel}
            </button>
            {onProviderAction ? (
              <button
                type="button"
                onClick={() => onProviderAction(activeStory)}
                className="psp-button psp-button--secondary"
              >
                {effectiveProviderActionLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
