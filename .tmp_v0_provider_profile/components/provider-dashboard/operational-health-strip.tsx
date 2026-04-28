import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react"

interface HealthMetric {
  id: string
  label: string
  value: string | number
  status: "good" | "warning" | "critical"
  type: "text" | "progress" | "rating"
  progress?: number
  icon: "check" | "alert" | "clock" | "star" | "trend"
}

interface OperationalHealthStripProps {
  metrics: HealthMetric[]
}

export function OperationalHealthStrip({ metrics }: OperationalHealthStripProps) {
  const getIcon = (icon: HealthMetric["icon"]) => {
    switch (icon) {
      case "check":
        return CheckCircle2
      case "alert":
        return AlertTriangle
      case "clock":
        return Clock
      case "star":
        return Star
      case "trend":
        return TrendingUp
    }
  }

  const getStatusColor = (status: HealthMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-success-foreground"
      case "warning":
        return "text-warning-foreground"
      case "critical":
        return "text-destructive"
    }
  }

  const getProgressColor = (status: HealthMetric["status"]) => {
    switch (status) {
      case "good":
        return "[&>[data-slot=progress-indicator]]:bg-success"
      case "warning":
        return "[&>[data-slot=progress-indicator]]:bg-warning"
      case "critical":
        return "[&>[data-slot=progress-indicator]]:bg-destructive"
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Operational Health
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = getIcon(metric.icon)
            return (
              <div key={metric.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${getStatusColor(metric.status)}`} />
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                {metric.type === "progress" && metric.progress !== undefined ? (
                  <div className="space-y-1">
                    <Progress
                      value={metric.progress}
                      className={`h-1.5 ${getProgressColor(metric.status)}`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {metric.value}
                    </span>
                  </div>
                ) : metric.type === "rating" ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {metric.value}
                    </span>
                    <Star className="size-3.5 fill-warning text-warning" />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {metric.value}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
