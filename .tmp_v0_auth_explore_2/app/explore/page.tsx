"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Grid3X3, List, X } from "lucide-react";
import { PublicMarketplaceLayout } from "@/components/layout/public-marketplace-layout";
import { ExploreSearch } from "@/components/explore/explore-search";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { ExploreResultCard } from "@/components/explore/explore-result-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { homePageData, categoryListData } from "@/lib/mock-data";

export default function ExplorePage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("relevance");

  // Mock active filters for demo
  const [activeFilters, setActiveFilters] = useState<string[]>(["Plumbing"]);

  const removeFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  const providers = homePageData.featuredProviders;
  const resultCount = providers.length;

  return (
    <PublicMarketplaceLayout>
      <div className="min-h-screen bg-background">
        {/* Search Hero - Compact */}
        <div className="border-b border-border bg-card/50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <ExploreSearch
              onToggleFilters={() => setFiltersOpen(!filtersOpen)}
              filtersOpen={filtersOpen}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {/* Sidebar Filters - Desktop */}
            <aside
              className={`hidden lg:block lg:w-64 shrink-0 ${
                filtersOpen ? "" : "lg:hidden"
              }`}
            >
              <div className="sticky top-6">
                <ExploreFilters onClose={() => setFiltersOpen(false)} />
              </div>
            </aside>

            {/* Mobile Filters Overlay */}
            {filtersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setFiltersOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-background p-4 overflow-y-auto">
                  <ExploreFilters onClose={() => setFiltersOpen(false)} />
                </div>
              </div>
            )}

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    {resultCount} providers found
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Showing results for your search
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40 h-9">
                      <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border border-border rounded-md">
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9 rounded-r-none"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-9 w-9 rounded-l-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {filter}
                      <button
                        onClick={() => removeFilter(filter)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs h-7"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Results Grid/List */}
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-4 sm:grid-cols-2"
                    : "space-y-4"
                }
              >
                {providers.map((provider) => (
                  <ExploreResultCard key={provider.id} provider={provider} />
                ))}
              </div>

              {/* Load More */}
              <div className="mt-8 flex justify-center">
                <Button variant="outline" size="lg">
                  Load More Providers
                </Button>
              </div>

              {/* Quick Category Links */}
              <div className="mt-12 border-t border-border pt-8">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  Browse by category
                </h2>
                <div className="flex flex-wrap gap-2">
                  {categoryListData.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/explore?category=${category.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {category.name}
                      <span className="text-muted-foreground/60 ml-1">
                        ({category.providerCount})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicMarketplaceLayout>
  );
}
