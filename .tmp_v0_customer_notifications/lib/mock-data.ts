// Notification types and data
export type NotificationType = 
  | "message" 
  | "request" 
  | "comment" 
  | "favorite_provider_update" 
  | "system"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  timestamp: string
  isRead: boolean
  isUrgent?: boolean
  deepLink: {
    href: string
    label: string
  }
  actor?: {
    name: string
    avatar?: string
  }
  metadata?: {
    requestId?: string
    providerId?: string
    conversationId?: string
  }
}

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    type: "request",
    title: "Quote received",
    body: "CleanPro Algeria sent a quote for your apartment deep cleaning request: 15,000 DZD",
    timestamp: "2026-04-20T10:30:00Z",
    isRead: false,
    isUrgent: true,
    deepLink: {
      href: "/orders?id=323fb439-382a-4eb9-9ecc-6c62400c43c0",
      label: "Review Quote"
    },
    actor: {
      name: "CleanPro Algeria"
    },
    metadata: {
      requestId: "323fb439-382a-4eb9-9ecc-6c62400c43c0",
      providerId: "prov-001"
    }
  },
  {
    id: "notif-002",
    type: "message",
    title: "New message",
    body: "FastFix Plumbing: Work is progressing well. Should be done by tomorrow afternoon.",
    timestamp: "2026-04-20T09:15:00Z",
    isRead: false,
    deepLink: {
      href: "/messages?conversation=conv-002",
      label: "View Message"
    },
    actor: {
      name: "FastFix Plumbing"
    },
    metadata: {
      conversationId: "conv-002",
      providerId: "prov-002"
    }
  },
  {
    id: "notif-003",
    type: "favorite_provider_update",
    title: "Provider now available",
    body: "Elite Electrical is accepting new requests in your area",
    timestamp: "2026-04-20T08:00:00Z",
    isRead: false,
    deepLink: {
      href: "/providers/prov-006",
      label: "View Profile"
    },
    actor: {
      name: "Elite Electrical"
    },
    metadata: {
      providerId: "prov-006"
    }
  },
  {
    id: "notif-004",
    type: "request",
    title: "Work completed",
    body: "Green Thumb Gardens marked your garden landscaping request as completed",
    timestamp: "2026-04-19T17:30:00Z",
    isRead: true,
    deepLink: {
      href: "/orders?id=c3d4e5f6-7890-12cd-ef01-3456789012cd",
      label: "Leave Review"
    },
    actor: {
      name: "Green Thumb Gardens"
    },
    metadata: {
      requestId: "c3d4e5f6-7890-12cd-ef01-3456789012cd",
      providerId: "prov-004"
    }
  },
  {
    id: "notif-005",
    type: "message",
    title: "New message",
    body: "CoolAir Services: Thank you for your request. We are reviewing the details.",
    timestamp: "2026-04-19T17:30:00Z",
    isRead: true,
    deepLink: {
      href: "/messages?conversation=conv-003",
      label: "View Message"
    },
    actor: {
      name: "CoolAir Services"
    },
    metadata: {
      conversationId: "conv-003",
      providerId: "prov-003"
    }
  },
  {
    id: "notif-006",
    type: "comment",
    title: "Review response",
    body: "Green Thumb Gardens responded to your review: Thank you for your kind words!",
    timestamp: "2026-04-19T14:00:00Z",
    isRead: true,
    deepLink: {
      href: "/reviews?id=review-001",
      label: "View Response"
    },
    actor: {
      name: "Green Thumb Gardens"
    },
    metadata: {
      providerId: "prov-004"
    }
  },
  {
    id: "notif-007",
    type: "system",
    title: "Profile incomplete",
    body: "Add your phone number to receive SMS updates about your requests",
    timestamp: "2026-04-18T10:00:00Z",
    isRead: true,
    deepLink: {
      href: "/settings/profile",
      label: "Complete Profile"
    }
  },
  {
    id: "notif-008",
    type: "favorite_provider_update",
    title: "New service added",
    body: "Master Painters DZ now offers wallpaper installation services",
    timestamp: "2026-04-17T16:00:00Z",
    isRead: true,
    deepLink: {
      href: "/providers/prov-008",
      label: "View Services"
    },
    actor: {
      name: "Master Painters DZ"
    },
    metadata: {
      providerId: "prov-008"
    }
  },
  {
    id: "notif-009",
    type: "request",
    title: "Request cancelled",
    body: "Your electrical inspection request was cancelled",
    timestamp: "2026-04-08T10:00:00Z",
    isRead: true,
    deepLink: {
      href: "/orders?id=d4e5f6g7-8901-23de-f012-4567890123de",
      label: "View Details"
    },
    metadata: {
      requestId: "d4e5f6g7-8901-23de-f012-4567890123de"
    }
  },
  {
    id: "notif-010",
    type: "system",
    title: "Welcome to the platform",
    body: "Start by exploring providers in your area or posting a service request",
    timestamp: "2026-03-15T09:00:00Z",
    isRead: true,
    deepLink: {
      href: "/explore",
      label: "Explore Providers"
    }
  }
]

