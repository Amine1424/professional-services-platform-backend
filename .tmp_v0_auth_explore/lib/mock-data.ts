import type {
  Provider,
  Story,
  QuickAction,
  Category,
  HomePageResponse,
  CategoryListResponse,
  Location,
} from "./types";

// Locations for search dropdown
export const locations: Location[] = [
  { id: "1", name: "San Francisco, CA", shortName: "SF" },
  { id: "2", name: "Los Angeles, CA", shortName: "LA" },
  { id: "3", name: "New York, NY", shortName: "NYC" },
  { id: "4", name: "Chicago, IL", shortName: "CHI" },
  { id: "5", name: "Austin, TX", shortName: "ATX" },
  { id: "6", name: "Seattle, WA", shortName: "SEA" },
];

// Featured Providers
const featuredProviders: Provider[] = [
  {
    id: "1",
    slug: "maria-garcia-plumbing",
    name: "Maria Garcia",
    headline: "Licensed Master Plumber - 15+ Years Experience",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=600&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 234,
    badges: ["verified", "top_rated", "fast_response"],
    categories: ["Plumbing", "Emergency Services"],
    location: "San Francisco, CA",
    responseTime: "Usually responds in 1 hour",
    startingPrice: 75,
  },
  {
    id: "2",
    slug: "james-chen-electric",
    name: "James Chen",
    headline: "Certified Electrician - Residential & Commercial",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 189,
    badges: ["verified", "instant_booking"],
    categories: ["Electrical", "Smart Home"],
    location: "San Francisco, CA",
    responseTime: "Usually responds in 2 hours",
    startingPrice: 85,
  },
  {
    id: "3",
    slug: "sarah-johnson-cleaning",
    name: "Sarah Johnson",
    headline: "Professional Deep Cleaning & Organization",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop",
    rating: 5.0,
    reviewCount: 312,
    badges: ["verified", "top_rated", "superhost"],
    categories: ["Cleaning", "Organization"],
    location: "Oakland, CA",
    responseTime: "Usually responds in 30 minutes",
    startingPrice: 45,
  },
  {
    id: "4",
    slug: "michael-brown-hvac",
    name: "Michael Brown",
    headline: "HVAC Specialist - Installation & Repair",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 156,
    badges: ["verified", "fast_response"],
    categories: ["HVAC", "Maintenance"],
    location: "Berkeley, CA",
    responseTime: "Usually responds in 3 hours",
    startingPrice: 95,
  },
  {
    id: "5",
    slug: "emily-davis-landscaping",
    name: "Emily Davis",
    headline: "Landscape Design & Garden Maintenance",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 201,
    badges: ["verified", "top_rated"],
    categories: ["Landscaping", "Gardening"],
    location: "San Jose, CA",
    responseTime: "Usually responds in 4 hours",
    startingPrice: 60,
  },
  {
    id: "6",
    slug: "david-wilson-painting",
    name: "David Wilson",
    headline: "Interior & Exterior Painting Professional",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    coverImageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 178,
    badges: ["verified", "instant_booking"],
    categories: ["Painting", "Home Improvement"],
    location: "Palo Alto, CA",
    responseTime: "Usually responds in 2 hours",
    startingPrice: 55,
  },
];

// Stories
const stories: Story[] = [
  {
    id: "1",
    slug: "kitchen-renovation-timelapse",
    title: "Kitchen Renovation Timelapse",
    thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    provider: {
      id: "1",
      name: "Maria Garcia",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    isLive: true,
    viewCount: 1234,
  },
  {
    id: "2",
    slug: "smart-home-setup",
    title: "Smart Home Setup",
    thumbnailUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=200&h=200&fit=crop",
    provider: {
      id: "2",
      name: "James Chen",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 892,
  },
  {
    id: "3",
    slug: "before-after-deep-clean",
    title: "Before & After Deep Clean",
    thumbnailUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&h=200&fit=crop",
    provider: {
      id: "3",
      name: "Sarah Johnson",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 2156,
  },
  {
    id: "4",
    slug: "ac-maintenance-tips",
    title: "AC Maintenance Tips",
    thumbnailUrl: "https://images.unsplash.com/photo-1631545806609-66cd5d47c5a8?w=200&h=200&fit=crop",
    provider: {
      id: "4",
      name: "Michael Brown",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    },
    isLive: true,
    viewCount: 567,
  },
  {
    id: "5",
    slug: "garden-transformation",
    title: "Garden Transformation",
    thumbnailUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop",
    provider: {
      id: "5",
      name: "Emily Davis",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 1089,
  },
  {
    id: "6",
    slug: "color-consultation",
    title: "Color Consultation Session",
    thumbnailUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&h=200&fit=crop",
    provider: {
      id: "6",
      name: "David Wilson",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 734,
  },
  {
    id: "7",
    slug: "emergency-pipe-repair",
    title: "Emergency Pipe Repair",
    thumbnailUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=200&h=200&fit=crop",
    provider: {
      id: "1",
      name: "Maria Garcia",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 445,
  },
  {
    id: "8",
    slug: "outdoor-lighting-install",
    title: "Outdoor Lighting Install",
    thumbnailUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=200&h=200&fit=crop",
    provider: {
      id: "2",
      name: "James Chen",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    isLive: false,
    viewCount: 623,
  },
];

// Quick Actions
const quickActions: QuickAction[] = [
  {
    id: "1",
    label: "Emergency Services",
    icon: "alert-circle",
    href: "/explore?category=emergency",
    description: "Get help now for urgent issues",
  },
  {
    id: "2",
    label: "Home Repairs",
    icon: "wrench",
    href: "/explore?category=repairs",
    description: "Fix things around the house",
  },
  {
    id: "3",
    label: "Cleaning",
    icon: "sparkles",
    href: "/explore?category=cleaning",
    description: "Professional cleaning services",
  },
  {
    id: "4",
    label: "Outdoor",
    icon: "tree",
    href: "/explore?category=outdoor",
    description: "Landscaping and yard work",
  },
];

// Categories
const categories: Category[] = [
  {
    id: "1",
    slug: "plumbing",
    name: "Plumbing",
    icon: "droplet",
    providerCount: 124,
  },
  {
    id: "2",
    slug: "electrical",
    name: "Electrical",
    icon: "zap",
    providerCount: 98,
  },
  {
    id: "3",
    slug: "cleaning",
    name: "Cleaning",
    icon: "sparkles",
    providerCount: 256,
  },
  {
    id: "4",
    slug: "hvac",
    name: "HVAC",
    icon: "thermometer",
    providerCount: 67,
  },
  {
    id: "5",
    slug: "landscaping",
    name: "Landscaping",
    icon: "tree",
    providerCount: 145,
  },
  {
    id: "6",
    slug: "painting",
    name: "Painting",
    icon: "paintbrush",
    providerCount: 112,
  },
  {
    id: "7",
    slug: "roofing",
    name: "Roofing",
    icon: "home",
    providerCount: 45,
  },
  {
    id: "8",
    slug: "moving",
    name: "Moving",
    icon: "truck",
    providerCount: 78,
  },
];

// Hero Provider (featured in hero section)
const heroProvider: Provider = featuredProviders[0];

// Export mock data matching API response shapes
export const homePageData: HomePageResponse = {
  featuredProviders,
  stories,
  quickActions,
  heroProvider,
};

export const categoryListData: CategoryListResponse = {
  categories,
};
