export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  authorName: string;
}

export interface MediaComment {
  id: string;
  userId?: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ProviderStoryItem {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatarUrl?: string | null;
  providerLocation?: string | null;
  createdAt?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  description?: string | null;
  likesCount: number;
  commentsCount: number;
  showPromoBadge: boolean;
  promoBadgeText?: string | null;
  storyAudience: 'public' | 'favorites_only';
  storyExpiresAt?: string | null;
  service?: { id: string; name: string } | null;
}

export interface PublicProviderPayload {
  provider: {
    id: string;
    companyName: string;
    description?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    region?: string | null;
    wilaya?: string | null;
    city?: string | null;
    serviceCoverage: {
      mode: 'wilaya_only' | 'regional' | 'nationwide';
      label: string;
      regions: string[];
    };
    yearsOfExperience: number;
    averageRating: string;
    reviewsCount: number;
    responseTimeMinutes: number;
    responseRate?: number;
    completedJobs?: number;
    createdAt?: string;
    isVerified: boolean;
    status: string;
    primaryCategory?: { id: string; name: string; slug: string } | null;
    owner: { firstName: string; lastName: string };
    contact: {
      email?: string | null;
      phoneNumber?: string | null;
      addressLine?: string | null;
      website?: string | null;
      businessHours?: string | null;
    };
    preference: {
      selectedPlan: 'basic' | 'pro' | 'business';
      featuredOnHomepage: boolean;
      profileBadgeText?: string | null;
    };
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    price?: string | null;
    currencyCode: string;
    deliveryMode: string;
    responseTimeHours: number;
    isFeatured: boolean;
    showPromoBadge: boolean;
    promoBadgeText?: string | null;
    category?: { id: string; name: string; slug: string } | null;
  }>;
  media: Array<{
    id: string;
    createdAt?: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    thumbnailUrl?: string | null;
    title: string;
    description?: string | null;
    isFeatured: boolean;
    showPromoBadge: boolean;
    promoBadgeText?: string | null;
    likesCount: number;
    commentsCount: number;
    service?: { id: string; name: string } | null;
    latestComments: MediaComment[];
  }>;
  stories: ProviderStoryItem[];
}