export type RequestStatus = 
  | "pending_quote" 
  | "quote_received" 
  | "in_progress" 
  | "completed" 
  | "cancelled"

export type LifecycleEvent = {
  id: string
  type: "created" | "quote_sent" | "message" | "status_change" | "note_added"
  description: string
  timestamp: string
  actor?: string
}

export type ServiceRequest = {
  id: string
  title: string
  category: string
  description: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  provider: {
    id: string
    name: string
    avatar?: string
    isVerified: boolean
    rating: number
    responseTime: string
  }
  quote?: {
    amount: number
    currency: string
    validUntil: string
    notes?: string
    breakdown?: {
      label: string
      amount: number
    }[]
  }
  providerResponse?: string
  customerNote?: string
  conversationId?: string
  lifecycle: LifecycleEvent[]
}

// Favorites/Shortlist types and data
export type FavoriteProvider = {
  id: string
  name: string
  avatar?: string
  isVerified: boolean
  rating: number
  reviewCount: number
  responseTime: string
  location: string
  category: string
  specialties: string[]
  savedAt: string
  lastActive?: string
  completedJobs?: number
}

export const mockFavorites: FavoriteProvider[] = [
  {
    id: "prov-001",
    name: "CleanPro Algeria",
    avatar: undefined,
    isVerified: true,
    rating: 4.8,
    reviewCount: 127,
    responseTime: "< 2 hours",
    location: "Algiers, Hydra",
    category: "Cleaning Services",
    specialties: ["Deep Cleaning", "Office Cleaning", "Move-out Cleaning"],
    savedAt: "2026-04-10T14:30:00Z",
    lastActive: "2026-04-19T09:00:00Z",
    completedJobs: 342
  },
  {
    id: "prov-002",
    name: "FastFix Plumbing",
    avatar: undefined,
    isVerified: true,
    rating: 4.6,
    reviewCount: 89,
    responseTime: "< 1 hour",
    location: "Algiers, Bab Ezzouar",
    category: "Plumbing",
    specialties: ["Emergency Repairs", "Installation", "Maintenance"],
    savedAt: "2026-04-08T11:15:00Z",
    lastActive: "2026-04-20T08:30:00Z",
    completedJobs: 215
  },
  {
    id: "prov-004",
    name: "Green Thumb Gardens",
    avatar: undefined,
    isVerified: true,
    rating: 4.9,
    reviewCount: 56,
    responseTime: "< 3 hours",
    location: "Algiers, El Biar",
    category: "Landscaping",
    specialties: ["Garden Design", "Native Plants", "Maintenance"],
    savedAt: "2026-03-20T09:45:00Z",
    lastActive: "2026-04-18T16:00:00Z",
    completedJobs: 128
  },
  {
    id: "prov-006",
    name: "Elite Electrical",
    avatar: undefined,
    isVerified: true,
    rating: 4.7,
    reviewCount: 203,
    responseTime: "< 2 hours",
    location: "Oran, Centre",
    category: "Electrical",
    specialties: ["Installations", "Smart Home", "Safety Inspections"],
    savedAt: "2026-04-15T16:20:00Z",
    lastActive: "2026-04-19T14:00:00Z",
    completedJobs: 478
  },
  {
    id: "prov-007",
    name: "Comfort HVAC Solutions",
    avatar: undefined,
    isVerified: false,
    rating: 4.3,
    reviewCount: 34,
    responseTime: "< 4 hours",
    location: "Algiers, Kouba",
    category: "HVAC",
    specialties: ["AC Installation", "Heating Systems", "Duct Cleaning"],
    savedAt: "2026-04-12T08:00:00Z",
    lastActive: "2026-04-17T11:30:00Z",
    completedJobs: 67
  },
  {
    id: "prov-008",
    name: "Master Painters DZ",
    avatar: undefined,
    isVerified: true,
    rating: 4.5,
    reviewCount: 78,
    responseTime: "< 3 hours",
    location: "Constantine",
    category: "Painting",
    specialties: ["Interior", "Exterior", "Decorative Finishes"],
    savedAt: "2026-04-05T13:00:00Z",
    lastActive: "2026-04-16T10:00:00Z",
    completedJobs: 156
  }
]

