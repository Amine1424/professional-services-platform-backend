import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ImageIcon,
  MessageSquareQuote,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../config/api';
import { useI18n } from '../i18n';
import { formatDateLabel, formatDateTimeLabel } from '../lib/strings';
import '../styles/app-primitives.css';

interface ReviewDetailsPayload {
  provider: {
    id: string;
    companyName: string;
    description?: string | null;
    city?: string | null;
    wilaya?: string | null;
    region?: string | null;
    yearsOfExperience: number;
    responseTimeMinutes: number;
    averageRating: string;
    reviewsCount: number;
    status: string;
    isVerified: boolean;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber?: string | null;
    };
    primaryCategory?: { name: string } | null;
  };
  services: Array<{ id: string; name: string; description: string; price?: string | null }>;
  media: Array<{ id: string; title: string; mediaType: string; mediaUrl: string }>;
  reviews: Array<{ id: string; rating: number; comment?: string | null; authorName?: string }>;
  requestsCount: number;
  moderationHistory: Array<{
    id: string;
    decision: string;
    note?: string | null;
    createdAt: string;
    reviewer: { firstName: string; lastName: string };
  }>;
}

type ChecklistKey =
  | 'infoComplete'
  | 'docsValid'
  | 'imagesClear'
  | 'contactValid'
  | 'noPreviousComplaints';

