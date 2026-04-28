"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  CheckCircle2,
  Circle,
  ChevronRight,
  User,
  Image,
  FileText,
  MapPin,
  Clock,
  Star,
} from "lucide-react"

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  weight: number
  category: "identity" | "visual" | "location" | "response" | "trust"
  actionLabel?: string
  scrollTo?: string
}

interface TrustChecklistSidebarProps {
  items: ChecklistItem[]
  onScrollTo: (elementId: string) => void
}

export function TrustChecklistSidebar({
  items,
  onScrollTo,
}: TrustChecklistSidebarProps) {
  const completedWeight = items
    .filter((item) => item.completed)
    .reduce((acc, item) => acc + item.weight, 0)
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0)
  const score = Math.round((completedWeight / totalWeight) * 100)

  const incompleteItems = items.filter((item) => !item.completed)
  const completedCount = items.filter((item) => item.completed).length

  const categoryConfig = {
    identity: { icon: User, label: "Identity" },
    visual: { icon: Image, label: "Visual" },
    location: { icon: MapPin, label: "Location" },
    response: { icon: Clock, label: "Response" },
    trust: { icon: Shield, label: "Trust" },
  }

  return (
    <Card className="sticky top-6 border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <CardTitle className="text-sm">Profile Completeness</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tabular-nums text-foreground">{score}%</span>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{items.length} complete
            </span>
          </div>
          <Progress
            value={score}
            className={`h-2 ${
              score >= 80
                ? "[&>[data-slot=progress-indicator]]:bg-success"
                : score >= 50
                  ? "[&>[data-slot=progress-indicator]]:bg-warning"
                  : "[&>[data-slot=progress-indicator]]:bg-destructive"
            }`}
          />
        </div>

        {/* Status Message */}
        <div
          className={`rounded-lg p-3 text-sm ${
            score >= 80
              ? "bg-success/10 text-success"
              : score >= 50
                ? "bg-warning/10 text-warning-foreground"
                : "bg-destructive/10 text-destructive"
          }`}
        >
          {score >= 80 ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              <span className="font-medium">Your profile is ready for customers</span>
            </div>
          ) : score >= 50 ? (
            <span>A few more items will make your profile stand out</span>
          ) : (
            <span>Complete the essentials to get discovered</span>
          )}
        </div>

        {/* Incomplete Items */}
        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              To improve your score:
            </p>
            <div className="space-y-1.5">
              {incompleteItems.map((item) => {
                const category = categoryConfig[item.category]
                const Icon = category.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => item.scrollTo && onScrollTo(item.scrollTo)}
                    className="group flex w-full items-center justify-between rounded-md border border-border/50 bg-secondary/30 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-2">
                      <Circle className="size-3 text-muted-foreground" />
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">{item.label}</span>
                    </div>
                    <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* All Complete */}
        {incompleteItems.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">All items complete:</p>
            <div className="space-y-1">
              {items.map((item) => {
                const category = categoryConfig[item.category]
                const Icon = category.icon
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="size-3 text-success" />
                    <Icon className="size-3" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Review tip */}
        {score >= 80 && (
          <div className="border-t border-border pt-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Star className="mt-0.5 size-3 shrink-0 text-primary" />
              <span>
                Tip: Ask satisfied customers for reviews to boost your profile further
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
