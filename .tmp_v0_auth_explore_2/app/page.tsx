import { PublicMarketplaceLayout } from "@/components/layout/public-marketplace-layout";
import { HeroSection } from "@/components/home/hero-section";
import { StoryRail } from "@/components/home/story-rail";
import { QuickActions } from "@/components/home/quick-actions";
import { FeaturedProviders } from "@/components/home/featured-providers";
import { CategoriesSection } from "@/components/home/categories-section";
import { homePageData, categoryListData } from "@/lib/mock-data";

export default function HomePage() {
  // In production, this would fetch from /api/discovery/home and /api/discovery/categories
  const { featuredProviders, stories, quickActions, heroProvider } = homePageData;
  const { categories } = categoryListData;

  return (
    <PublicMarketplaceLayout>
      {/* Hero with Search */}
      <HeroSection heroProvider={heroProvider} />

      {/* Story Rail */}
      <StoryRail stories={stories} />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Featured Providers */}
      <FeaturedProviders providers={featuredProviders} />

      {/* Categories */}
      <CategoriesSection categories={categories} />
    </PublicMarketplaceLayout>
  );
}
