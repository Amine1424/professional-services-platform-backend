import React, { useMemo, useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDateLabel } from '../../lib/strings';
import { ReviewItem } from './types';

interface ProviderReviewsSectionProps {
  reviews: ReviewItem[];
  averageRating?: number;
  reviewCount?: number;
  reviewForm: {
    rating: number;
    comment: string;
  };
  hasExistingReview: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={16}
        className={
          star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
        }
      />
    ))}
  </div>
);

const ProviderReviewsSection: React.FC<ProviderReviewsSectionProps> = ({
  reviews,
  averageRating = 0,
  reviewCount = 0,
  reviewForm,
  hasExistingReview,
  onRatingChange,
  onCommentChange,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [showAll, setShowAll] = useState(false);

  const distribution = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;

    reviews.forEach((review) => {
      const key = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));
      counts[key] += 1;
    });

    return [5, 4, 3, 2, 1].map((stars) => {
      const count = counts[stars];
      const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
      return { stars, percentage };
    });
  }, [reviewCount, reviews]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, 4);
  const canToggleReviews = reviews.length > 4;

  return (
    <section id="provider-reviews" className="border-t border-slate-200 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-950">{t('Reviews')}</h2>
        {canToggleReviews ? (
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
          >
            {showAll ? t('Show less') : `${t('View All')} ${reviewCount}`}
            <ChevronRight size={16} className={showAll ? 'rotate-90 transition-transform' : 'transition-transform'} />
          </button>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="text-center sm:border-r sm:border-slate-200 sm:pr-6 sm:text-left">
            <div className="mb-1 text-5xl font-semibold text-slate-950">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(averageRating)} />
            <div className="mt-1 text-sm text-slate-500">
              {t('Based on')} {reviewCount} {t('reviews')}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {distribution.map(({ stars, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-3 text-sm text-slate-500">{stars}</span>
                <Star size={14} className="fill-amber-500 text-amber-500" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-sm text-slate-500">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {visibleReviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                    {review.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-950">{review.authorName}</div>
                    <div className="text-xs text-slate-500">{formatDateLabel(review.createdAt)}</div>
                  </div>
                </div>

                <StarRating rating={review.rating} />
              </div>

              <p className="text-slate-700">{review.comment || t('No written comment was provided.')}</p>
            </article>
          ))}

          {!reviews.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              {t('No customer reviews have been published yet.')}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">
            {hasExistingReview ? t('Update your review') : t('Leave a review')}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {t('Customer reviews require a customer account.')}
          </p>

          <div className="mt-5 grid gap-3">
            <select
              value={reviewForm.rating}
              onChange={(event) => onRatingChange(Number(event.target.value))}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} {t(value === 1 ? 'star' : 'stars')}
                </option>
              ))}
            </select>

            <textarea
              value={reviewForm.comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={t('Describe the quality of the interaction and delivered work.')}
              className="min-h-[140px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {hasExistingReview ? t('Update review') : t('Submit review')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProviderReviewsSection;
