import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
import api from '../../config/api';
import CustomerWorkspaceTopNav from '../customer/CustomerWorkspaceTopNav';
import ProviderWorkspaceTopNav from '../provider/ProviderWorkspaceTopNav';
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
    averageRating?: string | number | null;
    reviewsCount?: number | null;
    responseTimeMinutes?: number | null;
    primaryCategoryName?: string | null;
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
    categoryName?: string | null;
    price?: string | null;
    currencyCode?: string | null;
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

interface CustomerRequestSummary {
  id: string;
  conversationId?: string | null;
  status: string;
  subject?: string | null;
  updatedAt: string;
}

interface CustomerRequestDraft {
  subject: string;
  description: string;
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

const formatMessageDateDivider = (value?: string | null, locale = 'en-GB') => {
  if (!value) return '';

  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatRating = (value?: string | number | null) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric.toFixed(1);
};

const formatResponseLabel = (minutes?: number | null) => {
  if (!minutes || minutes <= 0) {
    return 'Response time not shared';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes === 60) {
    return '< 1 hour';
  }

  return `${Math.ceil(minutes / 60)} h`;
};

const getRequestStatusLabel = (status?: string | null) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'reviewed':
      return 'Reviewed';
    case 'quoted':
      return 'Quote sent';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Open';
  }
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
  const navigate = useNavigate();
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
  const [conversationSearch, setConversationSearch] = useState('');
  const [customerRequests, setCustomerRequests] = useState<Record<string, CustomerRequestSummary>>(
    {}
  );
  const [loadingCustomerRequests, setLoadingCustomerRequests] = useState(false);
  const [showRequestComposer, setShowRequestComposer] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [requestDraft, setRequestDraft] = useState<CustomerRequestDraft>({
    subject: '',
    description: '',
  });
  const [navRefreshKey, setNavRefreshKey] = useState(0);

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
  const selectedLinkedRequest =
    mode === 'customer' && selectedConversationId ? customerRequests[selectedConversationId] || null : null;

  const counterpartName =
    mode === 'customer'
      ? selectedConversation?.provider.companyName || t('Provider')
      : `${selectedConversation?.customer.firstName || ''} ${
          selectedConversation?.customer.lastName || ''
        }`.trim() || t('Customer');

  const unreadThreads = conversations.filter((item) => item.unreadCount > 0).length;
  const serviceLinkedThreads = conversations.filter((item) => Boolean(item.service?.name)).length;
  const unreadMessagesCount = conversations.reduce(
    (total, conversation) => total + Number(conversation.unreadCount || 0),
    0
  );
  const isSwitchingConversation =
    Boolean(selectedConversationId) &&
    Boolean(threadConversationId) &&
    selectedConversationId !== threadConversationId &&
    loadingMessages;
  const selectedServiceLabel =
    selectedConversation?.service?.name ||
    selectedConversation?.subject ||
    t('General conversation');
  const selectedStatusLabel = selectedConversation?.status || t('open');
  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const counterpart =
        mode === 'customer'
          ? conversation.provider.companyName
          : `${conversation.customer.firstName} ${conversation.customer.lastName}`.trim();
      const searchable = [
        counterpart,
        conversation.lastMessagePreview || '',
        conversation.subject || '',
        conversation.service?.name || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [conversationSearch, conversations, mode]);
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

  const refreshCustomerRequests = useCallback(
    async (silent = false) => {
      if (mode !== 'customer') {
        return;
      }

      try {
        if (!silent) {
          setLoadingCustomerRequests(true);
        }

        const response = await api.get('/orders/customer');
        const items: CustomerRequestSummary[] = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const nextMap = items.reduce<Record<string, CustomerRequestSummary>>((acc, item) => {
          if (!item.conversationId) {
            return acc;
          }

          const current = acc[item.conversationId];
          if (
            !current ||
            new Date(item.updatedAt).getTime() > new Date(current.updatedAt).getTime()
          ) {
            acc[item.conversationId] = item;
          }

          return acc;
        }, {});

        setCustomerRequests(nextMap);
      } catch (error) {
        console.error(error);
      } finally {
        if (!silent) {
          setLoadingCustomerRequests(false);
        }
      }
    },
    [mode]
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

  const submitCustomerRequest = async () => {
    if (mode !== 'customer' || !selectedConversation) {
      return;
    }

    if (!requestDraft.description.trim()) {
      toast.error(t('Request description is required.'));
      return;
    }

    try {
      setCreatingRequest(true);

      const response = await api.post('/orders', {
        providerId: selectedConversation.provider.id,
        serviceId: selectedConversation.service?.id || null,
        subject: requestDraft.subject.trim() || selectedServiceLabel,
        description: requestDraft.description.trim(),
      });

      toast.success(t('Request created.'));
      setShowRequestComposer(false);
      setRequestDraft({
        subject: selectedConversation.service?.name || selectedConversation.subject || '',
        description: '',
      });
      setNavRefreshKey((current) => current + 1);
      await refreshCustomerRequests(true);

      navigate(
        response.data?.data?.id
          ? `/customer/orders?requestId=${response.data.data.id}`
          : '/customer/orders'
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to create the request.'));
    } finally {
      setCreatingRequest(false);
    }
  };

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
    if (mode !== 'customer') {
      return;
    }

    void refreshCustomerRequests();
  }, [mode, refreshCustomerRequests]);

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

  useEffect(() => {
    if (mode !== 'customer') {
      return;
    }

    setShowRequestComposer(false);
    setRequestDraft({
      subject: selectedConversation?.service?.name || selectedConversation?.subject || '',
      description: '',
    });
  }, [mode, selectedConversation?.id, selectedConversation?.service?.name, selectedConversation?.subject]);

  const customerLayout =
    mode === 'customer' ? (
      (() => {
        const selectedProviderRating = formatRating(selectedConversation?.provider.averageRating);
        const showRequestPrompt = Boolean(
          selectedConversation && !selectedLinkedRequest && messages.length >= 3
        );
        const originLabel = selectedConversation?.service?.id
          ? t('Service inquiry')
          : t('Provider profile');
        const servicePriceLabel =
          selectedConversation?.service?.price && selectedConversation?.service?.currencyCode
            ? `${selectedConversation.service.price} ${selectedConversation.service.currencyCode}`
            : t('Custom pricing');

        return (
          <div className="flex h-full min-h-screen flex-col bg-slate-50">
            <CustomerWorkspaceTopNav
              currentPage="messages"
              unreadMessagesCount={unreadMessagesCount}
              refreshKey={navRefreshKey}
              variant="v0"
            />

            <div className="flex flex-1 min-h-0">
              <div className="hidden w-[280px] shrink-0 border-r border-slate-200 bg-white md:block">
                <div className="flex h-full flex-col">
                  <div className="space-y-3 border-b border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-950">{t('Messages')}</h2>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={conversationSearch}
                        onChange={(event) => setConversationSearch(event.target.value)}
                        placeholder={t('Search conversations')}
                        className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {creatingConversation ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        {t('Opening the conversation with this provider...')}
                      </div>
                    ) : loadingList ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        {t(LIST_COPY.customer.loadingList)}
                      </div>
                    ) : !conversations.length ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        {t(LIST_COPY.customer.empty)}
                      </div>
                    ) : !filteredConversations.length ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        {t('No matching conversations yet.')}
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredConversations.map((conversation) => {
                          const counterpart = conversation.provider.companyName;
                          const serviceLabel =
                            conversation.service?.name ||
                            conversation.subject ||
                            t('Service conversation');
                          const isSelected = selectedConversationId === conversation.id;

                          return (
                            <button
                              key={conversation.id}
                              type="button"
                              onClick={() => selectConversation(conversation.id)}
                              className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                                isSelected ? 'border-l-2 border-l-blue-600 bg-slate-100' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                  <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-50">
                                    {conversation.provider.avatarUrl ? (
                                      <img
                                        src={conversation.provider.avatarUrl}
                                        alt={counterpart}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-blue-700">
                                        {getInitials(counterpart)}
                                      </div>
                                    )}
                                  </div>
                                  {conversation.unreadCount > 0 ? (
                                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                                  ) : null}
                                </div>

                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <span
                                        className={`truncate text-sm ${
                                          conversation.unreadCount > 0
                                            ? 'font-semibold text-slate-950'
                                            : 'font-medium text-slate-950'
                                        }`}
                                      >
                                        {counterpart}
                                      </span>
                                      {conversation.provider.isVerified ? (
                                        <CheckCircle2 size={14} className="shrink-0 text-blue-600" />
                                      ) : null}
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">
                                      {formatRelativeTime(conversation.lastMessageAt, locale)}
                                    </span>
                                  </div>

                                  {serviceLabel ? (
                                    <p className="truncate text-xs text-blue-700">{serviceLabel}</p>
                                  ) : null}

                                  <p
                                    className={`truncate text-xs ${
                                      conversation.unreadCount > 0
                                        ? 'font-medium text-slate-900'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {conversation.lastMessagePreview || t('No messages yet.')}
                                  </p>
                                </div>

                                {conversation.unreadCount > 0 ? (
                                  <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
                {loadingMessages && selectedConversationId ? (
                  <div className="flex h-full flex-col">
                    <div className="border-b border-slate-200 bg-white px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div
                            key={item}
                            className={`flex ${item % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`animate-pulse rounded-2xl bg-slate-200 ${
                                item % 2 === 0 ? 'h-16 w-48' : 'h-16 w-64'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : !selectedConversation ? (
                  <div className="flex h-full items-center justify-center p-8">
                    <div className="max-w-[420px] text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <MessageSquare size={20} />
                      </div>
                      <div className="mt-4 text-base font-semibold text-slate-950">
                        {t('Select a conversation')}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">
                        {t('Choose a conversation from the list to view messages and continue your discussion.')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-200 bg-white px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-blue-50">
                          {selectedConversation.provider.avatarUrl ? (
                            <img
                              src={selectedConversation.provider.avatarUrl}
                              alt={counterpartName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-blue-700">
                              {getInitials(counterpartName)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-950">{counterpartName}</span>
                            {selectedConversation.provider.isVerified ? (
                              <CheckCircle2 size={16} className="text-blue-600" />
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>
                              {selectedConversation.provider.primaryCategoryName ||
                                t('Professional services')}
                            </span>
                            {selectedProviderRating ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Star size={12} className="fill-amber-500 text-amber-500" />
                                  {selectedProviderRating}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {selectedConversation.service ? (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          {selectedConversation.service.categoryName ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {selectedConversation.service.categoryName}
                            </span>
                          ) : null}
                          <span className="text-sm font-medium text-slate-900">
                            {selectedConversation.service.name}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{servicePriceLabel}</span>
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`flex-1 overflow-y-auto ${isSwitchingConversation ? 'opacity-60' : ''}`}
                    >
                      <div className="space-y-3 px-6 py-4">
                        {!messages.length ? (
                          <div className="psp-empty-state">{t(LIST_COPY.customer.placeholder)}</div>
                        ) : (
                          messages.map((message, index) => {
                            const mine = message.senderRole === 'customer';
                            const showDateDivider =
                              index === 0 ||
                              new Date(message.createdAt).toDateString() !==
                                new Date(messages[index - 1].createdAt).toDateString();

                            return (
                              <div key={message.id}>
                                {showDateDivider ? (
                                  <div className="flex items-center gap-3 py-4">
                                    <div className="h-px flex-1 bg-slate-200" />
                                    <span className="text-xs font-medium text-slate-400">
                                      {t(formatMessageDateDivider(message.createdAt, locale))}
                                    </span>
                                    <div className="h-px flex-1 bg-slate-200" />
                                  </div>
                                ) : null}

                                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                      mine
                                        ? 'rounded-br-md bg-blue-600 text-white'
                                        : 'rounded-bl-md bg-slate-100 text-slate-900'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                                    <p
                                      className={`mt-1 text-[10px] ${
                                        mine ? 'text-white/70' : 'text-slate-500'
                                      }`}
                                    >
                                      {formatMessageTime(message.createdAt, locale)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-200 bg-white px-6 py-4">
                      {selectedLinkedRequest ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/customer/orders?requestId=${selectedLinkedRequest.id}`)}
                          className="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                        >
                          <div className="text-left text-sm">
                            <span className="font-medium text-slate-900">{t('Request Status')}</span>
                            <span className="ml-2 text-slate-500">
                              {t(getRequestStatusLabel(selectedLinkedRequest.status))}
                            </span>
                          </div>
                          <ArrowRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ) : showRequestPrompt ? (
                        <button
                          type="button"
                          onClick={() => setShowRequestComposer(true)}
                          className="group flex w-full items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 transition hover:bg-blue-100"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-blue-700">{t('Ready to proceed?')}</span>
                            <span className="text-slate-500">{t('Request a quote from this provider')}</span>
                          </div>
                          <ArrowRight size={16} className="text-blue-700 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ) : null}

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          disabled
                        >
                          <Paperclip size={16} />
                        </button>

                        <div className="relative flex-1">
                          <textarea
                            rows={1}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={handleDraftKeyDown}
                            placeholder={t('Type your message...')}
                            className="min-h-[44px] max-h-32 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => void sendMessage(false)}
                          disabled={sending || !draft.trim()}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden w-[300px] shrink-0 border-l border-slate-200 bg-white lg:block">
                {!selectedConversation ? (
                  <div className="p-5 text-center text-sm text-slate-500">
                    <MessageSquare size={32} className="mx-auto mb-3 text-slate-300" />
                    <p>{t('Select a conversation to see details')}</p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto p-5">
                    <div className="space-y-4">
                      <section>
                        <h3 className="text-sm font-semibold text-slate-950">{t('Provider')}</h3>
                        <div className="mt-3 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-blue-100">
                              {selectedConversation.provider.avatarUrl ? (
                                <img
                                  src={selectedConversation.provider.avatarUrl}
                                  alt={selectedConversation.provider.companyName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-blue-50 font-medium text-blue-700">
                                  {getInitials(selectedConversation.provider.companyName)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-semibold text-slate-950">
                                  {selectedConversation.provider.companyName}
                                </span>
                                {selectedConversation.provider.isVerified ? (
                                  <CheckCircle2 size={16} className="text-blue-600" />
                                ) : null}
                              </div>
                              <p className="text-sm text-slate-500">
                                {selectedConversation.provider.primaryCategoryName ||
                                  t('Professional services')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <Star size={16} className="fill-amber-500 text-amber-500" />
                              <div className="text-sm">
                                <span className="font-semibold text-slate-900">
                                  {selectedProviderRating || t('N/A')}
                                </span>
                                <span className="ml-1 text-xs text-slate-500">
                                  ({selectedConversation.provider.reviewsCount || 0})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <Clock3 size={16} className="text-slate-400" />
                              <span className="text-sm text-slate-500">
                                {t(formatResponseLabel(selectedConversation.provider.responseTimeMinutes))}
                              </span>
                            </div>
                          </div>

                          <Link
                            to={`/providers/${selectedConversation.provider.id}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            {t('View Full Profile')}
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </section>

                      {selectedConversation.service ? (
                        <>
                          <div className="border-t border-slate-200" />
                          <section>
                            <h3 className="text-sm font-semibold text-slate-950">{t('Service')}</h3>
                            <div className="mt-3 space-y-3">
                              <div className="rounded-lg bg-slate-50 px-3 py-3">
                                {selectedConversation.service.categoryName ? (
                                  <div className="mb-2">
                                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-normal text-slate-600">
                                      {selectedConversation.service.categoryName}
                                    </span>
                                  </div>
                                ) : null}
                                <p className="font-medium text-slate-950">
                                  {selectedConversation.service.name}
                                </p>
                                <div className="mt-1 text-sm text-slate-500">{servicePriceLabel}</div>
                              </div>
                            </div>
                          </section>
                        </>
                      ) : null}

                      <div className="border-t border-slate-200" />

                      <section>
                        <h3 className="text-sm font-semibold text-slate-950">
                          {selectedLinkedRequest ? t('Request Status') : t('Next Step')}
                        </h3>
                        <div className="mt-3 space-y-3">
                          {loadingCustomerRequests ? (
                            <div className="text-sm text-slate-500">{t('Loading requests...')}</div>
                          ) : selectedLinkedRequest ? (
                            <>
                              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
                                <FileText size={18} className="text-blue-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-950">
                                    {selectedLinkedRequest.subject || t('Service request')}
                                  </p>
                                  <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                    {t(getRequestStatusLabel(selectedLinkedRequest.status))}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/customer/orders?requestId=${selectedLinkedRequest.id}`)
                                }
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                {t('View Request')}
                                <ArrowRight size={14} />
                              </button>
                            </>
                          ) : showRequestComposer ? (
                            <div className="space-y-3">
                              <input
                                value={requestDraft.subject}
                                onChange={(event) =>
                                  setRequestDraft((current) => ({
                                    ...current,
                                    subject: event.target.value,
                                  }))
                                }
                                placeholder={t('Request title')}
                                className="psp-input"
                              />
                              <textarea
                                rows={5}
                                value={requestDraft.description}
                                onChange={(event) =>
                                  setRequestDraft((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                placeholder={t('Describe what you need')}
                                className="psp-textarea min-h-[150px]"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => void submitCustomerRequest()}
                                  disabled={creatingRequest}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {t(creatingRequest ? 'Creating request...' : 'Create Request')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowRequestComposer(false)}
                                  className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  {t('Cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3">
                                <ArrowRight size={18} className="mt-0.5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-slate-950">
                                    {t('No request created yet')}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {t('When you are ready, create a formal request to get a quote from this provider.')}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowRequestComposer(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                              >
                                {t('Create Request')}
                                <ArrowRight size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </section>

                      <div className="border-t border-slate-200" />

                      <section>
                        <h3 className="text-sm font-semibold text-slate-950">{t('Conversation')}</h3>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{t('Started from')}</span>
                            <span className="text-slate-900">{originLabel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{t('Last activity')}</span>
                            <span className="text-slate-900">
                              {formatMessageTime(selectedConversation.lastMessageAt, locale)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{t('Messages')}</span>
                            <span className="text-slate-900">{messages.length}</span>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()
    ) : null;

  if (customerLayout) {
    return customerLayout;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ProviderWorkspaceTopNav
        currentPage="messages"
        unreadMessagesCount={unreadMessagesCount}
        refreshKey={navRefreshKey}
        fluid
      />

      <div className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {t('Commercial inbox')}
            </div>
            <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950 sm:text-[36px]">
              {t('Reply faster with clearer context and stronger commercial quality.')}
            </h2>
            <div className="mt-3 max-w-[760px] text-sm leading-7 text-slate-600">
              {t(
                'Keep customer identity, service context, unread activity, and AI-assisted draft support in one continuous provider workspace.'
              )}
            </div>
          </div>

          <div className="grid min-w-[320px] gap-3 sm:grid-cols-3">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t(card.label)}
                </div>
                <div className="mt-2 text-[24px] font-semibold text-slate-950">{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <aside className="psp-surface xl:sticky xl:top-24 xl:self-start">
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
                              {counterpart || t('Conversation')}
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
                          {t('Verified')}
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
      </div>
    </div>
  );
};

export default ConversationWorkspace;
