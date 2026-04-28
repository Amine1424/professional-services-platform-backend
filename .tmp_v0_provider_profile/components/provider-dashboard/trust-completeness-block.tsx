import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Shield,
  CheckCircle2,
  Circle,
  ChevronRight,
  User,
  FileText,
  Image,
  Star,
} from "lucide-react"

interface TrustItem {
  id: string
  label: string
  completed: boolean
  href?: string
  icon: "profile" | "services" | "portfolio" | "reviews" | "verification"
}

interface TrustCompletenessBlockProps {
  overallScore: number
  items: TrustItem[]
  publicReadiness: "ready" | "almost" | "needs_work"
}

export function TrustCompletenessBlock({
  overallScore,
  items,
  publicReadiness,
}: TrustCompletenessBlockProps) {
  const completedCount = items.filter((item) => item.completed).length
  const incompleteItems = items.filter((item) => !item.completed)

  const getIcon = (icon: TrustItem["icon"]) => {
    switch (icon) {
      case "profile":
        return User
      case "services":
        return FileText
      case "portfolio":
        return Image
      case "reviews":
        return Star
      case "verification":
        return Shield
    }
  }

  const readinessConfig = {
    ready: {
      label: "Public Ready",
      className: "text-success-foreground bg-success/10",
    },
    almost: {
      label: "Almost Ready",
      className: "text-warning-foreground bg-warning/10",
    },
    needs_work: {
      label: "Needs Attention",
      className: "text-destructive bg-destructive/10",
    },
  }

  const readiness = readinessConfig[publicReadiness]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Trust & Completeness
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${readiness.className}`}
          >
            {readiness.label}
          </span>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile Score</span>
            <span className="font-medium text-foreground">{overallScore}%</span>
          </div>
          <Progress
            value={overallScore}
            className={
              overallScore >= 80
                ? "[&>[data-slot=progress-indicator]]:bg-success"
                : overallScore >= 50
                  ? "[&>[data-slot=progress-indicator]]:bg-warning"
                  : "[&>[data-slot=progress-indicator]]:bg-destructive"
            }
          />
          <p className="text-xs text-muted-foreground">
            {completedCount} of {items.length} items completed
          </p>
        </div>

        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Complete to improve visibility:
            </p>
            <div className="space-y-1.5">
              {incompleteItems.slice(0, 3).map((item) => {
                const Icon = getIcon(item.icon)
                return (
                  <a
                    key={item.id}
                    href={item.href || "#"}
                    className="group flex items-center justify-between rounded-md border border-border/50 bg-secondary/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="size-3 text-muted-foreground" />
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">{item.label}</span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </a>
                )
              })}
            </div>
            {incompleteItems.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <a href="/provider/profile">
                  View all {incompleteItems.length} items
                  <ChevronRight className="ml-1 size-3" />
                </a>
              </Button>
            )}
          </div>
        )}

        {incompleteItems.length === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3">
            <CheckCircle2 className="size-4 text-success-foreground" />
            <span className="text-sm text-success-foreground">
              Your profile is complete and ready for clients
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
