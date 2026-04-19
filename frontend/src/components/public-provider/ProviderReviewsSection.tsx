import React from 'react';
import { Star } from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDateLabel } from '../../lib/strings';
import { ReviewItem } from './types';

interface ProviderReviewsSectionProps {
  reviews: ReviewItem[];
  reviewForm: {
    rating: number;
    comment: string;
  };
  hasExistingReview: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

const ProviderReviewsSection: React.FC<ProviderReviewsSectionProps> = ({
  reviews,
  reviewForm,
  hasExistingReview,
  onRatingChange,
  onCommentChange,
  onSubmit,
}) => {
  const { t } = useI18n();

  return (
    <section id="provider-reviews" className="psp-surface">
      <div className="psp-surface__header">
        <div>
          <h2>{t('Customer reviews')}</h2>
          <div className="psp-surface__sub">
            {t('Ratings are public quality signals and feed the discovery ranking.')}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[24px] bg-slate-50 p-5">
          <div className="text-[20px] font-black tracking-tight text-slate-900">
            {hasExistingReview ? t('Update your review') : t('Leave a review')}
          </div>
          <div className="mt-2 text-sm leading-7 text-slate-500">
            {t('Customer reviews require a customer account.')}
          </div>

          <div className="mt-5 grid gap-3">
            <select
              value={reviewForm.rating}
              onChange={(event) => onRatingChange(Number(event.target.value))}
              className="psp-select"
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
              placeholder={t('Describe the quality of the interaction and the delivered work.')}
              className="psp-textarea"
            />

            <button type="button" className="psp-button psp-button--primary" onClick={onSubmit}>
              {hasExistingReview ? t('Update review') : t('Submit review')}
            </button>
          </div>
        </div>

        {!reviews.length ? (
          <div className="psp-empty-state">{t('No customer reviews have been published yet.')}</div>
        ) : (
          <div className="psp-list">
            {reviews.map((review) => (
              <article key={review.id} className="psp-list-card">
                <div className="psp-list-card__row">
                  <div>
                    <h3 className="psp-list-card__title">{review.authorName}</h3>
                    <div className="psp-list-card__meta">{formatDateLabel(review.createdAt)}</div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">
                    <Star size={15} fill="currentColor" />
                    {review.rating}
                  </div>
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {review.comment || t('No written comment was provided.')}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProviderReviewsSection;
