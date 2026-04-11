import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../config/api';
import '../../styles/conversation-workspace.css';

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

const REFRESH_INTERVAL_MS = 12000;

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
    title: 'محادثاتك',
    empty: 'لا توجد محادثات بعد. ابدأ مراسلة مزود من صفحته العامة.',
    placeholder: 'ابدأ أول رسالة الآن.',
    composePlaceholder: 'اكتب رسالتك هنا...',
    loadingList: 'جارٍ تحميل المحادثات...',
    loadingMessages: 'جارٍ تحميل الرسائل...',
    pickConversation: 'اختر محادثة من القائمة الجانبية.',
  },
  provider: {
    title: 'Inbox المزود',
    empty: 'لا توجد محادثات واردة حتى الآن.',
    placeholder: 'لا توجد رسائل في هذه المحادثة بعد.',
    composePlaceholder: 'اكتب ردك على العميل...',
    loadingList: 'جارٍ تحميل الـ inbox...',
    loadingMessages: 'جارٍ تحميل الرسائل...',
    pickConversation: 'اختر محادثة لعرض التفاصيل والرد.',
  },
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return 'الآن';

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (minutes < 60) {
    return `منذ ${minutes} د`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `منذ ${hours} س`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `منذ ${days} يوم`;
  }

  return new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const formatMessageTime = (value?: string | null) => {
  if (!value) return '';

  return new Intl.DateTimeFormat('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
};

const getInitials = (value: string) => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase();
};

