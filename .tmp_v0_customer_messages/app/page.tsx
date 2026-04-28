import { ContinuationHeader } from "@/components/dashboard/continuation-header"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ProviderSpotlight } from "@/components/dashboard/provider-spotlight"
import { StoriesSection } from "@/components/dashboard/stories-section"
import { FeaturedServices } from "@/components/dashboard/featured-services"
import { RecentReviews } from "@/components/dashboard/recent-reviews"
import { AppTopNav } from "@/components/app-top-nav"

export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <AppTopNav unreadMessages={2} activeRequests={3} />
      
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Section 1: Continuation Header */}
          <section className="mb-6">
            <ContinuationHeader customerName="Karim" />
          </section>

          {/* Section 2: Quick Actions - Primary CTA Row */}
          <section className="mb-8">
            <QuickActions />
          </section>

          {/* Section 3: Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Stories & Featured Services */}
            <div className="space-y-6 lg:col-span-2">
              {/* Stories - Trust & Engagement */}
              <StoriesSection />

              {/* Featured Services - Conversion Shortcuts */}
              <FeaturedServices />
            </div>

            {/* Right Column - Provider Spotlight & Reviews */}
            <div className="space-y-6">
              {/* Trusted Provider Spotlight */}
              <ProviderSpotlight />

              {/* Compact Trust Proof */}
              <RecentReviews />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
