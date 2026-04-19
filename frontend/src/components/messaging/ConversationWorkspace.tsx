import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BadgeCheck,
  Bot,
  Clock3,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import api from '../../config/api';
import { useI18n } from '../../i18n';
import '../../styles/app-primitives.css';

type WorkspaceMode = 'customer' | 'provider';

interface ConversationListItem {
  id: string;
  subject?: string | null;
  status?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  provider: {
    id: string;
    companyName: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    profileBadgeText?: string | null;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  };
  service?: {
    id: string;
    name: string;
  } | null;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderRole: string;
  body: string;
  createdAt: string;
  senderName: string;
  isAiAssisted: boolean;
}

interface AiPreview {
  autoReplyEnabled?: boolean;
  selectedPlan?: string;
  matchedServices: Array<{
    id: string;
    name: string;
    price?: string | null;
    currencyCode?: string;
    promoBadgeText?: string | null;
    showPromoBadge?: boolean;
  }>;
  reply: string;
}

interface ConversationWorkspaceProps {
  mode: WorkspaceMode;
}

const LIST_COPY: Record<
  WorkspaceMode,
  {
    title: string;
    empty: string;
    placeholder: string;
    composePlaceholder: string;
    loadingList: string;
    loadingMessages: string;
    pickConversation: string;
  }
> = {
  customer: {
    title: 'Your conversations',
    empty: 'No conversations yet. Start a message from a provider profile.',
    placeholder: 'No messages in this conversation yet.',
    composePlaceholder: 'Write your message here...',
    loadingList: 'Loading conversations...',
    loadingMessages: 'Loading messages...',
    pickConversation: 'Select a conversation from the list to open the thread.',
  },
  provider: {
    title: 'Shared inbox',
    empty: 'No customer conversations have arrived yet.',
    placeholder: 'No messages in this thread yet.',
    composePlaceholder: 'Write your reply to the customer...',
    loadingList: 'Loading inbox...',
    loadingMessages: 'Loading messages...',
    pickConversation: 'Select a conversation to review the context and reply.',
  },
};

const clampTwoLinesStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const formatRelativeTime = (value?: string | null, locale = 'en-GB') => {
  if (!value) return 'now';

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const formatMessageTime = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
};

const sortConversationsByRecency = (items: ConversationListItem[]) =>
  [...items].sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
    return rightTime - leftTime;
  });

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();

