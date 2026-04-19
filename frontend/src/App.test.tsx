import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';
import App from './App';
import api from './config/api';
import ConversationWorkspace from './components/messaging/ConversationWorkspace';
import NotificationsCenter from './components/notifications/NotificationsCenter';
import ReviewThreadWorkspace from './components/review/ReviewThreadWorkspace';
import { LanguageProvider } from './i18n';
import CustomerHome from './pages/CustomerHome';
import CustomerOrders from './pages/CustomerOrders';
import ProviderPortfolio from './pages/ProviderPortfolio';
import ProviderRequests from './pages/ProviderRequests';
import PublicProviderPage from './pages/PublicProviderPage';

const { TextEncoder, TextDecoder } = require('util');

(globalThis as typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
}).TextEncoder = TextEncoder;
(globalThis as typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
}).TextDecoder = TextDecoder;

jest.mock('react-router-dom', () => require('../node_modules/react-router-dom/dist/index.js'), {
  virtual: true,
});
jest.mock('react-router/dom', () => require('../node_modules/react-router/dist/development/dom-export.js'), {
  virtual: true,
});

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
  ToastContainer: () => null,
}));

const { MemoryRouter, Route, Routes, useLocation } = require('../node_modules/react-router-dom/dist/index.js');

type UserRole = 'customer' | 'service_provider' | 'reviewer' | 'admin' | 'super_admin';

interface ApiEnvelope<T> {
  data: {
    data: T;
  };
}

const toastMock = toast as jest.Mocked<typeof toast>;
const mockScrollTo = jest.fn();

const sampleUser = (role: UserRole) => ({
  id: `${role}-user`,
  email: `${role}@psp.test`,
  role,
  firstName: role === 'service_provider' ? 'Provider' : 'Test',
  lastName: role === 'service_provider' ? 'Owner' : 'User',
});

const sampleCategories = [
  {
    id: 'cat-photo',
    name: 'Photography',
    slug: 'photography',
    description: 'Photo and event coverage',
  },
  {
    id: 'cat-video',
    name: 'Video',
    slug: 'video',
    description: 'Video production',
  },
];

const sampleServices = [
  {
    id: 'service-1',
    name: 'Wedding coverage',
    description: 'Full event coverage with delivery timeline and edited assets.',
    price: '25000',
    currencyCode: 'DZD',
    isFeatured: true,
    showPromoBadge: true,
    promoBadgeText: 'Fast delivery',
    deliveryMode: 'On-site',
    responseTimeHours: 2,
    category: {
      id: 'cat-photo',
      name: 'Photography',
      slug: 'photography',
    },
  },
  {
    id: 'service-2',
    name: 'Studio session',
    description: 'Portrait or brand shoot in studio.',
    price: '9000',
    currencyCode: 'DZD',
    isFeatured: false,
    showPromoBadge: false,
    promoBadgeText: null,
    deliveryMode: 'Studio',
    responseTimeHours: 6,
    category: {
      id: 'cat-photo',
      name: 'Photography',
      slug: 'photography',
    },
  },
];

const sampleStories = [
  {
    id: 'story-1',
    providerId: 'provider-1',
    providerName: 'Atlas Studio',
    providerAvatarUrl: 'https://example.com/provider-avatar.jpg',
    providerLocation: 'Algiers, Algiers',
    mediaType: 'image',
    mediaUrl: 'https://example.com/story-1.jpg',
    thumbnailUrl: 'https://example.com/story-1-thumb.jpg',
    title: 'Today on site',
    description: 'Recent project update from the provider.',
    likesCount: 3,
    commentsCount: 1,
    promoBadgeText: null,
    showPromoBadge: false,
    storyAudience: 'public',
    storyExpiresAt: '2026-04-20T10:00:00.000Z',
    service: {
      id: 'service-1',
      name: 'Wedding coverage',
    },
  },
  {
    id: 'story-2',
    providerId: 'provider-1',
    providerName: 'Atlas Studio',
    providerAvatarUrl: 'https://example.com/provider-avatar.jpg',
    providerLocation: 'Algiers, Algiers',
    mediaType: 'image',
    mediaUrl: 'https://example.com/story-2.jpg',
    thumbnailUrl: 'https://example.com/story-2-thumb.jpg',
    title: 'Favorites only update',
    description: 'Private story for favorite-followers.',
    likesCount: 1,
    commentsCount: 0,
    promoBadgeText: null,
    showPromoBadge: false,
    storyAudience: 'favorites_only',
    storyExpiresAt: '2026-04-20T12:00:00.000Z',
    service: {
      id: 'service-2',
      name: 'Studio session',
    },
  },
];

