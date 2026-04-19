import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  MessageSquare,
  Shield,
  UserRound,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/api';
import { formatDateTimeLabel } from '../../lib/strings';
import '../../styles/conversation-workspace.css';

type ReviewWorkspaceMode = 'admin' | 'reviewer';

interface ReviewThreadListItem {
  threadId: string;
  unreadCount: number;
  subject: {
    type: 'provider' | 'customer';
    id: string;
    label: string;
    secondaryLabel?: string | null;
    profile: Record<string, any>;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    actorUserId?: string | null;
  };
}

interface ReviewThreadMessage {
  id: string;
  body: string;
  title: string;
  createdAt: string;
  isRead: boolean;
  senderUserId?: string | null;
  senderRole: string;
  senderName: string;
  recipientName: string;
  messageKind: 'message' | 'decision' | 'system';
  decision?: string | null;
}

interface ReviewThreadDetails {
  metadata: {
    threadId: string;
    adminUserId: string;
    reviewerUserId: string;
    subjectType: 'provider' | 'customer';
    subjectId: string;
    subjectLabel: string;
  };
  subject: ReviewThreadListItem['subject'];
  messages: ReviewThreadMessage[];
}

interface ReviewerOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive?: boolean;
}

interface ReviewThreadWorkspaceProps {
  mode: ReviewWorkspaceMode;
}

const WORKSPACE_COPY: Record<
  ReviewWorkspaceMode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: string;
    threadLabel: string;
    composerTitle: string;
    queueHint: string;
  }