export const ConversationWorkspace: React.FC<ConversationWorkspaceProps> = ({ mode }) => {
  const { locale, t } = useI18n();
  const [searchParams] = useSearchParams();

  const providerId = mode === 'customer' ? searchParams.get('providerId') : null;
  const serviceId = mode === 'customer' ? searchParams.get('serviceId') : null;
  const conversationIdParam = searchParams.get('conversationId');

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationIdParam
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [aiPreview, setAiPreview] = useState<AiPreview | null>(null);
  const [threadConversationId, setThreadConversationId] = useState<string | null>(null);

  const hasBootstrappedListRef = useRef(false);
  const openFromProfileRef = useRef<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(conversationIdParam);
  const conversationsRequestRef = useRef(0);
  const messagesRequestRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageCacheRef = useRef<Record<string, MessageItem[]>>({});

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const counterpartName =
    mode === 'customer'
      ? selectedConversation?.provider.companyName || 'Provider'
      : `${selectedConversation?.customer.firstName || ''} ${
          selectedConversation?.customer.lastName || ''
        }`.trim() || 'Customer';

  const unreadThreads = conversations.filter((item) => item.unreadCount > 0).length;
  const serviceLinkedThreads = conversations.filter((item) => Boolean(item.service?.name)).length;
  const isSwitchingConversation =
    Boolean(selectedConversationId) &&
    Boolean(threadConversationId) &&
    selectedConversationId !== threadConversationId &&
    loadingMessages;
  const selectedServiceLabel =
    selectedConversation?.service?.name ||
    selectedConversation?.subject ||
    t('General conversation');
  const selectedStatusLabel = selectedConversation?.status || 'open';
  const providerReplyGuidance = useMemo(() => {
    if (mode !== 'provider' || !selectedConversation) {
      return '';
    }

    if (selectedConversation.unreadCount > 0) {
      return 'Customer activity is waiting. Reply while the scope and timeline are still fresh.';
    }

    if (selectedConversation.service?.name) {
      return 'Use the linked service context to shape a scoped quote or a clear next step.';
    }

    if (selectedConversation.status && selectedConversation.status !== 'open') {
      return `Continue the ${selectedConversation.status} workflow and keep the customer informed.`;
    }

    return 'Clarify scope, budget, and expected timing so the thread can move toward a concrete request.';
  }, [mode, selectedConversation]);
  const overviewCards =
    mode === 'provider'
      ? [
          { label: 'Total threads', value: conversations.length },
          { label: 'Needs reply', value: unreadThreads },
          { label: 'Service-linked', value: serviceLinkedThreads },
        ]
      : [
          { label: 'Total threads', value: conversations.length },
          { label: 'Unread threads', value: unreadThreads },
        ];

  const refreshConversations = useCallback(
    async (options?: {
      preferredId?: string | null;
      silent?: boolean;
      suppressError?: boolean;
    }) => {
      const { preferredId = null, silent = false, suppressError = false } = options || {};
      const requestId = ++conversationsRequestRef.current;

      try {
        if (!silent) {
          setLoadingList(true);
        }

        const response = await api.get('/messages/conversations');
        const items: ConversationListItem[] = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        if (requestId !== conversationsRequestRef.current) {
          return;
        }

        const sorted = sortConversationsByRecency(items);
        setConversations(sorted);

        const locked = selectedConversationIdRef.current;
        const hasLocked = locked && sorted.some((item) => item.id === locked);
        const hasPreferred = preferredId && sorted.some((item) => item.id === preferredId);
        const hasParam =
          conversationIdParam && sorted.some((item) => item.id === conversationIdParam);

        const nextSelectedId = hasLocked
          ? locked
          : hasPreferred
            ? preferredId
            : hasParam
              ? conversationIdParam
              : sorted[0]?.id || null;

        selectedConversationIdRef.current = nextSelectedId;
        setSelectedConversationId(nextSelectedId);
      } catch (error) {
        if (!suppressError) {
          console.error(error);
          toast.error(t('Failed to load conversations.'));
        }
      } finally {
        if (!silent && requestId === conversationsRequestRef.current) {
          setLoadingList(false);
        }
      }
    },
    [conversationIdParam, t]
  );

  const refreshMessages = useCallback(
    async (
      conversationId: string,
      options?: {
        silent?: boolean;
        suppressError?: boolean;
      }
    ) => {
      const { silent = false, suppressError = false } = options || {};
      const requestId = ++messagesRequestRef.current;

      try {
        if (!silent) {
          setLoadingMessages(true);
        }

        const response = await api.get(`/messages/conversations/${conversationId}/messages`);
        const nextMessages: MessageItem[] = Array.isArray(response.data?.data?.messages)
          ? response.data.data.messages
          : [];

        if (requestId !== messagesRequestRef.current) {
          return;
        }

        messageCacheRef.current[conversationId] = nextMessages;

        if (selectedConversationIdRef.current === conversationId) {
          setMessages(nextMessages);
          setThreadConversationId(conversationId);
        }

        api.post(`/messages/conversations/${conversationId}/read`).catch(() => {});

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  unreadCount: 0,
                }
              : conversation
          )
        );
      } catch (error) {
        if (!suppressError) {
          console.error(error);
          toast.error(t('Failed to load messages.'));
        }
      } finally {
        if (
          requestId === messagesRequestRef.current &&
          selectedConversationIdRef.current === conversationId
        ) {
          setLoadingMessages(false);
        }
      }
    },
    [t]
  );

  const selectConversation = useCallback((conversationId: string | null) => {
    if (selectedConversationIdRef.current === conversationId) {
      return;
    }

    selectedConversationIdRef.current = conversationId;
    setSelectedConversationId(conversationId);
    setAiPreview(null);
    setDraft('');

    if (!conversationId) {
      setMessages([]);
      setThreadConversationId(null);
      setLoadingMessages(false);
      return;
    }

    const cached = messageCacheRef.current[conversationId];
    if (cached) {
      setMessages(cached);
      setThreadConversationId(conversationId);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
  }, []);

  const openConversationFromProfile = useCallback(async () => {
    if (mode !== 'customer' || !providerId) {
      return;
    }

    try {
      setCreatingConversation(true);

      const response = await api.post('/messages/conversations', {
        providerId,
        serviceId: serviceId || null,
      });

      const conversation = response.data?.data;

      if (conversation?.id) {
        selectedConversationIdRef.current = conversation.id;
        setSelectedConversationId(conversation.id);
        await refreshConversations({
          preferredId: conversation.id,
          silent: true,
          suppressError: true,
        });
      }
    } catch (error: any) {
      openFromProfileRef.current = null;
      toast.error(error.response?.data?.message || t('Failed to open the conversation.'));
    } finally {
      setCreatingConversation(false);
    }
  }, [mode, providerId, refreshConversations, serviceId, t]);

  const sendMessage = async (useAiAssisted = false) => {
    if (!selectedConversationId || !draft.trim()) {
      return;
    }

    try {
      setSending(true);

      const response = await api.post(`/messages/conversations/${selectedConversationId}/messages`, {
        body: draft.trim(),
        isAiAssisted: useAiAssisted,
      });

      const createdMessage = response.data?.data || null;

      setDraft('');
      setAiPreview(null);

      if (createdMessage) {
        const nextMessages = [
          ...(messageCacheRef.current[selectedConversationId] || []),
          createdMessage,
        ];

        messageCacheRef.current[selectedConversationId] = nextMessages;
        setMessages(nextMessages);
        setThreadConversationId(selectedConversationId);

        setConversations((current) =>
          sortConversationsByRecency(
            current.map((conversation) =>
              conversation.id === selectedConversationId
                ? {
                    ...conversation,
                    lastMessagePreview: createdMessage.body,
                    lastMessageAt: createdMessage.createdAt,
                    unreadCount: 0,
                  }
                : conversation
            )
          )
        );

        return;
      }

      await refreshMessages(selectedConversationId, { silent: true, suppressError: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to send the message.'));
    } finally {
      setSending(false);
    }
  };

  const generateAiReply = async () => {
    if (mode !== 'provider' || !selectedConversationId) {
      return;
    }

    try {
      setGeneratingAi(true);

      const response = await api.post(
        `/messages/conversations/${selectedConversationId}/ai-reply-preview`,
        {}
      );

      const data = response.data?.data || null;
      setAiPreview(data);

      if (data?.reply) {
        setDraft(data.reply);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to generate the AI reply.'));
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(mode === 'provider' && Boolean(aiPreview));
    }
  };

  useEffect(() => {
    if (hasBootstrappedListRef.current) return;

    hasBootstrappedListRef.current = true;
    void refreshConversations({
      preferredId: conversationIdParam,
    });
  }, [conversationIdParam, refreshConversations]);

  useEffect(() => {
    if (!conversationIdParam) return;
    if (conversationIdParam === selectedConversationIdRef.current) return;

    const exists = conversations.some((conversation) => conversation.id === conversationIdParam);
    if (exists) {
      selectConversation(conversationIdParam);
    }
  }, [conversationIdParam, conversations, selectConversation]);

  useEffect(() => {
    if (mode !== 'customer' || !providerId) {
      return;
    }

    const key = `${providerId}:${serviceId || ''}`;
    if (openFromProfileRef.current === key) {
      return;
    }

    openFromProfileRef.current = key;
    void openConversationFromProfile();
  }, [mode, openConversationFromProfile, providerId, serviceId]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setThreadConversationId(null);
      setLoadingMessages(false);
      return;
    }

    setAiPreview(null);

    const cached = messageCacheRef.current[selectedConversationId];
    if (cached) {
      setMessages(cached);
      setThreadConversationId(selectedConversationId);
      setLoadingMessages(false);
      return;
    }

    void refreshMessages(selectedConversationId);
  }, [refreshMessages, selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
    });
  }, [messages]);

  return (
    <div className="psp-page-stack">
      <section className="psp-surface">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {t('Messaging workspace')}
            </div>
            <h2 className="mt-2 text-[30px] font-black tracking-tight text-slate-900">
              {t(mode === 'customer' ? 'Provider conversations' : 'Commercial inbox')}
            </h2>
            <div className="mt-3 max-w-[760px] text-[15px] leading-8 text-slate-600">
              {t(
                mode === 'customer'
                  ? 'Review the provider, the linked service, the current thread, and the next message in one clean workspace.'
                  : 'Reply faster with clearer customer identity, service context, and AI draft support.'
              )}
            </div>
          </div>

          <div
            className={`grid min-w-[280px] gap-3 ${
              mode === 'provider' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            }`}
          >
            {overviewCards.map((card) => (
              <div key={card.label} className="rounded-[22px] bg-slate-50 px-4 py-4">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {t(card.label)}
                </div>
                <div className="mt-2 text-[24px] font-black text-slate-900">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="psp-surface xl:sticky xl:top-6 xl:self-start">
          <div className="psp-surface__header">
            <div>
              <h2>{t(LIST_COPY[mode].title)}</h2>
              <div className="psp-surface__sub">
                {t('Switch threads without losing context.')}
              </div>
            </div>
          </div>

          {creatingConversation ? (
            <div className="psp-empty-state">{t('Opening the conversation with this provider...')}</div>
          ) : loadingList ? (
            <div className="psp-empty-state">{t(LIST_COPY[mode].loadingList)}</div>
          ) : !conversations.length ? (
            <div className="psp-empty-state">{t(LIST_COPY[mode].empty)}</div>
          ) : (
            <div className="grid gap-4">
              {conversations.map((conversation) => {
                const counterpart =
                  mode === 'customer'
                    ? conversation.provider.companyName
                    : `${conversation.customer.firstName} ${conversation.customer.lastName}`.trim();
                const serviceLabel =
                  conversation.service?.name || conversation.subject || t('Service conversation');
                const isActive = selectedConversationId === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => selectConversation(conversation.id)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isActive
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-[18px] bg-slate-200">
                        {mode === 'customer' && conversation.provider.avatarUrl ? (
                          <img
                            src={conversation.provider.avatarUrl}
                            alt={counterpart}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-700">
                            {getInitials(counterpart || 'PS')}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <strong className="truncate text-sm text-slate-900">
                              {counterpart || 'Conversation'}
                            </strong>
                            {mode === 'provider' ? (
                              <div className="mt-1 truncate text-xs text-slate-500">
                                {conversation.customer.email || t('Customer account')}
                              </div>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {formatRelativeTime(conversation.lastMessageAt, locale)}
                          </span>
                        </div>

                        {mode === 'customer' ? (
                          <div className="mt-1 truncate text-xs text-slate-500">{serviceLabel}</div>
                        ) : null}

                        <div className="mt-3 text-sm leading-6 text-slate-600" style={clampTwoLinesStyle}>
                          {conversation.lastMessagePreview || t('No messages yet.')}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {mode === 'customer' && conversation.provider.profileBadgeText ? (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              {conversation.provider.profileBadgeText}
                            </span>
                          ) : null}

                          {mode === 'provider' ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              {serviceLabel}
                            </span>
                          ) : null}

                          {mode === 'provider' && conversation.status ? (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                              {conversation.status}
                            </span>
                          ) : null}

                          {conversation.unreadCount > 0 ? (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                              {conversation.unreadCount} {t('unread')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="psp-surface overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            {selectedConversation ? (
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-slate-100 text-sm font-black text-slate-700">
                    {mode === 'customer' && selectedConversation.provider.avatarUrl ? (
                      <img
                        src={selectedConversation.provider.avatarUrl}
                        alt={counterpartName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(counterpartName || (mode === 'provider' ? 'Customer' : 'Provider'))
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[24px] font-black tracking-tight text-slate-900">
                        {counterpartName}
                      </h2>

                      {mode === 'customer' && selectedConversation.provider.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          <ShieldCheck size={14} />
                          Verified
                        </span>
                      ) : null}

                      {mode === 'customer' && selectedConversation.provider.profileBadgeText ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {selectedConversation.provider.profileBadgeText}
                        </span>
                      ) : null}
                    </div>

                    {mode === 'provider' && selectedConversation.customer.email ? (
                      <div className="mt-2 text-sm font-semibold text-slate-500">
                        {selectedConversation.customer.email}
                      </div>
                    ) : null}

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{selectedServiceLabel}</span>
                      <span>|</span>
                      <span>{formatRelativeTime(selectedConversation.lastMessageAt, locale)}</span>
                      {selectedConversation.status ? (
                        <>
                          <span>|</span>
                          <span>{selectedConversation.status}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selectedConversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                      {selectedConversation.unreadCount} {t('unread')}
                    </span>
                  ) : null}

                  {isSwitchingConversation ? (
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                      {t('Loading thread...')}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {t('Workspace')}
                </div>
                <h2 className="mt-2 text-[24px] font-black tracking-tight text-slate-900">
                  {t('Select a conversation')}
                </h2>
              </div>
            )}
          </div>

          {!selectedConversationId ? (
            <div className="p-8">
              <div className="psp-empty-state">{t(LIST_COPY[mode].pickConversation)}</div>
            </div>
          ) : loadingMessages && !messages.length ? (
            <div className="p-8">
              <div className="psp-empty-state">{t(LIST_COPY[mode].loadingMessages)}</div>
            </div>
          ) : (
            <>
              <div
                className="min-h-[520px] bg-slate-50 px-5 py-5"
                style={
                  isSwitchingConversation
                    ? { opacity: 0.62, transition: 'opacity 0.14s ease' }
                    : undefined
                }
              >
                {mode === 'provider' ? (
                  <div className="mb-4 rounded-[24px] border border-blue-100 bg-white/80 px-4 py-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {t('Reply target')}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <span className="font-black text-slate-900">{counterpartName}</span>
                      {selectedConversation?.customer.email ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {selectedConversation.customer.email}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {selectedServiceLabel}
                      </span>
                    </div>
                    <div className="mt-3 text-sm leading-7 text-slate-600">
                      {t(providerReplyGuidance)}
                    </div>
                  </div>
                ) : null}

                {!messages.length ? (
                  <div className="psp-empty-state">{t(LIST_COPY[mode].placeholder)}</div>
                ) : (
                  <div className="grid gap-4">
                    {messages.map((message) => {
                      const mine =
                        message.senderRole ===
                        (mode === 'customer' ? 'customer' : 'service_provider');

                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-[24px] border px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)] ${
                              mine
                                ? 'border-blue-200 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                              <span className={mine ? 'text-white/90' : 'text-slate-500'}>
                                {message.senderName}
                              </span>

                              {message.isAiAssisted ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-2.5 py-1 text-[11px] font-black">
                                  <Bot size={12} />
                                  {t('AI')}
                                </span>
                              ) : null}
                            </div>

                            <div className="whitespace-pre-wrap text-[15px] leading-7">
                              {message.body}
                            </div>

                            <div
                              className={`mt-3 text-xs font-semibold ${
                                mine ? 'text-white/80' : 'text-slate-500'
                              }`}
                            >
                              {formatMessageTime(message.createdAt, locale)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-5">
                <textarea
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  placeholder={t(LIST_COPY[mode].composePlaceholder)}
                  className="psp-textarea"
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    {t('Press Enter to send. Use Shift + Enter for a new line.')}
                  </span>

                  <div className="flex flex-wrap gap-3">
                    {mode === 'provider' ? (
                      <button
                        type="button"
                        onClick={generateAiReply}
                        disabled={generatingAi || !selectedConversationId}
                        className="psp-button psp-button--secondary"
                      >
                        <Wand2 size={16} />
                        {t(generatingAi ? 'Preparing reply...' : 'Generate AI draft')}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void sendMessage(mode === 'provider' && Boolean(aiPreview))}
                      disabled={sending || !draft.trim()}
                      className="psp-button psp-button--primary"
                    >
                      <Send size={16} />
                      {t(sending ? 'Sending...' : 'Send')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="psp-page-stack">
          <article className="psp-surface">
            <div className="psp-surface__header">
              <div>
                <h2>{t(mode === 'provider' ? 'Commercial context' : 'Conversation context')}</h2>
                <div className="psp-surface__sub">
                  {t(
                    mode === 'provider'
                      ? 'Everything needed to answer quickly with better commercial quality.'
                      : 'Trust and service information for the current provider.'
                  )}
                </div>
              </div>
            </div>

            {!selectedConversation ? (
              <div className="psp-empty-state">{t('Select a thread to view context.')}</div>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t(mode === 'provider' ? 'Customer' : 'Provider')}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] bg-white text-sm font-black text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                      {mode === 'customer' && selectedConversation.provider.avatarUrl ? (
                        <img
                          src={selectedConversation.provider.avatarUrl}
                          alt={selectedConversation.provider.companyName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(counterpartName || (mode === 'provider' ? 'Customer' : 'Provider'))
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-black text-slate-900">{counterpartName}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {mode === 'provider'
                          ? selectedConversation.customer.email || t('Customer account')
                          : selectedServiceLabel}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    {t('Current context')}
                  </div>

                  <div className="mt-3 grid gap-3">
                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                      <span className="text-sm font-semibold text-slate-500">{t('Service')}</span>
                      <span className="text-sm font-black text-slate-900">
                        {selectedServiceLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                      <span className="text-sm font-semibold text-slate-500">{t('Status')}</span>
                      <span className="text-sm font-black text-slate-900">
                        {selectedStatusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                      <span className="text-sm font-semibold text-slate-500">{t('Last activity')}</span>
                      <span className="text-sm font-black text-slate-900">
                        {formatRelativeTime(selectedConversation.lastMessageAt, locale)}
                      </span>
                    </div>

                    {mode === 'provider' ? (
                      <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3">
                        <span className="text-sm font-semibold text-slate-500">{t('Unread activity')}</span>
                        <span className="text-sm font-black text-slate-900">
                          {selectedConversation.unreadCount
                            ? `${selectedConversation.unreadCount} ${t('unread')}`
                            : t('Up to date')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {mode === 'provider' ? (
                  <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="inline-flex items-center gap-2 text-sm font-black text-blue-700">
                      <MessageSquare size={16} />
                      {t('Next likely action')}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      {t(providerReplyGuidance)}
                    </div>
                  </div>
                ) : null}

                {mode === 'customer' && selectedConversation.provider.isVerified ? (
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4">
                    <div className="inline-flex items-center gap-2 text-sm font-black text-emerald-700">
                      <BadgeCheck size={16} />
                      {t('Verified provider')}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      {t(
                        'This conversation is linked to a provider profile that already carries marketplace trust signals.'
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </article>

          {mode === 'provider' ? (
            <article className="psp-surface">
              <div className="psp-surface__header">
                <div>
                  <h2>{t('AI assistant')}</h2>
                  <div className="psp-surface__sub">
                    {t('Service-aware draft generation and response support.')}
                  </div>
                </div>
              </div>

              {!selectedConversationId ? (
                <div className="psp-empty-state">
                  {t('Select a conversation first to generate a reply grounded in your services.')}
                </div>
              ) : !aiPreview ? (
                <div className="rounded-[24px] bg-slate-50 p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-blue-700">
                    <Sparkles size={14} />
                    {t('Provider copilot')}
                  </div>
                  <div className="mt-4 text-[22px] font-black tracking-tight text-slate-900">
                    {t('Generate a stronger first reply')}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {t('Pull service-matching context into a usable draft, then edit before sending.')}
                  </div>
                  <button
                    type="button"
                    onClick={generateAiReply}
                    disabled={generatingAi}
                    className="psp-button psp-button--secondary mt-5"
                  >
                    <Wand2 size={16} />
                    {t(generatingAi ? 'Preparing...' : 'Generate AI draft')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {aiPreview.selectedPlan ? (
                    <div className="rounded-[24px] bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        {t('Draft mode')}
                      </div>
                      <div className="mt-2 text-sm font-black text-slate-900">
                        {aiPreview.selectedPlan}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {t('Closest services')}
                    </div>

                    {!aiPreview.matchedServices.length ? (
                      <div className="mt-3 text-sm leading-7 text-slate-600">
                        {t('No direct service match was found, but the suggested reply is still available.')}
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3">
                        {aiPreview.matchedServices.map((service) => (
                          <div key={service.id} className="rounded-[18px] bg-white px-4 py-4">
                            <div className="text-sm font-black text-slate-900">{service.name}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              {service.price && service.currencyCode
                                ? `${service.price} ${service.currencyCode}`
                                : t('Price on request')}
                            </div>
                            {service.showPromoBadge && service.promoBadgeText ? (
                              <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {service.promoBadgeText}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                      <Bot size={16} />
                      {t('Suggested reply')}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {aiPreview.reply}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void sendMessage(true)}
                    disabled={sending || !draft.trim()}
                    className="psp-button psp-button--primary"
                  >
                    <Send size={16} />
                    {t('Send suggested reply')}
                  </button>
                </div>
              )}
            </article>
          ) : (
            <article className="psp-surface">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-blue-700">
                  <Clock3 size={14} />
                  {t('Conversation note')}
                </div>
                <div className="mt-4 text-[22px] font-black tracking-tight text-slate-900">
                  {t('One clean thread, no visual noise')}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {t(
                    'This workspace keeps provider identity, verification, service context, and the active thread in one coherent view.'
                  )}
                </div>
              </div>
            </article>
          )}
        </aside>
      </section>
    </div>
  );
};

export default ConversationWorkspace;
