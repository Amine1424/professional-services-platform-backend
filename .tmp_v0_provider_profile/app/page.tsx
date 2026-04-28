import Link from "next/link"
import { DashboardContent } from "@/components/provider-dashboard/dashboard-content"

/**
 * Provider Dashboard Content Area
 * 
 * This is the CONTENT AREA ONLY for /provider/dashboard.
 * The shell (sidebar, header, global chrome) is preserved separately.
 * 
 * Page Role: Provider operations home / control desk
 * Page Goal: Help provider understand business health and know where to act next
 * 
 * Section Order:
 * 1. Compact operational header (status, response time, next action)
 * 2. Urgent action block (pending requests, unread messages, moderation)
 * 3. Core workflow entries (requests, inbox, profile, services, portfolio)
 * 4. Operational health strip (response time, rating, profile, services)
 * 5. Trust & completeness block (profile score, verification, portfolio)
 * 6. Growth & visibility block (plan, views, upgrade - secondary priority)
 * 7. Recent services (supporting content)
 */
export default function ProviderDashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Demo Navigation - Would be part of shell in production */}
      <nav className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="text-sm font-semibold text-foreground">Provider Workspace</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="font-medium text-primary">Dashboard</Link>
            <Link href="/provider/profile" className="text-muted-foreground hover:text-foreground">Profile</Link>
          </div>
        </div>
      </nav>
      {/* 
        This wrapper simulates the content area within the existing provider shell.
        The actual shell provides the sidebar and header.
        Max width and padding would be controlled by the shell in production.
      */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <DashboardContent />
      </div>
    </main>
  )
}
