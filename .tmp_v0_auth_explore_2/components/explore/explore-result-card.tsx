import Image from "next/image";
import Link from "next/link";
import { Star, BadgeCheck, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Provider } from "@/lib/types";

interface ExploreResultCardProps {
  provider: Provider;
}

export function ExploreResultCard({ provider }: ExploreResultCardProps) {
  return (
    <div className="group flex gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
      {/* Avatar */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={provider.avatarUrl}
          alt={provider.name}
          fill
          className="object-cover"
        />
        {provider.badges.includes("verified") && (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 border-2 border-card">
            <BadgeCheck className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {provider.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {provider.headline}
            </p>
          </div>
          {provider.startingPrice && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">From</p>
              <p className="font-semibold text-foreground">${provider.startingPrice}</p>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{provider.rating}</span>
            <span className="text-muted-foreground">({provider.reviewCount})</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{provider.location}</span>
          </div>

          {/* Response Time */}
          {provider.responseTime && (
            <span className="text-muted-foreground hidden sm:inline">
              {provider.responseTime}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {provider.badges.slice(0, 3).filter(b => b !== "verified").map((badge) => (
            <Badge key={badge} variant="secondary" className="text-xs capitalize">
              {badge.replace("_", " ")}
            </Badge>
          ))}
          {provider.categories.slice(0, 2).map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button asChild size="sm">
            <Link href={`/providers/${provider.slug}`}>View Profile</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/messages?to=${provider.id}`}>
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Message
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
