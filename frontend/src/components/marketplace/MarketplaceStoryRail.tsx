import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n';
import { MarketplaceStoryCardItem } from './types';

interface MarketplaceStoryRailProps {
  stories: MarketplaceStoryCardItem[];
  loading?: boolean;
  onOpenStory: (story: MarketplaceStoryCardItem) => void;
}

const MarketplaceStoryRail: React.FC<MarketplaceStoryRailProps> = ({
  stories,
  loading = false,
  onOpenStory,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollBy({
      left: direction === 'left' ? -200 : 200,
      behavior: 'smooth',
    });
  };

  if (!loading && stories.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">{t('Stories')}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => scroll('left')}
              aria-label={t('Scroll stories left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => scroll('right')}
              aria-label={t('Scroll stories right')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent" />

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`story-loading-${index}`}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-20 w-20 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-14 animate-pulse rounded-full bg-slate-200" />
                  </div>
                ))
              : stories.map((story) => (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => onOpenStory(story)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div
                      className={`relative h-20 w-20 shrink-0 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                        story.isLive !== false
                          ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-500'
                          : 'bg-slate-200'
                      }`}
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white bg-white">
                        <img
                          src={story.providerAvatarUrl || story.image || ''}
                          alt={story.providerName || story.label}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {story.isLive !== false ? (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-sm bg-gradient-to-r from-amber-500 to-rose-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          {t('Live')}
                        </div>
                      ) : null}
                    </div>

                    <span className="max-w-20 truncate text-xs text-slate-500 transition group-hover:text-slate-900">
                      {(story.providerName || story.label).split(' ')[0]}
                    </span>
                  </button>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceStoryRail;
