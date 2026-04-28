import Image from "next/image";
import Link from "next/link";
import { Star, BadgeCheck, Zap, Clock, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Provider, ProviderBadge } from "@/lib/types";

const badgeConfig: Record<ProviderBadge, { icon: typeof BadgeCheck; label: string; className: string }> = {
  verified: { icon: BadgeCheck, label: "Verified", className: "bg-blue-100 text-blue-700" },
  instant_booking: { icon: Zap, label: "Instant Book", className: "bg-amber-100 text-amber-700" },
  top_rated: { icon: Award, label: "Top Rated", className: "bg-emerald-100 text-emerald-700" },
  fast_response: { icon: Clock, label: "Fast Response", className: "bg-purple-100 text-purple-700" },
  superhost: { icon: Star, label: "Superhost", className: "bg-rose-100 text-rose-700" },
};

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Link href={`/providers/${provider.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={provider.coverImageUrl}
            alt={`${provider.name} - ${provider.headline}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Starting Price */}
          {provider.startingPrice && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-sm font-medium text-foreground backdrop-blur-sm">
              From ${provider.startingPrice}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative p-4">
          {/* Avatar - overlapping cover */}
          <div className="absolute -top-8 left-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border-3 border-card bg-card shadow-md">
              <Image
                src={provider.avatarUrl}
                alt={provider.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="mt-6">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{provider.name}</h3>
              {provider.badges.includes("verified") && (
                <BadgeCheck className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
              {provider.headline}
            </p>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-foreground">
                  {provider.rating}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({provider.reviewCount} reviews)
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">
                {provider.location}
              </span>
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {provider.badges.slice(0, 3).map((badge) => {
                const config = badgeConfig[badge];
                const Icon = config.icon;
                return (
                  <Badge
                    key={badge}
                    variant="secondary"
                    className={`gap-1 text-xs ${config.className}`}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                );
              })}
            </div>

            {/* Response Time */}
            {provider.responseTime && (
              <p className="mt-3 text-xs text-muted-foreground">
                {provider.responseTime}
              </p>
            )}

            {/* CTA */}
            <Button className="mt-4 w-full" variant="outline">
              View Profile
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
