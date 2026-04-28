import Link from "next/link"
import { ProfileContent } from "@/components/provider-profile"

export default function ProviderProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Demo Navigation - Would be part of shell in production */}
      <nav className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-6">
          <span className="text-sm font-semibold text-foreground">Provider Workspace</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/provider/profile" className="font-medium text-primary">Profile</Link>
          </div>
        </div>
      </nav>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <ProfileContent />
      </div>
    </main>
  )
}