const ReviewerProviderReview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ReviewDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    decision: 'approved',
    note: '',
    infoComplete: true,
    docsValid: true,
    imagesClear: true,
    contactValid: true,
    noPreviousComplaints: true,
  });

  const threadId = searchParams.get('threadId');
  const inboxLink = useMemo(
    () =>
      threadId ? `/reviewer/inbox?threadId=${encodeURIComponent(threadId)}` : '/reviewer/inbox',
    [threadId]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.get(`/reviewer/providers/${id}`);
        if (!active) return;
        setData(response.data?.data || null);
        setError(null);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError.response?.data?.message || t('Failed to load provider review details.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, t]);

  const saveDecision = async () => {
    try {
      setSaving(true);

      if (threadId) {
        await api.post(`/review-threads/${threadId}/decision`, {
          decision: form.decision,
          note: form.note,
        });
        toast.success(t('Decision posted to review thread.'));
        navigate(inboxLink);
        return;
      }

      await api.post(`/reviewer/providers/${id}/decision`, {
        decision: form.decision,
        note: form.note,
        checklistJson: {
          infoComplete: form.infoComplete,
          docsValid: form.docsValid,
          imagesClear: form.imagesClear,
          contactValid: form.contactValid,
          noPreviousComplaints: form.noPreviousComplaints,
        },
      });
      toast.success(t('Moderation decision saved.'));
      navigate('/reviewer/history');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || t('Failed to save the moderation decision.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (key: ChecklistKey) => {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  if (loading) {
    return (
      <div className="psp-loading-stack">
        <div className="psp-loading-block psp-loading-block--md" />
        <div className="psp-loading-block psp-loading-block--sm" />
        <div className="psp-loading-block psp-loading-block--lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="psp-error-state">
        <div className="font-bold">{t('Provider review unavailable.')}</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="psp-empty-state">{t('No provider review data is available.')}</div>;
  }

  const locationLabel =
    [data.provider.city, data.provider.wilaya, data.provider.region].filter(Boolean).join(', ') ||
    t('Algeria');

  const checklistItems: Array<{ key: ChecklistKey; label: string; caption: string }> = [
    {
      key: 'infoComplete',
      label: 'Profile information is complete',
      caption: 'Business identity, category, coverage, and description are present.',
    },
    {
      key: 'docsValid',
      label: 'Submitted proof looks valid',
      caption: 'The record is coherent and does not show obvious legitimacy gaps.',
    },
    {
      key: 'imagesClear',
      label: 'Media quality is acceptable',
      caption: 'Uploaded portfolio assets are understandable and relevant to the business.',
    },
    {
      key: 'contactValid',
      label: 'Contact details are usable',
      caption: 'Owner and provider contact data appear operational and consistent.',
    },
    {
      key: 'noPreviousComplaints',
      label: 'No blocking complaints are visible',
      caption: 'History does not show a clear reason to prevent approval.',
    },
  ];

  const summaryCards = [
    {
      label: 'Moderation status',
      value: data.provider.status,
      caption: data.provider.isVerified ? 'Verified profile' : 'Verification pending',
      icon: ShieldCheck,
    },
    {
      label: 'Public rating',
      value: `${data.provider.averageRating || '0.00'}`,
      caption: `${data.provider.reviewsCount} customer review${data.provider.reviewsCount === 1 ? '' : 's'}`,
      icon: MessageSquareQuote,
    },
    {
      label: 'Requests processed',
      value: String(data.requestsCount),
      caption: 'Historic demand touching this provider account.',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Moderation history',
      value: String(data.moderationHistory.length),
      caption: 'Recorded decisions already attached to this provider.',
      icon: UserRound,
    },
  ];

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Provider moderation workspace
            </div>
            <h2 className="mt-3 text-[34px] font-black tracking-tight text-slate-900">
              {data.provider.companyName}
            </h2>
            <div className="mt-3 text-sm leading-8 text-slate-600">
              {data.provider.owner.firstName} {data.provider.owner.lastName} | {data.provider.owner.email}
            </div>
            <div className="mt-3 text-sm leading-8 text-slate-600">
              {locationLabel} | {data.provider.primaryCategory?.name || 'No category'} |{' '}
              {data.provider.yearsOfExperience} years experience
            </div>
            <div className="mt-5 max-w-[760px] text-sm leading-8 text-slate-600">
              {data.provider.description || 'No provider description was added.'}
            </div>
          </div>

          <div className="grid gap-3">
            <button type="button" onClick={saveDecision} disabled={saving} className="psp-button psp-button--primary">
              {saving
                ? 'Saving...'
                : threadId
                  ? 'Post decision to thread'
                  : 'Save moderation decision'}
              <ArrowRight size={16} />
            </button>
            <div className="psp-button-group">
              <Link to={inboxLink} className="psp-button psp-button--secondary">
                Review thread
              </Link>
              <Link to={`/providers/${data.provider.id}`} className="psp-button psp-button--ghost">
                Public page
              </Link>
              <Link to="/reviewer/pending" className="psp-button psp-button--ghost">
                Back to queue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="psp-stat-grid">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="psp-stat-card">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </div>
              <div className="psp-stat-card__label mt-4">{item.label}</div>
              <div className="psp-stat-card__value text-[26px] capitalize">{item.value}</div>
              <div className="psp-stat-card__caption">{item.caption}</div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Reviewer checklist</h2>
              <div className="psp-surface__sub">
                Keep the moderation note grounded in a consistent review standard.
              </div>
            </div>
          </div>

          <div className="psp-list">
            {checklistItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleChecklistItem(item.key)}
                className={`rounded-[22px] border p-5 text-left transition ${
                  form[item.key]
                    ? 'border-blue-200 bg-blue-50/80'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[16px] font-black tracking-tight text-slate-900">
                      {item.label}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.caption}</div>
                  </div>
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                      form[item.key]
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-500'
                    }`}
                  >
                    {form[item.key] ? 'Checked' : 'Review'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Decision form</h2>
              <div className="psp-surface__sub">
                {threadId
                  ? 'This decision will be posted back to the active review thread.'
                  : 'This decision will be stored directly in provider moderation history.'}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Decision</div>
              <select
                value={form.decision}
                onChange={(event) =>
                  setForm((current) => ({ ...current, decision: event.target.value }))
                }
                className="psp-select"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
                <option value="request_info">Request more info</option>
                <option value="suspended">Suspend</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-slate-700">Moderation note</div>
              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Write the note that should justify the moderation decision."
                className="psp-textarea"
              />
            </div>

            <button
              type="button"
              className="psp-button psp-button--primary"
              onClick={saveDecision}
              disabled={saving}
            >
              {saving
                ? 'Saving decision...'
                : threadId
                  ? 'Post decision to thread'
                  : 'Save decision'}
            </button>

            <div className="rounded-[22px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              Use the note to explain the exact reason behind approval, rejection, suspension, or the request for more information.
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Published services</h2>
              <div className="psp-surface__sub">Check clarity, scope, and pricing signals.</div>
            </div>
          </div>
          {!data.services.length ? (
            <div className="psp-empty-state">No services have been added.</div>
          ) : (
            <div className="psp-list">
              {data.services.map((service) => (
                <article key={service.id} className="psp-list-card">
                  <h3 className="psp-list-card__title">{service.name}</h3>
                  <div className="mt-3 text-sm leading-7 text-slate-600">{service.description}</div>
                  <div className="mt-3 text-sm font-semibold text-slate-700">
                    {service.price || 'No public price'}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Portfolio media</h2>
              <div className="psp-surface__sub">Validate relevance and proof-of-work quality.</div>
            </div>
          </div>
          {!data.media.length ? (
            <div className="psp-empty-state">No media has been uploaded.</div>
          ) : (
            <div className="psp-list">
              {data.media.map((item) => (
                <article key={item.id} className="psp-list-card">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <ImageIcon size={18} />
                  </div>
                  <h3 className="mt-4 text-[18px] font-black tracking-tight text-slate-900">
                    {item.title}
                  </h3>
                  <div className="mt-2 text-sm capitalize text-slate-500">{item.mediaType}</div>
                  <a
                    href={item.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-blue-700"
                  >
                    Open media file
                  </a>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="psp-surface">
          <div className="psp-surface__header">
            <div>
              <h2>Customer reviews</h2>
              <div className="psp-surface__sub">Public trust signals visible to customers.</div>
            </div>
          </div>
          {!data.reviews.length ? (
            <div className="psp-empty-state">No customer reviews are available.</div>
          ) : (
            <div className="psp-list">
              {data.reviews.map((review) => (
                <article key={review.id} className="psp-list-card">
                  <div className="psp-list-card__title">
                    {review.authorName || 'Customer'} | {review.rating} stars
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {review.comment || 'No written comment provided.'}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="psp-surface">
        <div className="psp-surface__header">
          <div>
            <h2>Moderation history</h2>
            <div className="psp-surface__sub">
              Past decisions already attached to this provider account.
            </div>
          </div>
        </div>

        {!data.moderationHistory.length ? (
          <div className="psp-empty-state">There is no moderation history for this provider yet.</div>
        ) : (
          <div className="psp-list">
            {data.moderationHistory.map((item) => (
              <article key={item.id} className="psp-list-card">
                <div className="psp-list-card__row">
                  <div>
                    <h3 className="psp-list-card__title capitalize">
                      {item.decision.replace(/_/g, ' ')}
                    </h3>
                    <div className="psp-list-card__meta">
                      {item.reviewer.firstName} {item.reviewer.lastName} |{' '}
                      {formatDateTimeLabel(item.createdAt)}
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                    {formatDateLabel(item.createdAt)}
                  </div>
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {item.note || 'No moderation note was added.'}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewerProviderReview;