const samplePublicProvider = {
  provider: {
    id: 'provider-1',
    companyName: 'Atlas Studio',
    avatarUrl: 'https://example.com/provider-avatar.jpg',
    coverUrl: 'https://example.com/provider-cover.jpg',
    city: 'Algiers',
    wilaya: 'Algiers',
    region: 'North',
    averageRating: 4.8,
    reviewsCount: 18,
    responseTimeMinutes: 25,
    description: 'Trusted event and portrait studio.',
    isVerified: true,
    status: 'approved',
    primaryCategory: {
      id: 'cat-photo',
      name: 'Photography',
      slug: 'photography',
    },
    serviceCoverage: {
      mode: 'regional',
      label: 'Regional coverage',
      regions: ['North'],
    },
    preference: {
      selectedPlan: 'pro',
      profileBadgeText: 'Top rated',
      featuredOnHomepage: true,
    },
    owner: {
      firstName: 'Atlas',
      lastName: 'Owner',
    },
    contact: {
      email: 'hello@atlas.test',
      phoneNumber: '0555000000',
      addressLine: 'Hydra, Algiers',
    },
  },
  services: sampleServices,
  media: [
    {
      id: 'media-1',
      serviceId: 'service-1',
      service: {
        id: 'service-1',
        name: 'Wedding coverage',
      },
      mediaType: 'image',
      mediaUrl: 'https://example.com/media-1.jpg',
      thumbnailUrl: null,
      title: 'Ceremony setup',
      description: 'Proof of work from the latest event.',
      isPublished: true,
      isFeatured: true,
      showPromoBadge: false,
      promoBadgeText: null,
      sortOrder: 1,
      likesCount: 3,
      commentsCount: 1,
      latestComments: [
        {
          id: 'comment-1',
          authorName: 'Lina',
          body: 'Looks great',
          createdAt: '2026-04-18T09:00:00.000Z',
        },
      ],
    },
  ],
  stories: sampleStories,
};

const sampleReviews = [
  {
    id: 'review-1',
    providerId: 'provider-1',
    authorName: 'Sara Ben',
    rating: 5,
    comment: 'Clear communication and reliable delivery.',
    createdAt: '2026-04-18T08:00:00.000Z',
  },
];

const sampleCustomerOrders = [
  {
    id: 'request-1',
    subject: 'Wedding coverage',
    description: 'Need two photographers for a wedding.',
    budgetMin: '10000',
    budgetMax: '18000',
    quotedPrice: '15000',
    currencyCode: 'DZD',
    providerResponse: 'We can cover the event and share a final quote.',
    customerNote: 'Need final answer this week.',
    preferredDate: '2026-05-01T12:00:00.000Z',
    status: 'quoted',
    conversationId: 'conversation-1',
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-18T10:00:00.000Z',
    provider: {
      id: 'provider-1',
      companyName: 'Atlas Studio',
      avatarUrl: 'https://example.com/provider-avatar.jpg',
      isVerified: true,
    },
    service: {
      id: 'service-1',
      name: 'Wedding coverage',
    },
  },
];

const sampleProviderOrders = [
  {
    id: 'request-1',
    subject: 'Wedding coverage',
    description: 'Need full-day event coverage.',
    budgetMin: '10000',
    budgetMax: '18000',
    quotedPrice: '15000',
    currencyCode: 'DZD',
    providerResponse: 'Quote shared with draft timeline.',
    customerNote: 'Client asked for fast turnaround.',
    preferredDate: '2026-05-01T12:00:00.000Z',
    status: 'quoted',
    conversationId: 'conversation-1',
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-18T10:00:00.000Z',
    customer: {
      id: 'customer-1',
      firstName: 'Sara',
      lastName: 'Ben',
      email: 'sara@test.dev',
      phoneNumber: '0666000000',
    },
    service: {
      id: 'service-1',
      name: 'Wedding coverage',
    },
  },
];

const sampleConversations = [
  {
    id: 'conversation-1',
    subject: 'Wedding coverage',
    status: 'open',
    lastMessagePreview: 'Can you confirm the date?',
    lastMessageAt: '2026-04-18T11:00:00.000Z',
    unreadCount: 1,
    provider: {
      id: 'provider-1',
      companyName: 'Atlas Studio',
      avatarUrl: 'https://example.com/provider-avatar.jpg',
      isVerified: true,
      profileBadgeText: 'Top rated',
    },
    customer: {
      id: 'customer-1',
      firstName: 'Sara',
      lastName: 'Ben',
      email: 'sara@test.dev',
    },
    service: {
      id: 'service-1',
      name: 'Wedding coverage',
    },
  },
  {
    id: 'conversation-2',
    subject: 'Portrait session',
    status: 'open',
    lastMessagePreview: 'Need a studio slot next week.',
    lastMessageAt: '2026-04-17T09:00:00.000Z',
    unreadCount: 0,
    provider: {
      id: 'provider-1',
      companyName: 'Atlas Studio',
      avatarUrl: 'https://example.com/provider-avatar.jpg',
      isVerified: true,
      profileBadgeText: 'Top rated',
    },
    customer: {
      id: 'customer-2',
      firstName: 'Amina',
      lastName: 'H.',
      email: 'amina@test.dev',
    },
    service: {
      id: 'service-2',
      name: 'Studio session',
    },
  },
];

