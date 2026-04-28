import React from 'react';
import { ChevronRight, Heart, MessageCircle, Play } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ProviderStoryItem } from './types';

interface ProviderStoriesSectionProps {
  stories: ProviderStoryItem[];
  onOpenStory: (storyId: string) => void;
}

const formatTimestamp = (value: string, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

const ProviderStoriesSection: React.FC<ProviderStoriesSectionProps> = ({
  stories,
  onOpenStory,
}) => {
  const { locale, t } = useI18n();

  if (!stories.length) {
    return null;
  }

  return (
    <section id="provider-stories" className="border-t border-slate-200 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{t('Recent Updates')}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {t('See what this provider has been working on')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenStory(stories[0].id)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
        >
          {t('View All')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onOpenStory(story.id)}
            className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-colors hover:border-blue-200"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
              <img
                src={story.thumbnailUrl || story.mediaUrl}
                alt={story.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {story.mediaType === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <Play size={18} className="ml-0.5 text-slate-900" />
                  </div>
                </div>
              ) : null}

              <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700">
                {story.createdAt ? formatTimestamp(story.createdAt, locale) : t('Live')}
              </div>
            </div>

            <div className="p-3">
              <p className="mb-3 line-clamp-2 text-sm text-slate-900">
                {story.description || story.title}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Heart size={14} />
                  {story.likesCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={14} />
                  {story.commentsCount}
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
