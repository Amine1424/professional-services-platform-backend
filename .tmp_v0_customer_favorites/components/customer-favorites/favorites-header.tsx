import { Bookmark } from "lucide-react"

interface FavoritesHeaderProps {
  providerCount: number
}

export function FavoritesHeader({ providerCount }: FavoritesHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10">
          <Bookmark className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Saved Providers</h1>
          <p className="text-sm text-muted-foreground">
            {providerCount} {providerCount === 1 ? "provider" : "providers"} in your shortlist
          </p>
        </div>
      </div>
    </header>
  )
}