export const ConversationWorkspace: React.FC<ConversationWorkspaceProps> = ({ mode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const bootstrappedConversationRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation =
    conversations.find((item) => item.id === selectedConversationId) || null;

  const counterpartName =
    mode === 'customer'
      ? selectedConversation?.provider.companyName || 'المزود'
      : `${selectedConversation?.customer.firstName || ''} ${selectedConversation?.customer.lastName || ''}`.trim() ||
        'العميل';

  const counterpartAvatar =
    mode === 'customer' ? selectedConversation?.provider.avatarUrl : null;

  const refreshConversations = useCallback(
    async (options?: { preferredId?: string | null; silent?: boolean; suppressError?: boolean }) => {
      const { preferredId, silent = false, suppressError = false } = options || {};

      try {
        if (!silent) {
          setLoadingList(true);
        }

        const response = await api.get('/messages/conversations');
        const items = Array.isArray(response.data?.data) ? response.data.data : [];

        setConversations(items);
        setSelectedConversationId((current) => {
          const requested = preferredId || current;

          if (requested && items.some((item: ConversationListItem) => item.id === requested)) {
            return requested;
          }

          return items[0]?.id || null;
        });
      } catch (error) {
        if (!suppressError) {
          console.error(error);
          toast.error('فشل تحميل المحادثات');
        }
      } finally {
        if (!silent) {
          setLoadingList(false);
        }
      }
    },
    []
  );

  const refreshMessages = useCallback(
    async (conversationId: string, options?: { silent?: boolean; suppressError?: boolean }) => {
      const { silent = false, suppressError = false } = options || {};

      try {
        if (!silent) {
          setLoadingMessages(true);
        }

        const response = await api.get(`/messages/conversations/${conversationId}/messages`);
        setMessages(Array.isArray(response.data?.data?.messages) ? response.data.data.messages : []);

        await api.post(`/messages/conversations/${conversationId}/read`);
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
          toast.error('فشل تحميل الرسائل');
        }
      } finally {
        if (!silent) {
          setLoadingMessages(false);
        }
      }
    },
    []
  );

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
        setSelectedConversationId(conversation.id);
        await refreshConversations({
          preferredId: conversation.id,
          silent: true,
        });
        await refreshMessages(conversation.id, {
          silent: true,
        });
      }
    } catch (error: any) {
      bootstrappedConversationRef.current = null;
      toast.error(error.response?.data?.message || 'فشل فتح المحادثة');
    } finally {
      setCreatingConversation(false);
    }
  }, [mode, providerId, refreshConversations, refreshMessages, serviceId]);

  const sendMessage = async (useAiAssisted = false) => {
    if (!selectedConversationId || !draft.trim()) {
      return;
    }

    try {
      setSending(true);

      await api.post(`/messages/conversations/${selectedConversationId}/messages`, {
        body: draft.trim(),
        isAiAssisted: useAiAssisted,
      });

      setDraft('');
      setAiPreview(null);

      await Promise.all([
        refreshMessages(selectedConversationId, { silent: true }),
        refreshConversations({
          preferredId: selectedConversationId,
          silent: true,
        }),
      ]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل إرسال الرسالة');
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
      toast.error(error.response?.data?.message || 'فشل توليد اقتراح الرد');
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
    void refreshConversations({
      preferredId: conversationIdParam,
    });
  }, [conversationIdParam, refreshConversations]);

  useEffect(() => {
    if (conversationIdParam && conversationIdParam !== selectedConversationId) {
      setSelectedConversationId(conversationIdParam);
    }
  }, [conversationIdParam, selectedConversationId]);

  useEffect(() => {
    if (mode !== 'customer' || !providerId) {
      return;
    }

    const bootstrapKey = `${providerId}:${serviceId || ''}`;
    if (bootstrappedConversationRef.current === bootstrapKey) {
      return;
    }

    bootstrappedConversationRef.current = bootstrapKey;
    void openConversationFromProfile();
  }, [mode, openConversationFromProfile, providerId, serviceId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setAiPreview(null);
    void refreshMessages(selectedConversationId);
  }, [refreshMessages, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('providerId');
    nextParams.delete('serviceId');
    nextParams.set('conversationId', selectedConversationId);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, selectedConversationId, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      void refreshConversations({
        preferredId: selectedConversationId,
        silent: true,
        suppressError: true,
      });

      if (selectedConversationId) {
        void refreshMessages(selectedConversationId, {
          silent: true,
          suppressError: true,
        });
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshConversations, refreshMessages, selectedConversationId]);

  return (
    <div
      className={`psp-chat-layout ${mode === 'provider' ? 'psp-chat-layout--with-aside' : ''}`}
    >
      <section className="psp-chat-panel psp-chat-sidebar">
        <div className="psp-chat-panel__header">
          <div>
            <div className="psp-chat-eyebrow">Messaging</div>
            <h2>{LIST_COPY[mode].title}</h2>
          </div>
          <div className="psp-chat-chip">
            {conversations.length} {conversations.length === 1 ? 'محادثة' : 'محادثات'}
          </div>
        </div>

        {creatingConversation ? (
          <div className="psp-chat-empty">جارٍ فتح المحادثة مع المزود...</div>
        ) : loadingList ? (
          <div className="psp-chat-empty">{LIST_COPY[mode].loadingList}</div>
        ) : !conversations.length ? (
          <div className="psp-chat-empty">{LIST_COPY[mode].empty}</div>
        ) : (
          <div className="psp-chat-conversation-list">
            {conversations.map((conversation) => {
              const counterpart =
                mode === 'customer'
                  ? conversation.provider.companyName
                  : `${conversation.customer.firstName} ${conversation.customer.lastName}`.trim();

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`psp-chat-conversation-card ${
                    selectedConversationId === conversation.id
                      ? 'psp-chat-conversation-card--active'
                      : ''
                  }`}
                >
                  <div className="psp-chat-conversation-card__top">
                    <div className="psp-chat-avatar psp-chat-avatar--sm">
                      {mode === 'customer' && conversation.provider.avatarUrl ? (
                        <img src={conversation.provider.avatarUrl} alt={counterpart} />
                      ) : (
                        <span>{getInitials(counterpart || 'PS')}</span>
                      )}
                    </div>

                    <div className="psp-chat-conversation-card__meta">
                      <div className="psp-chat-conversation-card__title-row">
                        <strong>{counterpart || 'محادثة'}</strong>
                        <span>{formatRelativeTime(conversation.lastMessageAt)}</span>
                      </div>

                      <div className="psp-chat-conversation-card__sub">
                        {conversation.service?.name || conversation.subject || 'محادثة خدمة'}
                      </div>
                    </div>
                  </div>

                  <div className="psp-chat-conversation-card__bottom">
                    <p>{conversation.lastMessagePreview || 'لا توجد رسائل بعد.'}</p>

                    <div className="psp-chat-conversation-card__badges">
                      {conversation.provider.profileBadgeText ? (
                        <span className="psp-chat-soft-badge">
                          {conversation.provider.profileBadgeText}
                        </span>
                      ) : null}

                      {conversation.unreadCount > 0 ? (
                        <span className="psp-chat-unread-badge">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="psp-chat-panel psp-chat-thread">
        <div className="psp-chat-panel__header psp-chat-panel__header--thread">
          {selectedConversation ? (
            <>
              <div className="psp-chat-thread__identity">
                <div className="psp-chat-avatar">
                  {counterpartAvatar ? (
                    <img src={counterpartAvatar} alt={counterpartName} />
                  ) : (
                    <span>{getInitials(counterpartName)}</span>
                  )}
                </div>

                <div>
                  <h2>{counterpartName}</h2>
                  <div className="psp-chat-thread__meta">
                    <span>
                      {selectedConversation.service?.name ||
                        selectedConversation.subject ||
                        'محادثة عامة'}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(selectedConversation.lastMessageAt)}</span>
                    {mode === 'customer' && selectedConversation.provider.isVerified ? (
                      <>
                        <span>•</span>
                        <span>Verified</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="psp-chat-thread__actions">
                {selectedConversation.status ? (
                  <span className="psp-chat-chip">{selectedConversation.status}</span>
                ) : null}

                {selectedConversation.unreadCount > 0 ? (
                  <span className="psp-chat-chip psp-chat-chip--accent">
                    {selectedConversation.unreadCount} غير مقروءة
                  </span>
                ) : null}
              </div>
            </>
          ) : (
            <div>
              <div className="psp-chat-eyebrow">Workspace</div>
              <h2>اختر محادثة</h2>
            </div>
          )}
        </div>

        {!selectedConversationId ? (
          <div className="psp-chat-empty psp-chat-empty--thread">
            {LIST_COPY[mode].pickConversation}
          </div>
        ) : loadingMessages ? (
          <div className="psp-chat-empty psp-chat-empty--thread">
            {LIST_COPY[mode].loadingMessages}
          </div>
        ) : (
          <>
            <div className="psp-chat-message-stream">
              {!messages.length ? (
                <div className="psp-chat-empty psp-chat-empty--thread">
                  {LIST_COPY[mode].placeholder}
                </div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.senderRole === (mode === 'customer' ? 'customer' : 'service_provider');

                  return (
                    <div
                      key={message.id}
                      className={`psp-chat-message-row ${
                        mine ? 'psp-chat-message-row--mine' : ''
                      }`}
                    >
                      <div
                        className={`psp-chat-message-bubble ${
                          mine ? 'psp-chat-message-bubble--mine' : ''
                        }`}
                      >
                        <div className="psp-chat-message-bubble__top">
                          <span>{message.senderName}</span>
                          {message.isAiAssisted ? (
                            <span className="psp-chat-soft-badge">AI</span>
                          ) : null}
                        </div>

                        <div className="psp-chat-message-bubble__body">{message.body}</div>
                        <div className="psp-chat-message-bubble__time">
                          {formatMessageTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="psp-chat-compose">
              <textarea
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                placeholder={LIST_COPY[mode].composePlaceholder}
              />

              <div className="psp-chat-compose__actions">
                <span className="psp-chat-compose__hint">Enter للإرسال • Shift+Enter لسطر جديد</span>

                <div className="psp-chat-compose__buttons">
                  {mode === 'provider' ? (
                    <button
                      type="button"
                      onClick={generateAiReply}
                      disabled={generatingAi || !selectedConversationId}
                      className="psp-chat-button psp-chat-button--ghost"
                    >
                      {generatingAi ? 'جارٍ التحضير...' : 'اقتراح AI'}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void sendMessage(mode === 'provider' && Boolean(aiPreview))}
                    disabled={sending || !draft.trim()}
                    className="psp-chat-button psp-chat-button--primary"
                  >
                    {sending ? 'جارٍ الإرسال...' : 'إرسال'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {mode === 'provider' ? (
        <aside className="psp-chat-panel psp-chat-aside">
          <div className="psp-chat-panel__header">
            <div>
              <div className="psp-chat-eyebrow">Provider Copilot</div>
              <h2>AI Assistant</h2>
            </div>
            <div className="psp-chat-chip">Reply helper</div>
          </div>

          {!selectedConversationId ? (
            <div className="psp-chat-empty">
              اختر محادثة أولاً ليتم اقتراح رد ذكي مبني على خدماتك.
            </div>
          ) : !aiPreview ? (
            <div className="psp-chat-empty">
              اضغط على <strong>اقتراح AI</strong> للحصول على رد أولي سريع يمكنك تعديله قبل
              الإرسال.
            </div>
          ) : (
            <div className="psp-chat-ai">
              <div className="psp-chat-ai__section">
                <div className="psp-chat-ai__title">الخدمات الأقرب</div>

                {!aiPreview.matchedServices.length ? (
                  <div className="psp-chat-ai__empty">
                    لم يتم العثور على خدمة مطابقة مباشرة، لكن الرد المقترح ما زال متاحاً.
                  </div>
                ) : (
                  <div className="psp-chat-ai__services">
                    {aiPreview.matchedServices.map((service) => (
                      <div key={service.id} className="psp-chat-ai__service-card">
                        <strong>{service.name}</strong>
                        <span>
                          {service.price && service.currencyCode
                            ? `${service.price} ${service.currencyCode}`
                            : 'السعر حسب الطلب'}
                        </span>
                        {service.showPromoBadge && service.promoBadgeText ? (
                          <span className="psp-chat-soft-badge">{service.promoBadgeText}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="psp-chat-ai__section">
                <div className="psp-chat-ai__title">الرد المقترح</div>
                <div className="psp-chat-ai__reply">{aiPreview.reply}</div>
              </div>

              <button
                type="button"
                onClick={() => void sendMessage(true)}
                disabled={sending || !draft.trim()}
                className="psp-chat-button psp-chat-button--primary psp-chat-button--wide"
              >
                إرسال الرد المقترح
              </button>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
};

export default ConversationWorkspace;