const sampleMessagesByConversation: Record<string, Array<Record<string, unknown>>> = {
  'conversation-1': [
    {
      id: 'message-1',
      conversationId: 'conversation-1',
      senderUserId: 'customer-1',
      senderRole: 'customer',
      body: 'Can you confirm the date?',
      createdAt: '2026-04-18T10:30:00.000Z',
      senderName: 'Sara Ben',
      isAiAssisted: false,
    },
  ],
  'conversation-2': [
    {
      id: 'message-2',
      conversationId: 'conversation-2',
      senderUserId: 'customer-2',
      senderRole: 'customer',
      body: 'Need a studio slot next week.',
      createdAt: '2026-04-17T08:30:00.000Z',
      senderName: 'Amina H.',
      isAiAssisted: false,
    },
  ],
};

const sampleNotifications = [
  {
    id: 'notification-1',
    type: 'request',
    title: 'New lead received',
    body: 'A new request is waiting for review.',
    link: '/provider/requests?requestId=request-1&tab=quoted',
    isRead: false,
    createdAt: '2026-04-18T11:30:00.000Z',
  },
  {
    id: 'notification-2',
    type: 'message',
    title: 'Customer replied',
    body: 'A customer sent a follow-up message.',
    link: '/provider/messages?conversationId=conversation-1',
    isRead: false,
    createdAt: '2026-04-18T10:20:00.000Z',
  },
  {
    id: 'notification-3',
    type: 'comment',
    title: 'New public comment',
    body: 'Someone commented on your media.',
    link: '/provider/portfolio',
    isRead: true,
    createdAt: '2026-04-17T10:20:00.000Z',
  },
];

const sampleProviderDashboard = {
  provider: {
    companyName: 'Atlas Studio',
    city: 'Algiers',
    wilaya: 'Algiers',
    region: 'North',
    avatarUrl: 'https://example.com/provider-avatar.jpg',
    coverUrl: 'https://example.com/provider-cover.jpg',
    primaryCategory: {
      name: 'Photography',
    },
    user: {
      firstName: 'Atlas',
      lastName: 'Owner',
    },
  },
  preference: {
    selectedPlan: 'pro',
    featuredOnHomepage: true,
    profileBadgeText: 'Top rated',
    autoReplyEnabled: true,
  },
  planFeatures: {
    canUseProfileBadge: true,
    canUseServicePromoBadge: true,
    canFeatureOnHomepage: true,
    canFeatureServices: true,
  },
  stats: {
    totalServices: 2,
    publishedServices: 2,
    draftServices: 0,
    pausedServices: 0,
    featuredServices: 1,
    reviewsCount: 18,
    averageRating: '4.8',
    responseTimeMinutes: 25,
    completionPercentage: 92,
    isVerified: true,
    status: 'approved',
  },
  recentServices: sampleServices,
};

const samplePortfolioItems = [
  {
    id: 'portfolio-1',
    serviceId: 'service-1',
    service: {
      id: 'service-1',
      name: 'Wedding coverage',
    },
    mediaType: 'image',
    mediaUrl: 'https://example.com/media-1.jpg',
    thumbnailUrl: null,
    title: 'Reception room',
    description: 'Portfolio example',
    isPublished: true,
    isFeatured: true,
    showPromoBadge: false,
    promoBadgeText: null,
    sortOrder: 1,
    likesCount: 3,
    commentsCount: 1,
    isStory: false,
    storyAudience: 'public',
    storyExpiresAt: null,
  },
];

const sampleReviewerDashboard = {
  stats: {
    totalProviders: 12,
    pendingProviders: 2,
    approvedProviders: 8,
    rejectedProviders: 1,
    suspendedProviders: 1,
  },
  latestPending: [
    {
      id: 'provider-1',
      companyName: 'Atlas Studio',
      city: 'Algiers',
      wilaya: 'Algiers',
      region: 'North',
      createdAt: '2026-04-18T09:00:00.000Z',
      owner: {
        firstName: 'Atlas',
        lastName: 'Owner',
        email: 'atlas@test.dev',
      },
      primaryCategory: {
        name: 'Photography',
      },
      servicesCount: 2,
      status: 'pending',
      isVerified: false,
    },
  ],
  summary: {
    pendingCount: 2,
    reviewedToday: 3,
    totalReviewed: 26,
    approvedCount: 18,
    approvalRate: 69,
  },
};

const sampleReviewerPending = [
  {
    id: 'provider-1',
    companyName: 'Atlas Studio',
    description: 'Provider description',
    city: 'Algiers',
    wilaya: 'Algiers',
    region: 'North',
    yearsOfExperience: 7,
    createdAt: '2026-04-18T09:00:00.000Z',
    status: 'pending',
    isVerified: false,
    owner: {
      firstName: 'Atlas',
      lastName: 'Owner',
      email: 'atlas@test.dev',
    },
    primaryCategory: {
      name: 'Photography',
    },
    servicesCount: 2,
  },
];

const sampleReviewerHistory = [
  {
    id: 'history-1',
    decision: 'approved',
    note: 'Profile and services verified.',
    createdAt: '2026-04-17T12:00:00.000Z',
    provider: {
      id: 'provider-1',
      companyName: 'Atlas Studio',
      status: 'approved',
    },
    reviewer: {
      firstName: 'Rania',
      lastName: 'K.',
    },
  },
];

