import React, { useMemo } from 'react';
import { Globe, Lock, PlayCircle, Sparkles } from 'lucide-react';
import { formatDateTimeLabel } from '../../lib/strings';
import { ProviderStoryItem } from './types';

interface ProviderStoriesSectionProps {
  stories: ProviderStoryItem[];
  onOpenStory: (storyId: string) => void;
}

const ProviderStoriesSection: React.FC<ProviderStoriesSectionProps> = ({
  stories,
  onOpenStory,
}) => {
  const stats = useMemo(() => {
    const publicStories = stories.filter((story) => story.storyAudience === 'public').length;
    const favoriteStories = stories.filter(
      (story) => story.storyAudience === 'favorites_only'
    ).length;

    return {
      publicStories,
      favoriteStories,
    };
  }, [stories]);

  if (!stories.length) {
    return null;
  }

  return (
    <section id="provider-stories" className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>Story updates</h2>
          <div className="psp-surface__sub">
            View recent story posts in a dedicated viewer, then reply directly into messaging.
          </div>
        </div>
        <div className="psp-summary-strip">
          <span className="psp-summary-chip">
            <strong>{stories.length}</strong>
            active stories
          </span>
          <span className="psp-summary-chip">
            <strong>{stats.publicStories}</strong>
            public
          </span>
          <span className="psp-summary-chip">
            <strong>{stats.favoriteStories}</strong>
            favorites only
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onOpenStory(story.id)}
            className="overflow-hidden rounded-[24px] border border-white/80 bg-white/95 text-left shadow-[0_18px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(15,23,42,0.1)]"
          >
            <div className="relative h-[220px] bg-slate-100">
              {story.mediaType === 'video' ? (
                story.thumbnailUrl ? (
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={story.mediaUrl}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <img
                  src={story.mediaUrl}
                  alt={story.title}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),rgba(15,23,42,0.62))]" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white">
                  Story
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                  {story.storyAudience === 'favorites_only' ? (
                    <Lock size={12} />
                  ) : (
                    <Globe size={12} />
                  )}
                  {story.storyAudience === 'favorites_only' ? 'Favorites' : 'Public'}
                </span>
              </div>
              {story.mediaType === 'video' ? (
                <div className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-900">
                  <PlayCircle size={18} />
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 p-5">
              <div>
                <div className="text-[20px] font-black tracking-tight text-slate-900">
                  {story.title}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {story.service?.name || 'Provider story'}
                </div>
              </div>

              {story.description ? (
                <div className="text-sm leading-7 text-slate-600">{story.description}</div>
              ) : null}

              <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={14} />
                  {story.storyExpiresAt
                    ? `Expires ${formatDateTimeLabel(story.storyExpiresAt)}`
                    : 'Active now'}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProviderStoriesSection;
