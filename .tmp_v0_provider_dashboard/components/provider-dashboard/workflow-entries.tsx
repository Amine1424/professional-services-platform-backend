import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageSquare,
  User,
  Briefcase,
  Image,
  ChevronRight,
} from "lucide-react"

interface WorkflowEntry {
  id: string
  label: string
  description: string
  href: string
  icon: "requests" | "inbox" | "profile" | "services" | "portfolio"
  badge?: {
    count: number
    variant?: "default" | "secondary" | "outline"
  }
}

interface WorkflowEntriesProps {
  entries: WorkflowEntry[]
}

export function WorkflowEntries({ entries }: WorkflowEntriesProps) {
  const getIcon = (icon: WorkflowEntry["icon"]) => {
    switch (icon) {
      case "requests":
        return FileText
      case "inbox":
        return MessageSquare
      case "profile":
        return User
      case "services":
        return Briefcase
      case "portfolio":
        return Image
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => {
        const Icon = getIcon(entry.icon)
        return (
          <Card
            key={entry.id}
            className="group transition-colors hover:border-primary/30 hover:bg-accent/30"
          >
            <a href={entry.href} className="block">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {entry.label}
                    </span>
                    {entry.badge && entry.badge.count > 0 && (
                      <Badge
                        variant={entry.badge.variant || "default"}
                        className="h-5 min-w-5 px-1.5 text-xs"
                      >
                        {entry.badge.count}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </a>
          </Card>
        )
      })}
    </div>
  )
}
