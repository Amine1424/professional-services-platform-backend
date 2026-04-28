"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { InboxRail } from "@/components/messages/inbox-rail"
import { ThreadArea } from "@/components/messages/thread-area"
import { ContextRail } from "@/components/messages/context-rail"
import { AppTopNav } from "@/components/app-top-nav"
import type { Conversation, ConversationListItem } from "@/components/messages/types"

// Mock data - would be replaced with actual API calls
const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    provider: {
      id: "p-1",
      name: "Amira Benali",
      avatar: "",
      profession: "Interior Designer",
      verified: true,
      rating: 4.9,
      reviewCount: 127,
      responseTime: "< 1 hour",
    },
    service: {
      id: "s-1",
      name: "Full Home Interior Design",
      category: "Interior Design",
      startingPrice: 2500,
      pricingModel: "fixed",
    },
    messages: [
      {
        id: "m-1",
        senderId: "p-1",
        senderType: "provider",
        content:
          "Hello! Thank you for reaching out about your home interior project. I would love to learn more about your vision.",
        timestamp: new Date(Date.now() - 86400000 * 2),
        read: true,
      },
      {
        id: "m-2",
        senderId: "c-1",
        senderType: "customer",
        content:
          "Hi Amira! We just bought a new apartment in Algiers and we are looking to completely redesign the living room and bedroom. We prefer a modern minimalist style.",
        timestamp: new Date(Date.now() - 86400000 * 2 + 3600000),
        read: true,
      },
      {
        id: "m-3",
        senderId: "p-1",
        senderType: "provider",
        content:
          "That sounds wonderful! Modern minimalist is one of my specialties. Could you share the approximate size of each room and any specific requirements you have in mind?",
        timestamp: new Date(Date.now() - 86400000),
        read: true,
      },
      {
        id: "m-4",
        senderId: "c-1",
        senderType: "customer",
        content:
          "The living room is about 35 square meters and the bedroom is 20 square meters. We need plenty of storage solutions but want to keep the space feeling open and airy.",
        timestamp: new Date(Date.now() - 3600000 * 5),
        read: true,
      },
      {
        id: "m-5",
        senderId: "p-1",
        senderType: "provider",
        content:
          "Perfect! I have some great ideas for hidden storage that maintains that minimalist aesthetic. When would you be available for an initial consultation? I could visit the space to better understand the layout and lighting.",
        timestamp: new Date(Date.now() - 3600000 * 2),
        read: false,
      },
    ],
    unreadCount: 1,
    lastActivity: new Date(Date.now() - 3600000 * 2),
    status: "active",
    hasLinkedRequest: false,
    origin: "service_intent",
  },
  {
    id: "conv-2",
    provider: {
      id: "p-2",
      name: "Karim Hadj",
      avatar: "",
      profession: "Electrician",
      verified: true,
      rating: 4.8,
      reviewCount: 89,
      responseTime: "< 2 hours",
    },
    service: {
      id: "s-2",
      name: "Electrical Installation",
      category: "Electrical",
      startingPrice: 500,
      pricingModel: "quote",
    },
    messages: [
      {
        id: "m-6",
        senderId: "c-1",
        senderType: "customer",
        content:
          "Hi, I need to rewire my kitchen for some new appliances. Can you help?",
        timestamp: new Date(Date.now() - 86400000 * 5),
        read: true,
      },
      {
        id: "m-7",
        senderId: "p-2",
        senderType: "provider",
        content:
          "Hello! Yes, I can definitely help with that. What appliances are you planning to install?",
        timestamp: new Date(Date.now() - 86400000 * 5 + 7200000),
        read: true,
      },
      {
        id: "m-8",
        senderId: "c-1",
        senderType: "customer",
        content:
          "A new oven, dishwasher, and an additional refrigerator for a pantry area.",
        timestamp: new Date(Date.now() - 86400000 * 4),
        read: true,
      },
    ],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 86400000 * 4),
    status: "active",
    hasLinkedRequest: true,
    linkedRequestId: "req-12345678",
    linkedRequestStatus: "pending",
    origin: "provider_page",
  },
  {
    id: "conv-3",
    provider: {
      id: "p-3",
      name: "Sara Meziane",
      avatar: "",
      profession: "House Cleaner",
      verified: false,
      rating: 4.6,
      reviewCount: 45,
      responseTime: "< 3 hours",
    },
    messages: [
      {
        id: "m-9",
        senderId: "p-3",
        senderType: "provider",
        content:
          "Thank you for your interest! I would be happy to provide weekly cleaning services.",
        timestamp: new Date(Date.now() - 86400000 * 7),
        read: true,
      },
    ],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 86400000 * 7),
    status: "active",
    hasLinkedRequest: false,
    origin: "explore",
  },
]

