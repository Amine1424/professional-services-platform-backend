"use client"

import { useState } from "react"
import { FavoritesHeader } from "@/components/customer-favorites/favorites-header"
import { FavoritesFilters } from "@/components/customer-favorites/favorites-filters"
import { ProviderCard } from "@/components/customer-favorites/provider-card"
import { EmptyState } from "@/components/customer-favorites/empty-state"
import { mockFavorites, type FavoriteProvider } from "@/lib/mock-data"

export type FilterType = "all" | "verified" | "top-rated"

export default function CustomerFavoritesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [favorites, setFavorites] = useState<FavoriteProvider[]>(mockFavorites)

  const filteredProviders = favorites.filter(provider => {
    if (activeFilter === "verified") return provider.isVerified
    if (activeFilter === "top-rated") return provider.rating >= 4.5
    return true
  })

  const handleRemoveFavorite = (providerId: string) => {
    setFavorites(prev => prev.filter(p => p.id !== providerId))
  }

  const filterCounts = {
    all: favorites.length,
    verified: favorites.filter(p => p.isVerified).length,
    "top-rated": favorites.filter(p => p.rating >= 4.5).length
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Compact Header */}
        <FavoritesHeader providerCount={favorites.length} />

        {/* Filter Controls */}
        <FavoritesFilters 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Provider Shortlist */}
        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredProviders.map(provider => (
              <ProviderCard 
                key={provider.id} 
                provider={provider}
                onRemove={handleRemoveFavorite}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            type={favorites.length === 0 ? "empty" : "filtered"}
            activeFilter={activeFilter}
          />
        )}
      </div>
    </div>
  )
}
