import type { LucideIcon } from 'lucide-react';

export interface MarketplaceCategoryCardItem {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  iconUrl?: string | null;
  providerCount?: number;
}

export interface MarketplaceCategorySelectItem {
  id: string;
  name: string;
  label?: string;
}

export interface MarketplaceStoryCardItem {
  id: string;
  providerId: string;
  label: string;
  image?: string | null;
  providerName?: string | null;
  providerAvatarUrl?: string | null;
  providerLocation?: string | null;
  isLive?: boolean;
}

export interface MarketplaceProviderCardItem {
  id: string;
  companyName: string;
  headline?: string | null;
  role: string;
  image?: string | null;
  avatarUrl?: string | null;
  rating: number;
  reviews: number;
  badge?: string | null;
  location?: string | null;
  verified: boolean;
  startingPrice?: number | null;
  yearsOfExperience?: number | null;
  responseTimeLabel?: string | null;
  badges?: Array<'verified' | 'top_rated' | 'fast_response'>;
}

export interface MarketplaceQuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  onClick: () => void;
}
