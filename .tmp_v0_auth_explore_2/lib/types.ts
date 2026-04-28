// Provider types
export interface Provider {
  id: string;
  slug: string;
  name: string;
  headline: string;
  avatarUrl: string;
  coverImageUrl: string;
  rating: number;
  reviewCount: number;
  badges: ProviderBadge[];
  categories: string[];
  location: string;
  responseTime?: string;
  startingPrice?: number;
}

export type ProviderBadge = 
  | "verified" 
  | "instant_booking" 
  | "top_rated" 
  | "fast_response"
  | "superhost";

// Story types
export interface Story {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  provider: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  isLive: boolean;
  viewCount?: number;
}

// Quick Action types
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  description?: string;
}

// Category types
export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  providerCount: number;
  imageUrl?: string;
}

// API Response types
export interface HomePageResponse {
  featuredProviders: Provider[];
  stories: Story[];
  quickActions: QuickAction[];
  heroProvider: Provider | null;
}

export interface CategoryListResponse {
  categories: Category[];
}

// Search types
export interface SearchParams {
  query?: string;
  location?: string;
  category?: string;
}

// Location types for search dropdown
export interface Location {
  id: string;
  name: string;
  shortName: string;
}
