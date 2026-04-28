import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Eye,
  TrendingUp,
  ChevronRight,
  Zap,
} from "lucide-react"

interface GrowthVisibilityBlockProps {
  currentPlan: string
  planFeatures: string[]
  profileViews: number
  viewsTrend: "up" | "down" | "stable"
  canUpgrade: boolean
}

export function GrowthVisibilityBlock({
  currentPlan,
  planFeatures,
  profileViews,
  viewsTrend,
  canUpgrade,
}: GrowthVisibilityBlockProps) {
  const trendConfig = {
    up: { icon: TrendingUp, label: "+12%", className: "text-success-foreground" },
    down: { icon: TrendingUp, label: "-8%", className: "text-destructive rotate-180" },
    stable: { icon: TrendingUp, label: "0%", className: "text-muted-foreground" },
  }

  const trend = trendConfig[viewsTrend]
  const TrendIcon = trend.icon

  return (
    <Card className="border-border/50 bg-secondary/20">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Growth & Visibility
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentPlan}
          </Badge>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Eye className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Profile Views</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                {profileViews.toLocaleString()}
              </span>
              <span className={`flex items-center text-xs ${trend.className}`}>
                <TrendIcon className="size-3" />
                {trend.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Plan Features</span>
            </div>
            <ul className="space-y-0.5">
              {planFeatures.slice(0, 2).map((feature, index) => (
                <li key={index} className="text-xs text-foreground">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {canUpgrade && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 text-primary hover:bg-primary/5"
            asChild
          >
            <a href="/provider/subscription">
              Upgrade for More Visibility
              <ChevronRight className="ml-1 size-3.5" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
