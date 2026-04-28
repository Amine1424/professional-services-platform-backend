import { Button } from "@/components/ui/button"
import { Bookmark, Search } from "lucide-react"
import type { FilterType } from "@/app/favorites/page"

interface EmptyStateProps {
  type: "empty" | "filtered"
  activeFilter?: FilterType
}

export function EmptyState({ type, activeFilter }: EmptyStateProps) {
  if (type === "filtered") {
    const filterLabels: Record<FilterType, string> = {
      all: "saved",
      verified: "verified",
      "top-rated": "top-rated"
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center size-14 rounded-full bg-muted mb-4">
          <Search className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">
          No {filterLabels[activeFilter || "all"]} providers
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {activeFilter === "verified" 
            ? "None of your saved providers are verified yet."
            : "None of your saved providers match this filter."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center size-14 rounded-full bg-muted mb-4">
        <Bookmark className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">
        No saved providers yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        Save providers while exploring to build your shortlist for quick access later.
      </p>
      <Button>
        <Search className="size-4 mr-2" />
        Explore Providers
      </Button>
    </div>
  )
}