const sampleReviewThreads = [
  {
    threadId: 'thread-1',
    unreadCount: 1,
    subject: {
      type: 'provider',
      id: 'provider-1',
      label: 'Atlas Studio',
      secondaryLabel: 'Pending moderation',
      profile: {},
    },
    reviewer: {
      id: 'reviewer-1',
      firstName: 'Rania',
      lastName: 'K.',
      email: 'reviewer@test.dev',
    },
    admin: {
      id: 'admin-1',
      firstName: 'Admin',
      lastName: 'Ops',
      email: 'admin@test.dev',
    },
    lastMessage: {
      id: 'thread-message-1',
      body: 'Please validate the provider profile.',
      createdAt: '2026-04-18T10:00:00.000Z',
      actorUserId: 'admin-1',
    },
  },
];

const sampleReviewThreadDetails = {
  metadata: {
    threadId: 'thread-1',
    adminUserId: 'admin-1',
    reviewerUserId: 'reviewer-1',
    subjectType: 'provider',
    subjectId: 'provider-1',
    subjectLabel: 'Atlas Studio',
  },
  subject: sampleReviewThreads[0].subject,
  messages: [
    {
      id: 'thread-message-1',
      body: 'Please validate the provider profile.',
      title: 'Assignment',
      createdAt: '2026-04-18T10:00:00.000Z',
      isRead: false,
      senderUserId: 'admin-1',
      senderRole: 'admin',
      senderName: 'Admin Ops',
      recipientName: 'Rania K.',
      messageKind: 'message',
      decision: null,
    },
  ],
};

const sampleAdminProviders = [
  {
    id: 'provider-1',
    companyName: 'Atlas Studio',
    avatarUrl: 'https://example.com/provider-avatar.jpg',
    status: 'pending',
    isVerified: false,
    city: 'Algiers',
    wilaya: 'Algiers',
    region: 'North',
    createdAt: '2026-04-18T09:00:00.000Z',
    owner: {
      firstName: 'Atlas',
      lastName: 'Owner',
      email: 'atlas@test.dev',
    },
    primaryCategory: {
      id: 'cat-photo',
      name: 'Photography',
      slug: 'photography',
    },
    preference: {
      featuredOnHomepage: false,
      profileBadgeText: '',
      selectedPlan: 'pro',
    },
  },
];

const sampleAdminContent = [
  {
    id: 'content-comment-1',
    authorName: 'Lina',
    body: 'Very helpful provider.',
    createdAt: '2026-04-18T09:00:00.000Z',
    media: {
      id: 'media-1',
      title: 'Ceremony setup',
      providerId: 'provider-1',
    },
  },
];

const sampleReviewers = [
  {
    id: 'reviewer-1',
    firstName: 'Rania',
    lastName: 'K.',
    email: 'reviewer@test.dev',
    isActive: true,
  },
];

const ok = <T,>(data: T): Promise<ApiEnvelope<T>> =>
  Promise.resolve({
    data: {
      data,
    },
  });

const getEndpoint = (url: unknown) => (typeof url === 'string' ? url : String(url));