> = {
  admin: {
    eyebrow: 'Moderation coordination',
    title: 'Admin review inbox',
    subtitle:
      'Assign reviewer work, clarify context, and capture final decisions without leaving the operational shell.',
    empty: 'Select an existing review thread or start one from a provider or user record.',
    threadLabel: 'Admin thread',
    composerTitle: 'Start reviewer assignment',
    queueHint: 'Use the left queue to reopen active review threads.',
  },
  reviewer: {
    eyebrow: 'Decision workflow',
    title: 'Reviewer inbox',
    subtitle:
      'Handle assigned moderation threads, keep context tight, and return explicit decisions to admin.',
    empty: 'Select a review thread from the queue to continue the moderation workflow.',
    threadLabel: 'Reviewer thread',
    composerTitle: 'Pending assignment',
    queueHint: 'Unread items highlight review work that still needs attention.',
  },
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

const formatDecisionLabel = (value?: string | null) =>
  value ? value.replace(/_/g, ' ') : 'No decision yet';

const ReviewThreadWorkspace: React.FC<ReviewThreadWorkspaceProps> = ({ mode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const threadIdParam = searchParams.get('threadId');
  const subjectTypeParam = searchParams.get('subjectType');
  const subjectIdParam = searchParams.get('subjectId');
  const subjectLabelParam = searchParams.get('subjectLabel') || '';
  const subjectSecondaryParam = searchParams.get('subjectSecondary') || '';

  const [threads, setThreads] = useState<ReviewThreadListItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threadIdParam);
  const [selectedThread, setSelectedThread] = useState<ReviewThreadDetails | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reviewers, setReviewers] = useState<ReviewerOption[]>([]);
  const [draft, setDraft] = useState('');
  const [newThreadReviewerId, setNewThreadReviewerId] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [decision, setDecision] = useState('approved');
  const [decisionNote, setDecisionNote] = useState('');

  const copy = WORKSPACE_COPY[mode];

  const isComposerMode =
    mode === 'admin' &&
    !selectedThreadId &&
    Boolean(subjectTypeParam && subjectIdParam);

  const loadThreads = async (preferredThreadId?: string | null) => {
    try {
      setLoadingThreads(true);
      const response = await api.get('/review-threads');
      const items = response.data?.data || [];
      setThreads(items);
      setSelectedThreadId((current) => {
        const requested = preferredThreadId || current;

        if (requested && items.some((item: ReviewThreadListItem) => item.threadId === requested)) {
          return requested;
        }

        return requested || null;
      });
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to load review threads.');
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    void loadThreads(threadIdParam);
  }, [threadIdParam]);

  useEffect(() => {
    if (threadIdParam && threadIdParam !== selectedThreadId) {
      setSelectedThreadId(threadIdParam);
    }
  }, [selectedThreadId, threadIdParam]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThread(null);
      return;
    }

    let active = true;

    const loadThread = async () => {
      try {
        setLoadingThread(true);
        const response = await api.get(`/review-threads/${selectedThreadId}`);
        if (!active) return;
        setSelectedThread(response.data?.data || null);
        await api.post(`/review-threads/${selectedThreadId}/read`);
        setThreads((current) =>
          current.map((thread) =>
            thread.threadId === selectedThreadId ? { ...thread, unreadCount: 0 } : thread
          )
        );
      } catch (requestError: any) {
        if (!active) return;
        toast.error(requestError.response?.data?.message || 'Failed to load the selected thread.');
      } finally {
        if (active) {
          setLoadingThread(false);
        }
      }
    };

    void loadThread();

    return () => {
      active = false;
    };
  }, [selectedThreadId]);

  useEffect(() => {
    if (mode !== 'admin' || !isComposerMode) {
      return;
    }

    let active = true;

    const loadReviewers = async () => {
      try {
        const response = await api.get('/admin/reviewers');
        if (!active) return;
        const items = response.data?.data || [];
        setReviewers(items);
        if (!newThreadReviewerId && items[0]?.id) {
          setNewThreadReviewerId(items[0].id);
        }
      } catch (requestError: any) {
        if (!active) return;
        toast.error(requestError.response?.data?.message || 'Failed to load reviewers.');
      }
    };

    void loadReviewers();

    return () => {
      active = false;
    };
  }, [isComposerMode, mode, newThreadReviewerId]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (selectedThreadId) {
      next.set('threadId', selectedThreadId);
      next.delete('subjectType');
      next.delete('subjectId');
      next.delete('subjectLabel');
      next.delete('subjectSecondary');
    } else if (!isComposerMode) {
      next.delete('threadId');
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [isComposerMode, searchParams, selectedThreadId, setSearchParams]);

  const sendMessage = async () => {
    if (!selectedThreadId || !draft.trim()) return;

    try {
      setSending(true);
      await api.post(`/review-threads/${selectedThreadId}/messages`, {
        body: draft.trim(),
      });
      setDraft('');
      await loadThreads(selectedThreadId);
      const response = await api.get(`/review-threads/${selectedThreadId}`);
      setSelectedThread(response.data?.data || null);
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to send the message.');
    } finally {
      setSending(false);
    }
  };

  const createThread = async () => {
    if (!subjectTypeParam || !subjectIdParam || !newThreadReviewerId || !newThreadBody.trim()) {
      toast.error('Select the reviewer and write the request first.');
      return;
    }

    try {
      setCreating(true);
      const response = await api.post('/review-threads', {
        reviewerUserId: newThreadReviewerId,
        subjectType: subjectTypeParam,
        subjectId: subjectIdParam,
        body: newThreadBody.trim(),
      });
      const createdThreadId = response.data?.data?.threadId;
      if (createdThreadId) {
        setNewThreadBody('');
        setSelectedThreadId(createdThreadId);
        await loadThreads(createdThreadId);
      }
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to create the review thread.');
    } finally {
      setCreating(false);
    }
  };

  const submitDecision = async () => {
    if (!selectedThreadId) return;

    try {
      setSending(true);
      await api.post(`/review-threads/${selectedThreadId}/decision`, {
        decision,
        note: decisionNote.trim() || null,
      });
      setDecisionNote('');
      await loadThreads(selectedThreadId);
      const response = await api.get(`/review-threads/${selectedThreadId}`);
      setSelectedThread(response.data?.data || null);
      toast.success('Decision posted to the review thread.');
    } catch (requestError: any) {
      toast.error(requestError.response?.data?.message || 'Failed to post the decision.');
    } finally {
      setSending(false);
    }
  };

  const subjectCard = selectedThread?.subject ||
    (isComposerMode
      ? {
          type: (subjectTypeParam as 'provider' | 'customer') || 'provider',
          id: subjectIdParam || '',
          label: subjectLabelParam || 'Review target',
          secondaryLabel: subjectSecondaryParam || '',
          profile: {},
        }
      : null);

  const reviewerCanDecide = mode === 'reviewer' && Boolean(selectedThread);

  const subjectLink =
    subjectCard?.type === 'provider'
      ? mode === 'reviewer'
        ? `/reviewer/providers/${subjectCard.id}${
            selectedThreadId ? `?threadId=${encodeURIComponent(selectedThreadId)}` : ''
          }`
        : `/providers/${subjectCard.id}`
      : null;

  const threadStats = useMemo(() => {
    const unreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    const providerSubjects = threads.filter((thread) => thread.subject.type === 'provider').length;

    return [
      {
        label: 'Active threads',
        value: String(threads.length),
        caption: mode === 'admin' ? 'Open assignments in circulation.' : 'Review threads on your desk.',
        icon: Inbox,
      },
      {
        label: 'Unread',
        value: String(unreadCount),
        caption: 'Messages that still require attention.',
        icon: MessageSquare,
      },
      {
        label: 'Provider cases',
        value: String(providerSubjects),
        caption: 'Subjects tied directly to provider moderation.',
        icon: Shield,
      },
    ];
  }, [mode, threads]);

  const activeReviewer = useMemo(() => {
    if (!selectedThread?.metadata.reviewerUserId) return null;
    return threads.find((thread) => thread.threadId === selectedThreadId)?.reviewer || null;
  }, [selectedThread?.metadata.reviewerUserId, selectedThreadId, threads]);

  const activeAdmin = useMemo(() => {
    if (!selectedThread?.metadata.adminUserId) return null;
    return threads.find((thread) => thread.threadId === selectedThreadId)?.admin || null;
  }, [selectedThread?.metadata.adminUserId, selectedThreadId, threads]);

  const latestDecision = useMemo(() => {
    if (!selectedThread?.messages.length) return null;
    return [...selectedThread.messages]
      .reverse()
      .find((message) => message.messageKind === 'decision') || null;
  }, [selectedThread?.messages]);

  const nextActionLabel = useMemo(() => {
    if (isComposerMode) {
      return 'Assign the right reviewer and explain what should be validated before a decision is made.';
    }

    if (!selectedThread) {
      return copy.queueHint;
    }

    if (mode === 'admin') {
      return latestDecision
        ? 'Review the returned decision, then open the subject record if a follow-up action is needed.'
        : 'Clarify missing context or wait for the reviewer decision.';
    }

    return latestDecision
      ? 'If the decision needs expansion, add a clarifying message before moving to the next thread.'
      : 'Review the profile, post the decision, and keep the note precise.';
  }, [copy.queueHint, isComposerMode, latestDecision, mode, selectedThread]);

  return (
    <div className="psp-review-layout">
      <section className="psp-review-panel psp-review-panel--sidebar">
        <div className="psp-review-panel__header">
          <div>
            <div className="psp-review-eyebrow">{copy.eyebrow}</div>
            <h2>{copy.title}</h2>
            <p>{copy.subtitle}</p>
          </div>
          <div className="psp-review-chip">{threads.length} threads</div>
        </div>

        <div className="psp-review-summary-grid">
          {threadStats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="psp-review-summary-card">
                <div className="psp-review-summary-card__icon">
                  <Icon size={16} />
                </div>
                <div className="psp-review-summary-card__label">{item.label}</div>
                <div className="psp-review-summary-card__value">{item.value}</div>
                <div className="psp-review-summary-card__caption">{item.caption}</div>
              </article>
            );
          })}
        </div>

        <div className="psp-review-panel__section">
          <div className="psp-review-section-head">
            <div>
              <div className="psp-review-section-head__title">Thread queue</div>
              <div className="psp-review-section-head__sub">{copy.queueHint}</div>
            </div>
          </div>

          {loadingThreads ? (
            <div className="psp-review-empty">Loading review threads...</div>
          ) : !threads.length ? (
            <div className="psp-review-empty">
              {mode === 'admin'
                ? 'No review threads yet. Start one from providers or users.'
                : 'No review assignments have been sent yet.'}
            </div>
          ) : (
            <div className="psp-review-thread-list">
              {threads.map((thread) => {
                const counterpart =
                  mode === 'admin'
                    ? thread.reviewer
                      ? `${thread.reviewer.firstName} ${thread.reviewer.lastName}`.trim()
                      : 'Reviewer'
                    : thread.admin
                      ? `${thread.admin.firstName} ${thread.admin.lastName}`.trim()
                      : 'Admin';

                return (
                  <button
                    key={thread.threadId}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.threadId)}
                    className={`psp-review-thread-card ${
                      selectedThreadId === thread.threadId
                        ? 'psp-review-thread-card--active'
                        : ''
                    }`}
                  >
                    <div className="psp-review-thread-card__top">
                      <div className="psp-review-avatar">
                        <span>{getInitials(thread.subject.label)}</span>
                      </div>
                      <div className="psp-review-thread-card__meta">
                        <div className="psp-review-thread-card__title-row">
                          <strong>{thread.subject.label}</strong>
                          <span>{formatRelativeTime(thread.lastMessage.createdAt)}</span>
                        </div>
                        <div className="psp-review-thread-card__sub">
                          {thread.subject.type === 'provider'
                            ? 'Provider review'
                            : 'Customer review'}{' '}
                          | {counterpart}
                        </div>
                      </div>
                    </div>

                    <div className="psp-review-thread-card__bottom">
                      <p>{thread.lastMessage.body}</p>
                      <div className="psp-review-thread-card__footer">
                        <span className="psp-review-pill">{copy.threadLabel}</span>
                        {thread.unreadCount > 0 ? (
                          <span className="psp-review-unread">{thread.unreadCount}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="psp-review-panel psp-review-panel--thread">
        <div className="psp-review-panel__header psp-review-panel__header--thread">
          <div>
            <div className="psp-review-eyebrow">
              {isComposerMode ? copy.composerTitle : 'Review workflow'}
            </div>
            <h2>
              {subjectCard?.label ||
                (mode === 'admin' ? 'Start a new reviewer assignment' : 'Select a review thread')}
            </h2>
            <p>
              {subjectCard?.secondaryLabel ||
                (mode === 'admin'
                  ? 'Keep the reviewer brief operational and explicit.'
                  : 'Open a thread to read context, inspect the subject, and post a decision.')}
            </p>
          </div>

          <div className="psp-review-chip-row">
            <span className="psp-review-chip">
              {subjectCard
                ? subjectCard.type === 'provider'
                  ? 'Provider subject'
                  : 'Customer subject'
                : 'No subject selected'}
            </span>
            {latestDecision ? (
              <span className="psp-review-chip psp-review-chip--success">
                Decision: {formatDecisionLabel(latestDecision.decision)}
              </span>
            ) : null}
          </div>
        </div>

        {isComposerMode ? (
          <div className="psp-review-thread-shell">
            <div className="psp-review-context-card">
              <div className="psp-review-context-card__eyebrow">Review subject</div>
              <div className="psp-review-context-card__title">{subjectCard?.label}</div>
              <div className="psp-review-context-card__text">
                {subjectCard?.secondaryLabel || 'Choose the reviewer and explain what must be checked.'}
              </div>
              <div className="psp-review-context-card__meta">
                <span className="psp-review-pill">
                  {subjectCard?.type === 'provider' ? 'Provider profile' : 'Customer profile'}
                </span>
                {subjectLink ? (
                  <Link to={subjectLink} className="psp-button psp-button--secondary">
                    Open profile
                    <ArrowRight size={16} />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="psp-review-form-grid">
              <div className="psp-review-field">
                <div className="psp-review-field__label">Assigned reviewer</div>
                <select
                  value={newThreadReviewerId}
                  onChange={(event) => setNewThreadReviewerId(event.target.value)}
                  className="psp-select"
                >
                  <option value="">Select reviewer</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {`${reviewer.firstName} ${reviewer.lastName}`.trim()} | {reviewer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="psp-review-field">
                <div className="psp-review-field__label">Assignment brief</div>
                <textarea
                  value={newThreadBody}
                  onChange={(event) => setNewThreadBody(event.target.value)}
                  className="psp-textarea"
                  placeholder="Explain what should be reviewed and what kind of decision you need."
                />
              </div>
            </div>

            <div className="psp-review-actions">
              <button
                type="button"
                className="psp-button psp-button--primary"
                onClick={createThread}
                disabled={creating}
              >
                {creating ? 'Creating thread...' : 'Send to reviewer'}
              </button>
              <button
                type="button"
                className="psp-button psp-button--secondary"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !selectedThreadId ? (
          <div className="psp-review-empty psp-review-empty--thread">{copy.empty}</div>
        ) : loadingThread ? (
          <div className="psp-review-empty psp-review-empty--thread">Loading thread...</div>
        ) : !selectedThread ? (
          <div className="psp-review-empty psp-review-empty--thread">
            Thread details are unavailable.
          </div>
        ) : (
          <div className="psp-review-thread-shell">
            {subjectCard ? (
              <div className="psp-review-context-card">
                <div className="psp-review-context-card__eyebrow">
                  {subjectCard.type === 'provider' ? 'Provider review target' : 'Customer review target'}
                </div>
                <div className="psp-review-context-card__title">{subjectCard.label}</div>
                <div className="psp-review-context-card__text">
                  {subjectCard.secondaryLabel || 'Structured moderation conversation.'}
                </div>
                <div className="psp-review-detail-grid">
                  <div className="psp-review-detail-item">
                    <div className="psp-review-detail-item__label">Subject type</div>
                    <div className="psp-review-detail-item__value">
                      {subjectCard.type === 'provider' ? 'Provider profile' : 'Customer profile'}
                    </div>
                  </div>
                  <div className="psp-review-detail-item">
                    <div className="psp-review-detail-item__label">Latest decision</div>
                    <div className="psp-review-detail-item__value">
                      {formatDecisionLabel(latestDecision?.decision)}
                    </div>
                  </div>
                  <div className="psp-review-detail-item">
                    <div className="psp-review-detail-item__label">Last activity</div>
                    <div className="psp-review-detail-item__value">
                      {formatDateTimeLabel(
                        selectedThread.messages[selectedThread.messages.length - 1]?.createdAt
                      )}
                    </div>
                  </div>
                </div>
                <div className="psp-review-context-card__meta">
                  {subjectLink ? (
                    <Link to={subjectLink} className="psp-button psp-button--secondary">
                      Open profile
                      <ArrowRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="psp-review-message-stream">
              {!selectedThread.messages.length ? (
                <div className="psp-review-empty psp-review-empty--stream">
                  No messages yet in this review thread.
                </div>
              ) : (
                selectedThread.messages.map((message) => {
                  const mine =
                    mode === 'admin'
                      ? message.senderUserId === selectedThread.metadata.adminUserId
                      : message.senderUserId === selectedThread.metadata.reviewerUserId;

                  return (
                    <div
                      key={message.id}
                      className={`psp-review-message-row ${
                        mine ? 'psp-review-message-row--mine' : ''
                      }`}
                    >
                      <div
                        className={`psp-review-message-bubble ${
                          mine ? 'psp-review-message-bubble--mine' : ''
                        }`}
                      >
                        <div className="psp-review-message-bubble__top">
                          <span>{message.senderName}</span>
                          <div className="psp-review-chip-row">
                            {message.messageKind === 'decision' ? (
                              <span className="psp-review-chip psp-review-chip--success">
                                Decision: {formatDecisionLabel(message.decision)}
                              </span>
                            ) : null}
                            <span className="psp-review-chip">
                              {formatDateTimeLabel(message.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="psp-review-message-bubble__body">{message.body}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="psp-review-compose">
              <div className="psp-review-field">
                <div className="psp-review-field__label">Thread message</div>
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="psp-textarea"
                  placeholder="Write a message in this review thread..."
                />
              </div>
              <div className="psp-review-actions">
                <div className="psp-review-compose__hint">
                  Use the thread for missing context, evidence requests, and explicit moderation outcomes.
                </div>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !draft.trim()}
                  className="psp-button psp-button--primary"
                >
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="psp-review-panel psp-review-panel--aside">
        <div className="psp-review-panel__header">
          <div>
            <div className="psp-review-eyebrow">Decision panel</div>
            <h2>{mode === 'admin' ? 'Operational context' : 'Reviewer decision'}</h2>
            <p>
              {mode === 'admin'
                ? 'Track ownership, subject context, and returned decisions.'
                : 'Post the decision back into the thread with a note that can stand on its own.'}
            </p>
          </div>
        </div>

        <div className="psp-review-side-stack">
          <article className="psp-review-side-card">
            <div className="psp-review-side-card__head">
              <ClipboardCheck size={16} />
              Thread routing
            </div>
            <div className="psp-review-side-card__body">
              <div className="psp-review-side-item">
                <span>Admin</span>
                <strong>
                  {activeAdmin
                    ? `${activeAdmin.firstName} ${activeAdmin.lastName}`.trim()
                    : 'Assigned via thread metadata'}
                </strong>
              </div>
              <div className="psp-review-side-item">
                <span>Reviewer</span>
                <strong>
                  {activeReviewer
                    ? `${activeReviewer.firstName} ${activeReviewer.lastName}`.trim()
                    : isComposerMode
                      ? 'Select reviewer'
                      : 'Assigned via thread metadata'}
                </strong>
              </div>
            </div>
          </article>

          <article className="psp-review-side-card">
            <div className="psp-review-side-card__head">
              <UserRound size={16} />
              Subject focus
            </div>
            <div className="psp-review-side-card__body">
              <div className="psp-review-side-item">
                <span>Target</span>
                <strong>{subjectCard?.label || 'No subject selected'}</strong>
              </div>
              <div className="psp-review-side-item">
                <span>Type</span>
                <strong>
                  {subjectCard
                    ? subjectCard.type === 'provider'
                      ? 'Provider review'
                      : 'Customer review'
                    : 'No subject selected'}
                </strong>
              </div>
            </div>
          </article>

          <article className="psp-review-side-card">
            <div className="psp-review-side-card__head">
              <CheckCircle2 size={16} />
              Next action
            </div>
            <div className="psp-review-side-card__body">
              <div className="psp-review-side-note">{nextActionLabel}</div>
            </div>
          </article>

          {!reviewerCanDecide ? (
            <div className="psp-review-empty">
              {mode === 'admin'
                ? 'Open or create a review thread to coordinate with the reviewer.'
                : 'Select a review thread first to send the decision back to admin.'}
            </div>
          ) : (
            <article className="psp-review-side-card psp-review-side-card--decision">
              <div className="psp-review-side-card__head">
                <Shield size={16} />
                Decision form
              </div>
              <div className="psp-review-side-card__body">
                <div className="psp-review-field">
                  <div className="psp-review-field__label">Decision</div>
                  <select
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    className="psp-select"
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                    <option value="request_info">Request more info</option>
                    <option value="suspended">Suspend</option>
                  </select>
                </div>

                <div className="psp-review-field">
                  <div className="psp-review-field__label">Decision note</div>
                  <textarea
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    className="psp-textarea"
                    placeholder="Explain the decision so it stays visible inside the thread."
                  />
                </div>

                <button
                  type="button"
                  onClick={submitDecision}
                  disabled={sending}
                  className="psp-button psp-button--primary"
                >
                  {sending ? 'Posting decision...' : 'Post decision to thread'}
                </button>
              </div>
            </article>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ReviewThreadWorkspace;
