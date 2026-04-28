export interface Provider {
  id: string
  name: string
  avatar: string
  profession: string
  verified: boolean
  rating: number
  reviewCount: number
  responseTime: string
}

export interface Service {
  id: string
  name: string
  category: string
  startingPrice: number
  pricingModel: "fixed" | "hourly" | "quote"
}

export interface Message {
  id: string
  senderId: string
  senderType: "customer" | "provider"
  content: string
  timestamp: Date
  read: boolean
}

export interface Conversation {
  id: string
  provider: Provider
  service?: Service
  messages: Message[]
  unreadCount: number
  lastActivity: Date
  status: "active" | "pending" | "closed"
  hasLinkedRequest: boolean
  linkedRequestId?: string
  linkedRequestStatus?: "draft" | "pending" | "accepted" | "completed"
  origin: "provider_page" | "story_reply" | "service_intent" | "explore"
}

export interface ConversationListItem {
  id: string
  provider: Provider
  service?: Service
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  status: "active" | "pending" | "closed"
}