const installApiSpies = () => {
  const getSpy = jest.spyOn(api, 'get').mockImplementation((url) => {
    const endpoint = getEndpoint(url);

    if (endpoint === '/discovery/customer-home') {
      return ok({
        featuredProviders: [
          {
            id: 'provider-1',
            companyName: 'Atlas Studio',
            avatarUrl: 'https://example.com/provider-avatar.jpg',
            coverUrl: 'https://example.com/provider-cover.jpg',
            city: 'Algiers',
            wilaya: 'Algiers',
            region: 'North',
            averageRating: 4.8,
            reviewsCount: 18,
            isVerified: true,
            profileBadgeText: 'Top rated',
            primaryCategory: {
              id: 'cat-photo',
              name: 'Photography',
            },
          },
        ],
        featuredServices: sampleServices.map((service) => ({
          ...service,
          providerId: 'provider-1',
        })),
        stories: sampleStories,
        recentReviews: [
          {
            id: 'recent-review-1',
            providerId: 'provider-1',
            providerName: 'Atlas Studio',
            providerAvatarUrl: 'https://example.com/provider-avatar.jpg',
            rating: 5,
            comment: 'Great service.',
            createdAt: '2026-04-18T08:00:00.000Z',
          },
        ],
      });
    }

    if (endpoint === '/discovery/categories') {
      return ok(sampleCategories);
    }

    if (endpoint === '/discovery/search') {
      return ok([
        {
          id: 'provider-1',
          companyName: 'Atlas Studio',
          avatarUrl: 'https://example.com/provider-avatar.jpg',
          coverUrl: 'https://example.com/provider-cover.jpg',
          city: 'Algiers',
          wilaya: 'Algiers',
          region: 'North',
          averageRating: 4.8,
          reviewsCount: 18,
          isVerified: true,
          yearsOfExperience: 7,
          responseTimeMinutes: 25,
          profileBadgeText: 'Top rated',
          featuredOnHomepage: true,
          primaryCategory: {
            id: 'cat-photo',
            name: 'Photography',
            slug: 'photography',
          },
          servicesPreview: sampleServices,
          serviceCoverage: {
            mode: 'regional',
            label: 'Regional coverage',
            regions: ['North'],
          },
        },
      ]);
    }

    if (endpoint === '/favorites/providers') {
      return ok([
        {
          id: 'provider-1',
          companyName: 'Atlas Studio',
          avatarUrl: 'https://example.com/provider-avatar.jpg',
          coverUrl: 'https://example.com/provider-cover.jpg',
          city: 'Algiers',
          wilaya: 'Algiers',
          region: 'North',
          averageRating: 4.8,
          reviewsCount: 18,
          isVerified: true,
          profileBadgeText: 'Top rated',
        },
      ]);
    }

    if (endpoint === '/provider-reviews/me') {
      return ok([
        {
          id: 'review-1',
          providerId: 'provider-1',
          rating: 5,
          comment: 'Great service.',
          createdAt: '2026-04-18T08:00:00.000Z',
          provider: {
            id: 'provider-1',
            companyName: 'Atlas Studio',
            avatarUrl: 'https://example.com/provider-avatar.jpg',
          },
        },
      ]);
    }

    if (endpoint === '/provider-reviews/provider/provider-1') {
      return ok(sampleReviews);
    }

    if (endpoint === '/public-providers/provider-1') {
      return ok(samplePublicProvider);
    }

    if (endpoint === '/provider-media/provider/provider-1/interactions') {
      return ok({
        likedMediaIds: ['media-1'],
      });
    }

    if (endpoint === '/customers/me/preferences') {
      return ok({
        preferredRegion: 'North',
        preferredWilaya: 'Algiers',
      });
    }

    if (endpoint === '/provider-media/media-1/comments') {
      return ok(samplePublicProvider.media[0].latestComments);
    }

    if (endpoint === '/orders/customer') {
      return ok(sampleCustomerOrders);
    }

    if (endpoint === '/orders/provider') {
      return ok(sampleProviderOrders);
    }

    if (endpoint === '/messages/conversations') {
      return ok(sampleConversations);
    }

    if (endpoint === '/messages/conversations/conversation-1/messages') {
      return ok({
        messages: sampleMessagesByConversation['conversation-1'],
      });
    }

    if (endpoint === '/messages/conversations/conversation-2/messages') {
      return ok({
        messages: sampleMessagesByConversation['conversation-2'],
      });
    }

    if (endpoint === '/notifications/me') {
      return ok(sampleNotifications);
    }

    if (endpoint === '/providers/me/dashboard') {
      return ok(sampleProviderDashboard);
    }

    if (endpoint === '/provider-media/me') {
      return ok({
        items: samplePortfolioItems,
        preference: {
          selectedPlan: 'pro',
        },
        planFeatures: {
          canUseProfileBadge: true,
          canUseServicePromoBadge: true,
          canFeatureOnHomepage: true,
          canFeatureServices: true,
        },
      });
    }

    if (endpoint === '/providers/me/services') {
      return ok(sampleServices);
    }

    if (endpoint === '/reviewer/dashboard') {
      return ok(sampleReviewerDashboard);
    }

    if (endpoint === '/reviewer/pending') {
      return ok(sampleReviewerPending);
    }

    if (endpoint === '/reviewer/history') {
      return ok(sampleReviewerHistory);
    }

    if (endpoint === '/review-threads') {
      return ok(sampleReviewThreads);
    }

    if (endpoint === '/review-threads/thread-1') {
      return ok(sampleReviewThreadDetails);
    }

    if (endpoint === '/admin/providers') {
      return ok(sampleAdminProviders);
    }

    if (endpoint === '/admin/content/comments') {
      return ok(sampleAdminContent);
    }

    if (endpoint === '/admin/reviewers') {
      return ok(sampleReviewers);
    }

    return Promise.reject(new Error(`Unhandled GET ${endpoint}`));
  });

  const postSpy = jest.spyOn(api, 'post').mockImplementation((url, body) => {
    const endpoint = getEndpoint(url);

    if (endpoint === '/messages/conversations') {
      return ok({
        id: 'conversation-1',
      });
    }

    if (endpoint === '/messages/conversations/conversation-1/messages') {
      return ok({
        id: 'message-created',
        conversationId: 'conversation-1',
        senderUserId: 'service_provider-user',
        senderRole: 'service_provider',
        body: (body as { body: string }).body,
        createdAt: '2026-04-18T12:00:00.000Z',
        senderName: 'Atlas Owner',
        isAiAssisted: Boolean((body as { isAiAssisted?: boolean }).isAiAssisted),
      });
    }

    if (endpoint === '/messages/conversations/conversation-1/ai-reply-preview') {
      return ok({
        autoReplyEnabled: true,
        selectedPlan: 'pro',
        matchedServices: [
          {
            id: 'service-1',
            name: 'Wedding coverage',
            price: '25000',
            currencyCode: 'DZD',
            promoBadgeText: 'Fast delivery',
            showPromoBadge: true,
          },
        ],
        reply: 'Thanks for reaching out. I can share a scoped quote today.',
      });
    }

    if (
      endpoint === '/messages/conversations/conversation-1/read' ||
      endpoint === '/messages/conversations/conversation-2/read'
    ) {
      return ok({});
    }

    if (endpoint === '/provider-media/media-1/like') {
      return ok({});
    }

    if (endpoint === '/provider-media/media-1/comments') {
      return ok({
        id: 'comment-created',
        authorName: 'Sara Ben',
        body: (body as { body: string }).body,
        createdAt: '2026-04-18T12:00:00.000Z',
      });
    }

    if (endpoint === '/provider-media/stories/story-1/reply') {
      return ok({
        conversationId: 'conversation-1',
        redirectTo: '/customer/messages?conversationId=conversation-1',
      });
    }

    if (endpoint === '/orders') {
      return ok({
        id: 'request-created',
      });
    }

    if (
      endpoint === '/notifications/read-all' ||
      endpoint === '/notifications/notification-1/read'
    ) {
      return ok({});
    }

    if (endpoint === '/review-threads/thread-1/read') {
      return ok({});
    }

    if (endpoint === '/review-threads/thread-1/messages') {
      return ok({});
    }

    if (endpoint === '/review-threads/thread-1/decision') {
      return ok({});
    }

    if (endpoint === '/review-threads') {
      return ok({
        threadId: 'thread-1',
      });
    }

    if (endpoint === '/favorites/providers/provider-1') {
      return ok({});
    }

    if (endpoint === '/auth/logout') {
      return ok({});
    }

    return Promise.reject(new Error(`Unhandled POST ${endpoint}`));
  });

  const deleteSpy = jest.spyOn(api, 'delete').mockImplementation((url) => {
    const endpoint = getEndpoint(url);

    if (
      endpoint === '/favorites/providers/provider-1' ||
      endpoint === '/provider-media/media-1/like' ||
      endpoint === '/provider-reviews/review-1' ||
      endpoint === '/provider-media/comments/comment-1' ||
      endpoint === '/admin/content/comments/content-comment-1'
    ) {
      return ok({});
    }

    return Promise.reject(new Error(`Unhandled DELETE ${endpoint}`));
  });

  const patchSpy = jest.spyOn(api, 'patch').mockImplementation((url) => {
    const endpoint = getEndpoint(url);

    if (
      endpoint === '/orders/request-1/customer' ||
      endpoint === '/orders/request-1/provider' ||
      endpoint === '/admin/providers/provider-1/moderation'
    ) {
      return ok({});
    }

    return Promise.reject(new Error(`Unhandled PATCH ${endpoint}`));
  });

  const putSpy = jest.spyOn(api, 'put').mockImplementation((url) => {
    const endpoint = getEndpoint(url);

    if (endpoint === '/provider-media/portfolio-1') {
      return ok({});
    }

    return Promise.reject(new Error(`Unhandled PUT ${endpoint}`));
  });

  return {
    getSpy,
    postSpy,
    deleteSpy,
    patchSpy,
    putSpy,
  };
};