function getConversationListItems(
  conversations: Conversation[]
): ConversationListItem[] {
  return conversations.map((conv) => ({
    id: conv.id,
    provider: conv.provider,
    service: conv.service,
    lastMessage: conv.messages[conv.messages.length - 1]?.content || "",
    lastMessageTime: conv.lastActivity,
    unreadCount: conv.unreadCount,
    status: conv.status,
  }))
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId")
  const providerId = searchParams.get("providerId")
  const serviceId = searchParams.get("serviceId")

  const [conversations] = useState<Conversation[]>(mockConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Handle deep-link params
  useEffect(() => {
    setIsLoading(true)

    // Simulate loading delay
    const timer = setTimeout(() => {
      if (conversationId) {
        // Direct conversation link
        const exists = conversations.find((c) => c.id === conversationId)
        if (exists) {
          setSelectedId(conversationId)
        }
      } else if (providerId) {
        // Find or create conversation with provider
        const existing = conversations.find((c) => c.provider.id === providerId)
        if (existing) {
          setSelectedId(existing.id)
        }
        // In real app, would create new conversation if not found
      } else if (conversations.length > 0) {
        // Default to first conversation with unread, or just first
        const unread = conversations.find((c) => c.unreadCount > 0)
        setSelectedId(unread?.id || conversations[0].id)
      }
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [conversationId, providerId, serviceId, conversations])

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null
  const listItems = getConversationListItems(conversations)

  const handleSelectConversation = useCallback(
    (id: string) => {
      setSelectedId(id)
      // Update URL without full navigation
      const params = new URLSearchParams()
      params.set("conversationId", id)
      router.replace(`/customer/messages?${params.toString()}`, { scroll: false })
    },
    [router]
  )

  const handleSendMessage = useCallback((content: string) => {
    // In real app, would send to API
    console.log("[v0] Sending message:", content)
  }, [])

  const handleRequestQuote = useCallback(() => {
    if (selectedConversation) {
      router.push(
        `/customer/requests/new?providerId=${selectedConversation.provider.id}${
          selectedConversation.service
            ? `&serviceId=${selectedConversation.service.id}`
            : ""
        }&conversationId=${selectedConversation.id}`
      )
    }
  }, [router, selectedConversation])

  const handleViewProfile = useCallback(() => {
    if (selectedConversation) {
      router.push(`/provider/${selectedConversation.provider.id}`)
    }
  }, [router, selectedConversation])

  const handleViewService = useCallback(() => {
    if (selectedConversation?.service) {
      router.push(`/services/${selectedConversation.service.id}`)
    }
  }, [router, selectedConversation])

  const handleViewRequest = useCallback(() => {
    if (selectedConversation?.linkedRequestId) {
      router.push(`/customer/requests/${selectedConversation.linkedRequestId}`)
    }
  }, [router, selectedConversation])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <AppTopNav unreadMessages={1} activeRequests={3} />
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Inbox Rail - 280px fixed width */}
      <div className="w-[280px] shrink-0 hidden md:block">
          <InboxRail
            conversations={listItems}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            isLoading={isLoading}
          />
        </div>

        {/* Thread Area - flexible */}
        <div className="flex-1 min-w-0">
          <ThreadArea
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            onRequestQuote={handleRequestQuote}
            isLoading={isLoading && !!selectedId}
          />
        </div>

        {/* Context Rail - 300px fixed width */}
        <div className="w-[300px] shrink-0 hidden lg:block">
          <ContextRail
            conversation={selectedConversation}
            onViewProfile={handleViewProfile}
            onViewService={handleViewService}
            onCreateRequest={handleRequestQuote}
            onViewRequest={handleViewRequest}
          />
        </div>
      </div>
    </div>
  )
}
