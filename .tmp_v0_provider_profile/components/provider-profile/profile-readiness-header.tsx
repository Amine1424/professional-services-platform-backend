"use client"

import { Shield, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface ProfileReadinessHeaderProps {
  businessName: string
  profileScore: number
  publicReadiness: "ready" | "almost" | "needs_work"
  viewsThisWeek: number
  onPreviewClick: () => void
}

export function ProfileReadinessHeader({
  businessName,
  profileScore,
  publicReadiness,
  viewsThisWeek,
  onPreviewClick,
}: ProfileReadinessHeaderProps) {
  const readinessConfig = {
    ready: {
      label: "Public Ready",
      description: "Your profile is complete and visible to customers",
      icon: CheckCircle2,
      className: "text-success bg-success/10 border-success/20",
      iconClass: "text-success",
    },
    almost: {
      label: "Almost Ready",
      description: "A few improvements will boost your visibility",
      icon: AlertCircle,
      className: "text-warning-foreground bg-warning/10 border-warning/20",
      iconClass: "text-warning",
    },
    needs_work: {
      label: "Needs Attention",
      description: "Complete required fields to go public",
      icon: AlertCircle,
      className: "text-destructive bg-destructive/10 border-destructive/20",
      iconClass: "text-destructive",
    },
  }

  const readiness = readinessConfig[publicReadiness]
  const ReadinessIcon = readiness.icon

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Business Identity + Readiness */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Public Profile
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground text-balance">
              {businessName}
            </h1>
          </div>

          {/* Readiness Badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${readiness.className}`}
          >
            <ReadinessIcon className={`size-4 ${readiness.iconClass}`} />
            <div>
              <p className="text-sm font-medium">{readiness.label}</p>
              <p className="text-xs opacity-80">{readiness.description}</p>
            </div>
          </div>
        </div>

        {/* Right: Score + Preview */}
        <div className="flex items-center gap-6">
          {/* Profile Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-1.5">
                <Shield className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Profile Score
                </span>
              </div>
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {profileScore}%
              </span>
            </div>
            <Progress
              value={profileScore}
              className={`h-2 w-40 ${
                profileScore >= 80
                  ? "[&>[data-slot=progress-indicator]]:bg-success"
                  : profileScore >= 50
                    ? "[&>[data-slot=progress-indicator]]:bg-warning"
                    : "[&>[data-slot=progress-indicator]]:bg-destructive"
              }`}
            />
            <p className="text-xs text-muted-foreground">
              {viewsThisWeek} profile views this week
            </p>
          </div>

          {/* Preview Button */}
          <Button
            variant="outline"
            onClick={onPreviewClick}
            className="gap-2"
          >
            <Eye className="size-4" />
            Preview Public Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
