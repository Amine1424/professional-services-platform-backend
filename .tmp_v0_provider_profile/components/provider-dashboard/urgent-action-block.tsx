import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  MessageSquare,
  FileText,
  ChevronRight,
} from "lucide-react"

interface UrgentItem {
  type: "request" | "message" | "moderation"
  count?: number
  label: string
  description: string
  href: string
  urgent: boolean
}

interface UrgentActionBlockProps {
  items: UrgentItem[]
}

export function UrgentActionBlock({ items }: UrgentActionBlockProps) {
  const urgentItems = items.filter((item) => item.urgent || (item.count && item.count > 0))

  if (urgentItems.length === 0) {
    return null
  }

  const getIcon = (type: UrgentItem["type"]) => {
    switch (type) {
      case "request":
        return FileText
      case "message":
        return MessageSquare
      case "moderation":
        return AlertCircle
    }
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="size-4 text-warning-foreground" />
          <span className="text-sm font-medium text-warning-foreground">
            Needs Your Attention
          </span>
        </div>
        <div className="space-y-2">
          {urgentItems.map((item, index) => {
            const Icon = getIcon(item.type)
            return (
              <a
                key={index}
                href={item.href}
                className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.label}
                      </span>
                      {item.count && item.count > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
