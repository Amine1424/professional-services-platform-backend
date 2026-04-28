"use client"

import { OperationalHeader } from "./operational-header"
import { UrgentActionBlock } from "./urgent-action-block"
import { WorkflowEntries } from "./workflow-entries"
import { OperationalHealthStrip } from "./operational-health-strip"
import { TrustCompletenessBlock } from "./trust-completeness-block"
import { GrowthVisibilityBlock } from "./growth-visibility-block"
import { RecentServices } from "./recent-services"

// This would come from /providers/me/dashboard API
const mockDashboardData = {
  provider: {
    name: "Ahmed",
    accountStatus: "active" as const,
    responseTime: "2h avg",
    profileCompletion: 78,
  },
  urgent: {
    pendingRequests: 3,
    unreadMessages: 5,
    moderationIssues: 0,
  },
  health: {
    responseTime: "2h",
    responseTimeStatus: "good" as const,
    rating: 4.8,
    ratingStatus: "good" as const,
    profileScore: 78,
    profileStatus: "warning" as const,
    serviceHealth: "4/5 active",
    serviceStatus: "good" as const,
  },
  trust: {
    overallScore: 78,
    publicReadiness: "almost" as const,
    items: [
      { id: "1", label: "Profile photo", completed: true, icon: "profile" as const },
      { id: "2", label: "Bio description", completed: true, icon: "profile" as const },
      { id: "3", label: "Contact info", completed: true, icon: "profile" as const },
      { id: "4", label: "ID verification", completed: false, icon: "verification" as const, href: "/provider/verification" },
      { id: "5", label: "Portfolio items (3+)", completed: false, icon: "portfolio" as const, href: "/provider/portfolio" },
      { id: "6", label: "Service descriptions", completed: true, icon: "services" as const },
      { id: "7", label: "Pricing details", completed: false, icon: "services" as const, href: "/provider/services" },
    ],
  },
  visibility: {
    currentPlan: "Professional",
    planFeatures: ["Priority listing", "Featured badge", "Analytics"],
    profileViews: 1247,
    viewsTrend: "up" as const,
    canUpgrade: true,
  },
  services: {
    total: 5,
    recent: [
      { id: "1", title: "Home Plumbing Repair", status: "published" as const, category: "Plumbing", inquiries: 12 },
      { id: "2", title: "Emergency Pipe Fix", status: "published" as const, category: "Plumbing", inquiries: 8 },
      { id: "3", title: "Bathroom Renovation", status: "draft" as const, category: "Renovation", inquiries: 0 },
    ],
  },
}

export function DashboardContent() {
  const data = mockDashboardData

  const urgentItems = [
    {
      type: "request" as const,
      count: data.urgent.pendingRequests,
      label: "Pending Requests",
      description: "New service requests waiting for response",
      href: "/provider/requests",
      urgent: data.urgent.pendingRequests > 0,
    },
    {
      type: "message" as const,
      count: data.urgent.unreadMessages,
      label: "Unread Messages",
      description: "Client conversations need attention",
      href: "/provider/messages",
      urgent: data.urgent.unreadMessages > 0,
    },
    {
      type: "moderation" as const,
      count: data.urgent.moderationIssues,
      label: "Account Issues",
      description: "Review required for account status",
      href: "/provider/account",
      urgent: data.urgent.moderationIssues > 0,
    },
  ]

  const workflowEntries = [
    {
      id: "requests",
      label: "Requests",
      description: "View and respond to client requests",
      href: "/provider/requests",
      icon: "requests" as const,
      badge: data.urgent.pendingRequests > 0 ? { count: data.urgent.pendingRequests } : undefined,
    },
    {
      id: "inbox",
      label: "Inbox",
      description: "Messages from clients",
      href: "/provider/messages",
      icon: "inbox" as const,
      badge: data.urgent.unreadMessages > 0 ? { count: data.urgent.unreadMessages } : undefined,
    },
    {
      id: "profile",
      label: "Profile",
      description: "Update your public profile",
      href: "/provider/profile",
      icon: "profile" as const,
    },
    {
      id: "services",
      label: "Services",
      description: "Manage your service offerings",
      href: "/provider/services",
      icon: "services" as const,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      description: "Showcase your work",
      href: "/provider/portfolio",
      icon: "portfolio" as const,
    },
  ]

  const healthMetrics = [
    {
      id: "response",
      label: "Response Time",
      value: data.health.responseTime,
      status: data.health.responseTimeStatus,
      type: "text" as const,
      icon: "clock" as const,
    },
    {
      id: "rating",
      label: "Rating",
      value: data.health.rating,
      status: data.health.ratingStatus,
      type: "rating" as const,
      icon: "star" as const,
    },
    {
      id: "profile",
      label: "Profile",
      value: `${data.health.profileScore}%`,
      status: data.health.profileStatus,
      type: "progress" as const,
      progress: data.health.profileScore,
      icon: "trend" as const,
    },
    {
      id: "services",
      label: "Services",
      value: data.health.serviceHealth,
      status: data.health.serviceStatus,
      type: "text" as const,
      icon: "check" as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Compact Operational Header */}
      <OperationalHeader
        providerName={data.provider.name}
        accountStatus={data.provider.accountStatus}
        responseTime={data.provider.responseTime}
        profileCompletion={data.provider.profileCompletion}
        pendingRequests={data.urgent.pendingRequests}
      />

      {/* Urgent Action Block - Only shows if there are urgent items */}
      <UrgentActionBlock items={urgentItems} />

      {/* Core Workflow Entries */}
      <WorkflowEntries entries={workflowEntries} />

      {/* Operational Health Strip */}
      <OperationalHealthStrip metrics={healthMetrics} />

      {/* Two Column Layout for Trust + Growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trust & Completeness Block */}
        <TrustCompletenessBlock
          overallScore={data.trust.overallScore}
          items={data.trust.items}
          publicReadiness={data.trust.publicReadiness}
        />

        {/* Growth & Visibility Block (Secondary) */}
        <GrowthVisibilityBlock
          currentPlan={data.visibility.currentPlan}
          planFeatures={data.visibility.planFeatures}
          profileViews={data.visibility.profileViews}
          viewsTrend={data.visibility.viewsTrend}
          canUpgrade={data.visibility.canUpgrade}
        />
      </div>

      {/* Recent Services (Supporting Content) */}
      <RecentServices
        services={data.services.recent}
        totalServices={data.services.total}
      />
    </div>
  )
}
