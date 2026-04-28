"use client"

import Link from "next/link"
import { AlertCircle, ArrowRight, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/mock-data"

type AttentionBlockProps = {
  urgentItems: Notification[]
  onMarkAsRead: (id: string) => void
}

export function AttentionBlock({ urgentItems, onMarkAsRead }: AttentionBlockProps) {
  if (urgentItems.length === 0) return null

  // Show only the most urgent item prominently
  const primaryItem = urgentItems[0]
  const additionalCount = urgentItems.length - 1

  return (
    <Card className="mb-6 border-primary/20 bg-primary/[0.02]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
            <AlertCircle className="size-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {primaryItem.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {primaryItem.body}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
                onClick={() => onMarkAsRead(primaryItem.id)}
              >
                <X className="size-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Button asChild size="sm">
                <Link href={primaryItem.deepLink.href}>
                  {primaryItem.deepLink.label}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              
              {additionalCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{additionalCount} more needing attention
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