export const mockRequests: ServiceRequest[] = [
  {
    id: "323fb439-382a-4eb9-9ecc-6c62400c43c0",
    title: "Apartment Deep Cleaning",
    category: "Cleaning Services",
    description: "Full deep cleaning for a 3-bedroom apartment including kitchen appliances, bathroom tiles, and window cleaning.",
    status: "quote_received",
    createdAt: "2026-04-15T10:30:00Z",
    updatedAt: "2026-04-18T14:20:00Z",
    provider: {
      id: "prov-001",
      name: "CleanPro Algeria",
      avatar: undefined,
      isVerified: true,
      rating: 4.8,
      responseTime: "< 2 hours"
    },
    quote: {
      amount: 15000,
      currency: "DZD",
      validUntil: "2026-04-25T23:59:59Z",
      notes: "Includes all cleaning supplies. Available this weekend or next week Tuesday.",
      breakdown: [
        { label: "Basic cleaning", amount: 8000 },
        { label: "Deep kitchen cleaning", amount: 4000 },
        { label: "Window cleaning", amount: 3000 }
      ]
    },
    providerResponse: "We can accommodate your request. Our team specializes in deep cleaning for apartments. We use eco-friendly products and can bring all necessary equipment.",
    customerNote: "Prefer weekend scheduling if possible",
    conversationId: "conv-001",
    lifecycle: [
      { id: "evt-1", type: "created", description: "Request submitted", timestamp: "2026-04-15T10:30:00Z" },
      { id: "evt-2", type: "message", description: "Provider responded to your inquiry", timestamp: "2026-04-16T09:15:00Z", actor: "CleanPro Algeria" },
      { id: "evt-3", type: "quote_sent", description: "Quote received: 15,000 DZD", timestamp: "2026-04-18T14:20:00Z", actor: "CleanPro Algeria" }
    ]
  },
  {
    id: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    title: "Home Plumbing Repair",
    category: "Plumbing",
    description: "Fix leaking kitchen sink and replace bathroom faucet.",
    status: "in_progress",
    createdAt: "2026-04-10T08:00:00Z",
    updatedAt: "2026-04-17T11:00:00Z",
    provider: {
      id: "prov-002",
      name: "FastFix Plumbing",
      avatar: undefined,
      isVerified: true,
      rating: 4.6,
      responseTime: "< 1 hour"
    },
    quote: {
      amount: 8500,
      currency: "DZD",
      validUntil: "2026-04-20T23:59:59Z"
    },
    providerResponse: "Work started. Will complete by end of day tomorrow.",
    conversationId: "conv-002",
    lifecycle: [
      { id: "evt-4", type: "created", description: "Request submitted", timestamp: "2026-04-10T08:00:00Z" },
      { id: "evt-5", type: "quote_sent", description: "Quote received: 8,500 DZD", timestamp: "2026-04-11T10:30:00Z", actor: "FastFix Plumbing" },
      { id: "evt-6", type: "status_change", description: "Quote accepted", timestamp: "2026-04-12T15:00:00Z" },
      { id: "evt-7", type: "status_change", description: "Work in progress", timestamp: "2026-04-17T11:00:00Z" }
    ]
  },
  {
    id: "b2c3d4e5-6789-01bc-def0-2345678901bc",
    title: "AC Unit Installation",
    category: "HVAC",
    description: "Install new split AC unit in living room.",
    status: "pending_quote",
    createdAt: "2026-04-19T16:45:00Z",
    updatedAt: "2026-04-19T16:45:00Z",
    provider: {
      id: "prov-003",
      name: "CoolAir Services",
      avatar: undefined,
      isVerified: false,
      rating: 4.2,
      responseTime: "< 4 hours"
    },
    providerResponse: "Thank you for your request. We are reviewing the details and will send a quote shortly.",
    conversationId: "conv-003",
    lifecycle: [
      { id: "evt-8", type: "created", description: "Request submitted", timestamp: "2026-04-19T16:45:00Z" },
      { id: "evt-9", type: "message", description: "Provider acknowledged request", timestamp: "2026-04-19T17:30:00Z", actor: "CoolAir Services" }
    ]
  },
  {
    id: "c3d4e5f6-7890-12cd-ef01-3456789012cd",
    title: "Garden Landscaping",
    category: "Landscaping",
    description: "Design and plant a small garden with native plants.",
    status: "completed",
    createdAt: "2026-03-25T09:00:00Z",
    updatedAt: "2026-04-05T17:30:00Z",
    provider: {
      id: "prov-004",
      name: "Green Thumb Gardens",
      avatar: undefined,
      isVerified: true,
      rating: 4.9,
      responseTime: "< 3 hours"
    },
    quote: {
      amount: 35000,
      currency: "DZD",
      validUntil: "2026-04-01T23:59:59Z"
    },
    providerResponse: "Work completed. Plants are watered and ready. Follow-up care instructions sent via message.",
    conversationId: "conv-004",
    lifecycle: [
      { id: "evt-10", type: "created", description: "Request submitted", timestamp: "2026-03-25T09:00:00Z" },
      { id: "evt-11", type: "quote_sent", description: "Quote received: 35,000 DZD", timestamp: "2026-03-26T11:00:00Z", actor: "Green Thumb Gardens" },
      { id: "evt-12", type: "status_change", description: "Quote accepted", timestamp: "2026-03-27T08:00:00Z" },
      { id: "evt-13", type: "status_change", description: "Work in progress", timestamp: "2026-04-01T09:00:00Z" },
      { id: "evt-14", type: "status_change", description: "Work completed", timestamp: "2026-04-05T17:30:00Z" }
    ]
  },
  {
    id: "d4e5f6g7-8901-23de-f012-4567890123de",
    title: "Electrical Inspection",
    category: "Electrical",
    description: "Full electrical safety inspection for a rental property.",
    status: "cancelled",
    createdAt: "2026-04-01T14:00:00Z",
    updatedAt: "2026-04-08T10:00:00Z",
    provider: {
      id: "prov-005",
      name: "SafeWire Electric",
      avatar: undefined,
      isVerified: true,
      rating: 4.5,
      responseTime: "< 2 hours"
    },
    lifecycle: [
      { id: "evt-15", type: "created", description: "Request submitted", timestamp: "2026-04-01T14:00:00Z" },
      { id: "evt-16", type: "quote_sent", description: "Quote received: 12,000 DZD", timestamp: "2026-04-02T16:00:00Z", actor: "SafeWire Electric" },
      { id: "evt-17", type: "status_change", description: "Request cancelled by customer", timestamp: "2026-04-08T10:00:00Z" }
    ]
  }
]
