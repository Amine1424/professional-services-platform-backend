import Image from "next/image";
import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";
import { SearchBar } from "./search-bar";
import { Badge } from "@/components/ui/badge";
import type { Provider } from "@/lib/types";

interface HeroSectionProps {
  heroProvider: Provider | null;
}

export function HeroSection({ heroProvider }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background pb-16 pt-12 lg:pb-24 lg:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Content */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Find trusted local service providers
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Connect with verified professionals for home repairs, cleaning, landscaping, and more. 
                Read reviews, compare prices, and book with confidence.
              </p>
            </div>

            {/* Search Bar */}
            <SearchBar />

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span>Verified providers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span>5-star rated professionals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">10,000+</span>
                <span>successful bookings</span>
              </div>
            </div>
          </div>

          {/* Right Column - Featured Provider Card */}
          {heroProvider && (
            <div className="relative hidden lg:block">
              <Link
                href={`/providers/${heroProvider.slug}`}
                className="group block overflow-hidden rounded-2xl shadow-2xl transition-transform hover:scale-[1.02]"
              >
                {/* Cover Image */}
                <div className="relative aspect-[4/3]">
                  <Image
                    src={heroProvider.coverImageUrl}
                    alt={`${heroProvider.name} - ${heroProvider.headline}`}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-end gap-4">
                      {/* Avatar */}
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg">
                        <Image
                          src={heroProvider.avatarUrl}
                          alt={heroProvider.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-white">
                            {heroProvider.name}
                          </h3>
                          {heroProvider.badges.includes("verified") && (
                            <BadgeCheck className="h-5 w-5 shrink-0 text-blue-400" />
                          )}
                        </div>
                        <p className="truncate text-sm text-white/80">
                          {heroProvider.headline}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-white">
                              {heroProvider.rating}
                            </span>
                            <span className="text-sm text-white/60">
                              ({heroProvider.reviewCount})
                            </span>
                          </div>
                          <span className="text-white/40">|</span>
                          <span className="text-sm text-white/80">
                            {heroProvider.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {heroProvider.badges.slice(0, 3).map((badge) => (
                        <Badge
                          key={badge}
                          variant="secondary"
                          className="bg-white/20 text-white backdrop-blur-sm"
                        >
                          {badge.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* Decorative Elements */}
              <div className="absolute -right-4 -top-4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 -z-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
