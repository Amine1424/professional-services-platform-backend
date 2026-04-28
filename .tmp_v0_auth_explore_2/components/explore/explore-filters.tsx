"use client";

import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { categoryListData } from "@/lib/mock-data";

interface ExploreFiltersProps {
  onClose?: () => void;
}

const trustFilters = [
  { id: "verified", label: "Verified Only" },
  { id: "top_rated", label: "Top Rated" },
  { id: "fast_response", label: "Fast Response" },
  { id: "instant_booking", label: "Instant Booking" },
];

const ratingFilters = [
  { id: "4.5", label: "4.5+ Stars" },
  { id: "4.0", label: "4.0+ Stars" },
  { id: "3.5", label: "3.5+ Stars" },
];

export function ExploreFilters({ onClose }: ExploreFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTrust, setSelectedTrust] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<string>("");

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTrust = (trustId: string) => {
    setSelectedTrust((prev) =>
      prev.includes(trustId)
        ? prev.filter((id) => id !== trustId)
        : [...prev, trustId]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTrust([]);
    setSelectedRating("");
  };

  const hasFilters = selectedCategories.length > 0 || selectedTrust.length > 0 || selectedRating;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:hidden">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Categories</h4>
        <div className="flex flex-wrap gap-2">
          {categoryListData.categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Trust Signals */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Trust Signals</h4>
        <div className="space-y-2">
          {trustFilters.map((filter) => (
            <label key={filter.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedTrust.includes(filter.id)}
                onCheckedChange={() => toggleTrust(filter.id)}
              />
              <span className="text-sm text-foreground">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Minimum Rating</h4>
        <div className="space-y-2">
          {ratingFilters.map((filter) => (
            <label key={filter.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={filter.id}
                checked={selectedRating === filter.id}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="h-4 w-4 text-primary border-muted-foreground/30 focus:ring-primary"
              />
              <span className="text-sm text-foreground">{filter.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply Button (Mobile) */}
      <Button className="w-full sm:hidden" onClick={onClose}>
        Apply Filters
      </Button>
    </div>
  );
}