const LocationDisplay: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location-display">{`${location.pathname}${location.search}`}</div>;
};

const setSession = (role: UserRole) => {
  localStorage.setItem('accessToken', 'test-token');
  localStorage.setItem('user', JSON.stringify(sampleUser(role)));
};

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

const renderAppAt = (path: string) => {
  window.history.pushState({}, 'Test', path);
  return render(<App />);
};

const renderWithLanguage = (ui: React.ReactElement) =>
  render(<LanguageProvider>{ui}</LanguageProvider>);

describe('QA smoke pass', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: mockScrollTo,
    });
  });

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    localStorage.setItem('psp_language', 'en');
    toastMock.error.mockClear();
    toastMock.success.mockClear();
    mockScrollTo.mockClear();
    jest.clearAllMocks();
    installApiSpies();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects unauthenticated protected routes to login', async () => {
    renderAppAt('/customer/orders?requestId=request-1&tab=quoted');

    expect(
      await screen.findByRole('heading', {
        name: /sign in and continue from the exact point you stopped/i,
      })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  test('redirects role mismatch back to the correct workspace', async () => {
    setSession('customer');

    renderAppAt('/provider/messages?conversationId=conversation-1');

    expect(
      await screen.findByRole('heading', {
        name: /public stories for everyone, private stories from providers you already trust/i,
      })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/customer/dashboard');
  });

  test.each([
    ['/customer/dashboard', 'customer', /public stories for everyone, private stories from providers you already trust/i],
    ['/customer/explore', 'customer', /search providers with local precision/i],
    ['/customer/messages?conversationId=conversation-1', 'customer', /provider conversations/i],
    ['/customer/orders?requestId=request-1&tab=quoted', 'customer', /requests, quotes, and next decisions/i],
    ['/customer/notifications?filter=message', 'customer', /customer notification center/i],
    ['/customer/favorites', 'customer', /keep the providers worth returning to/i],
    ['/customer/reviews', 'customer', /manage the feedback you have already published/i],
    ['/provider/dashboard', 'service_provider', /provider cockpit/i],
    ['/provider/portfolio', 'service_provider', /publish portfolio item or story/i],
    ['/provider/messages?conversationId=conversation-1', 'service_provider', /commercial inbox/i],
    ['/provider/requests?requestId=request-1&tab=quoted', 'service_provider', /provider requests, quotes, and delivery flow/i],
    ['/provider/notifications?filter=request', 'service_provider', /provider activity center/i],
    ['/reviewer/dashboard', 'reviewer', /review queue, next action, and decision quality in one place/i],
    ['/reviewer/pending', 'reviewer', /move cleanly from intake to an explicit moderation decision/i],
    ['/reviewer/history', 'reviewer', /audit previous moderation calls without leaving the shell workflow/i],
    ['/reviewer/inbox?threadId=thread-1', 'reviewer', /reviewer inbox/i],
    ['/admin/providers', 'admin', /approval, trust, and visibility controls/i],
    ['/admin/content', 'admin', /keep public engagement clean without leaving the operations shell/i],
    ['/admin/review-inbox?threadId=thread-1', 'admin', /admin review inbox/i],
  ] as Array<[string, UserRole, RegExp]>)(
    'loads route %s without runtime failure',
    async (path, role, expectedText) => {
      setSession(role);

      renderAppAt(path);

      expect(await screen.findByText(expectedText)).toBeInTheDocument();
      expect(toastMock.error).not.toHaveBeenCalled();
    }
  );

  test('opens a story from customer home and preserves storyId deep link', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter initialEntries={['/customer/dashboard']}>
        <>
          <Routes>
            <Route path="/customer/dashboard" element={<CustomerHome />} />
          </Routes>
          <LocationDisplay />
        </>
      </MemoryRouter>
    );

    expect(await screen.findByText(/stories/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /atlas studio/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/providers/provider-1?storyId=story-1'
      );
    });
  });

  test('opens provider page story viewer from storyId and replies into messaging', async () => {
    const user = userEvent;
    setSession('customer');

    renderWithLanguage(
      <MemoryRouter initialEntries={['/providers/provider-1?storyId=story-1']}>
        <>
          <Routes>
            <Route path="/providers/:id" element={<PublicProviderPage />} />
            <Route path="*" element={<div />} />
          </Routes>
          <LocationDisplay />
        </>
      </MemoryRouter>
    );

    expect(await screen.findByText(/story viewer/i)).toBeInTheDocument();
    expect(screen.getByText(/today on site/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/reply to this story/i), 'Need details');
    await user.click(screen.getByRole('button', { name: /reply in chat/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/customer/messages?conversationId=conversation-1'
      );
    });
    expect(toastMock.success).toHaveBeenCalled();
  });

  test('keeps media interactions local without refetching the full provider page', async () => {
    const user = userEvent;
    setSession('customer');
    const getSpy = jest.spyOn(api, 'get');

    renderWithLanguage(
      <MemoryRouter initialEntries={['/providers/provider-1']}>
        <Routes>
          <Route path="/providers/:id" element={<PublicProviderPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/portfolio and proof of work/i)).toBeInTheDocument();

    const providerLoadCountBefore = getSpy.mock.calls.filter(
      ([url]) => url === '/public-providers/provider-1'
    ).length;

    await user.click(screen.getByRole('button', { name: /unlike 3/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /like 2/i })).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/write a comment/i), 'Looks strong');
    await user.click(screen.getByRole('button', { name: /^comment$/i }));

    await waitFor(() => {
      expect(screen.getByText(/looks strong/i)).toBeInTheDocument();
    });

    const providerLoadCountAfter = getSpy.mock.calls.filter(
      ([url]) => url === '/public-providers/provider-1'
    ).length;

    expect(providerLoadCountAfter).toBe(providerLoadCountBefore);
  });

  test('keeps customer request deep links stable and opens linked conversation', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter initialEntries={['/customer/orders?requestId=request-1&tab=quoted']}>
        <>
          <Routes>
            <Route path="/customer/orders" element={<CustomerOrders />} />
            <Route path="*" element={<div />} />
          </Routes>
          <LocationDisplay />
        </>
      </MemoryRouter>
    );

    expect(await screen.findByText(/requests, quotes, and next decisions/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/customer/orders?requestId=request-1&tab=quoted'
    );

    await user.click(screen.getAllByRole('button', { name: /open conversation/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/customer/messages?conversationId=conversation-1'
      );
    });
  });

  test('keeps provider request deep links stable and opens linked conversation', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter initialEntries={['/provider/requests?requestId=request-1&tab=quoted']}>
        <>
          <Routes>
            <Route path="/provider/requests" element={<ProviderRequests />} />
            <Route path="*" element={<div />} />
          </Routes>
          <LocationDisplay />
        </>
      </MemoryRouter>
    );

    expect(await screen.findByText(/provider requests, quotes, and delivery flow/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/provider/requests?requestId=request-1&tab=quoted'
    );

    await user.click(screen.getAllByRole('button', { name: /open linked conversation/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/provider/messages?conversationId=conversation-1'
      );
    });
  });

  test('respects notification filter deep links and opens related items', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter initialEntries={['/provider/notifications?filter=request']}>
        <>
          <Routes>
            <Route
              path="/provider/notifications"
              element={<NotificationsCenter mode="provider" />}
            />
            <Route path="*" element={<div />} />
          </Routes>
          <LocationDisplay />
        </>
      </MemoryRouter>
    );

    expect(await screen.findByText(/provider activity center/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent(
      '/provider/notifications?filter=request'
    );
    expect(screen.getByText(/new lead received/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new lead received/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/provider/requests?requestId=request-1&tab=quoted'
      );
    });
  });

  test('keeps conversationId selection stable and supports AI draft generation', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter initialEntries={['/provider/messages?conversationId=conversation-1']}>
        <Routes>
          <Route
            path="/provider/messages"
            element={<ConversationWorkspace mode="provider" />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/commercial inbox/i)).toBeInTheDocument();
    expect(screen.getByText(/atlas studio/i)).toBeInTheDocument();
    expect(screen.getByText(/sara ben/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate ai draft/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue(/thanks for reaching out/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /amina h\./i }));

    await waitFor(() => {
      expect(screen.getByText(/need a studio slot next week\./i)).toBeInTheDocument();
    });
  });

  test('publishes a normal media item and a story without changing route contracts', async () => {
    const user = userEvent;
    const postSpy = jest.spyOn(api, 'post');

    const { container } = renderWithLanguage(
      <MemoryRouter initialEntries={['/provider/portfolio']}>
        <Routes>
          <Route path="/provider/portfolio" element={<ProviderPortfolio />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/publish portfolio item or story/i)).toBeInTheDocument();

    const titleInput = screen.getAllByRole('textbox')[0];
    await user.clear(titleInput);
    await user.type(titleInput, 'New portfolio card');

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).not.toBeNull();

    if (!fileInput) {
      throw new Error('Expected portfolio file input to exist.');
    }

    await user.upload(
      fileInput,
      new File(['image-data'], 'portfolio.jpg', { type: 'image/jpeg' })
    );

    await user.click(screen.getByRole('button', { name: /publish item/i }));

    const normalMediaCall = postSpy.mock.calls.find(([url]) => url === '/provider-media');
    expect(normalMediaCall).toBeTruthy();

    const normalMediaPayload = normalMediaCall?.[1] as FormData;
    const normalEntries = Array.from(normalMediaPayload.entries());
    expect(normalEntries).toEqual(
      expect.arrayContaining([
        ['title', 'New portfolio card'],
        ['isStory', 'false'],
        ['storyAudience', 'public'],
      ])
    );

    const storyToggle = screen.getByRole('checkbox', {
      name: /publish this as a story/i,
    });
    await user.click(storyToggle);

    const titleInputForStory = screen.getAllByRole('textbox')[0];
    await user.clear(titleInputForStory);
    await user.type(titleInputForStory, 'Favorites only story');

    const audienceSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(audienceSelect, 'favorites_only');

    await user.upload(
      fileInput,
      new File(['image-data'], 'story.jpg', { type: 'image/jpeg' })
    );

    await user.click(screen.getByRole('button', { name: /publish story/i }));

    const storyCall = postSpy.mock.calls
      .filter(([url]) => url === '/provider-media')
      .at(-1);

    expect(storyCall).toBeTruthy();

    const storyPayload = storyCall?.[1] as FormData;
    const storyEntries = Array.from(storyPayload.entries());
    expect(storyEntries).toEqual(
      expect.arrayContaining([
        ['title', 'Favorites only story'],
        ['isStory', 'true'],
        ['storyAudience', 'favorites_only'],
      ])
    );
  });

  test('supports admin review thread creation and reviewer decision posting', async () => {
    const user = userEvent;

    renderWithLanguage(
      <MemoryRouter
        initialEntries={[
          '/admin/review-inbox?subjectType=provider&subjectId=provider-1&subjectLabel=Atlas%20Studio',
        ]}
      >
        <Routes>
          <Route
            path="/admin/review-inbox"
            element={<ReviewThreadWorkspace mode="admin" />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/start reviewer assignment/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), 'reviewer-1');
    await user.type(
      screen.getByPlaceholderText(/explain what should be reviewed/i),
      'Please validate the provider identity and public proof.'
    );
    await user.click(screen.getByRole('button', { name: /send to reviewer/i }));

    await screen.findByText(/review workflow/i);
    expect(toastMock.error).not.toHaveBeenCalled();

    cleanup();

    renderWithLanguage(
      <MemoryRouter initialEntries={['/reviewer/inbox?threadId=thread-1']}>
        <Routes>
          <Route
            path="/reviewer/inbox"
            element={<ReviewThreadWorkspace mode="reviewer" />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/reviewer decision/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox'), 'approved');
    await user.type(
      screen.getByPlaceholderText(/explain the decision/i),
      'Identity and service evidence are sufficient.'
    );
    await user.click(screen.getByRole('button', { name: /post decision to thread/i }));

    expect(toastMock.success).toHaveBeenCalled();
  });
});
