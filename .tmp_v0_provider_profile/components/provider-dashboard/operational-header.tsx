import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Shield,
} from "lucide-react"

interface OperationalHeaderProps {
  providerName: string
  accountStatus: "active" | "pending_review" | "suspended" | "needs_verification"
  responseTime: string
  profileCompletion: number
  pendingRequests: number
}

export function OperationalHeader({
  providerName,
  accountStatus,
  responseTime,
  profileCompletion,
  pendingRequests,
}: OperationalHeaderProps) {
  const statusConfig = {
    active: {
      label: "Active",
      icon: CheckCircle2,
      className: "bg-success/10 text-success-foreground border-success/20",
    },
    pending_review: {
      label: "Under Review",
      icon: Clock,
      className: "bg-warning/10 text-warning-foreground border-warning/20",
    },
    suspended: {
      label: "Suspended",
      icon: AlertTriangle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    needs_verification: {
      label: "Verification Required",
      icon: Shield,
      className: "bg-warning/10 text-warning-foreground border-warning/20",
    },
  }

  const status = statusConfig[accountStatus]
  const StatusIcon = status.icon

  const getNextAction = () => {
    if (accountStatus === "needs_verification") {
      return { label: "Complete Verification", href: "/provider/verification" }
    }
    if (accountStatus === "suspended") {
      return { label: "View Account Status", href: "/provider/account" }
    }
    if (pendingRequests > 0) {
      return { label: `View ${pendingRequests} Request${pendingRequests > 1 ? "s" : ""}`, href: "/provider/requests" }
    }
    if (profileCompletion < 100) {
      return { label: "Complete Profile", href: "/provider/profile" }
    }
    return { label: "View Requests", href: "/provider/requests" }
  }

  const nextAction = getNextAction()

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back, {providerName}
          </h1>
          <Badge variant="outline" className={status.className}>
            <StatusIcon className="size-3" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Avg. response: {responseTime}
          </span>
          <span className="text-border">•</span>
          <span>Profile: {profileCompletion}% complete</span>
        </div>
      </div>
      <Button asChild className="w-full sm:w-auto">
        <a href={nextAction.href}>
          {nextAction.label}
          <ChevronRight className="ml-1 size-4" />
        </a>
      </Button>
    </div>
  )
}
