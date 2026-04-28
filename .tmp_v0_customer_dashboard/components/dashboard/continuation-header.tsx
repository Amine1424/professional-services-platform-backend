"use client"

import { Sparkles } from "lucide-react"

interface ContinuationHeaderProps {
  customerName?: string
}

export function ContinuationHeader({ customerName = "there" }: ContinuationHeaderProps) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {greeting}, {customerName}
        </h1>
        <Sparkles className="size-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">
        Continue where you left off or explore new services
      </p>
    </div>
  )
}
