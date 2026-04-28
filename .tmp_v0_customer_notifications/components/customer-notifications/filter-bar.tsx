"use client"

import { cn } from "@/lib/utils"
import { 
  MessageSquare, 
  FileText, 
  MessageCircle, 
  Heart,
  Settings,
  CircleDot
} from "lucide-react"
import type { FilterType } from "@/app/notifications/page"

type FilterBarProps = {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: Record<FilterType, number>
}

const filters: { 
  value: FilterType
  label: string
  icon?: React.ComponentType<{ className?: string }>
}[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread", icon: CircleDot },
  { value: "message", label: "Messages", icon: MessageSquare },
  { value: "request", label: "Requests", icon: FileText },
  { value: "comment", label: "Comments", icon: MessageCircle },
  { value: "favorite_provider_update", label: "Providers", icon: Heart },
  { value: "system", label: "System", icon: Settings },
]

export function FilterBar({ activeFilter, onFilterChange, counts }: FilterBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filters.map(({ value, label, icon: Icon }) => {
          const count = counts[value]
          const isActive = activeFilter === value
          
          // Hide filters with 0 items (except "all" and "unread")
          if (count === 0 && value !== "all" && value !== "unread") {
            return null
          }

          return (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {label}
              {count > 0 && value !== "all" && (
                <span className={cn(
                  "text-xs",
                  isActive ? "text-background/70" : "text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
