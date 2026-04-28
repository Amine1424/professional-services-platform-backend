"use client";

import { useState } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations } from "@/lib/mock-data";

interface ExploreSearchProps {
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
}

export function ExploreSearch({ onToggleFilters, filtersOpen }: ExploreSearchProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="What service do you need?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Location Select */}
      <div className="relative sm:w-48">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="h-11">
            <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" className="h-11 px-6">
          Search
        </Button>
        <Button
          type="button"
          variant={filtersOpen ? "secondary" : "outline"}
          className="h-11"
          onClick={onToggleFilters}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Filters</span>
        </Button>
      </div>
    </form>
  );
}
