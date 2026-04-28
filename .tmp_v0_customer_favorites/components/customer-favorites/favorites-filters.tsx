"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Star } from "lucide-react"
import type { FilterType } from "@/app/favorites/page"

interface FavoritesFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: Record<FilterType, number>
}

const filters: { value: FilterType; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified", icon: <CheckCircle2 className="size-3.5" /> },
  { value: "top-rated", label: "Top Rated", icon: <Star className="size-3.5" /> }
]

export function FavoritesFilters({ activeFilter, onFilterChange, counts }: FavoritesFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeFilter === filter.value
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border"
          )}
        >
          {filter.icon}
          <span>{filter.label}</span>
          <span className={cn(
            "text-xs ml-0.5",
            activeFilter === filter.value ? "text-primary-foreground/70" : "text-muted-foreground/70"
          )}>
            ({counts[filter.value]})
          </span>
        </button>
      ))}
    </div>
  )
}
