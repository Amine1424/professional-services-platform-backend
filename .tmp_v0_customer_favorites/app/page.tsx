import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Bookmark, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Professional Services Platform
          </h1>
          <p className="text-muted-foreground">
            Customer content area demos
          </p>
        </div>

        <div className="grid gap-4">
          {/* Orders Page */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
                <FileText className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  My Requests
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Request decision workspace with list+detail layout. Review service requests, provider quotes, and make accept/reject decisions.
                </p>
                <Button asChild>
                  <Link href="/orders">
                    View Requests
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Favorites Page */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
                <Bookmark className="size-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Saved Providers
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Shortlist reactivation workspace. Compare saved providers, reopen the pipeline, and quickly message or request service.
                </p>
                <Button asChild>
                  <Link href="/favorites">
                    View Shortlist
                    <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
