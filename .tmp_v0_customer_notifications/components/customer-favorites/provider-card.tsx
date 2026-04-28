"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  CheckCircle2, 
  Star, 
  MapPin, 
  Clock, 
  MessageSquare, 
  FileText,
  MoreHorizontal,
  Trash2,
  ExternalLink
} from "lucide-react"
import type { FavoriteProvider } from "@/lib/mock-data"

interface ProviderCardProps {
  provider: FavoriteProvider
  onRemove: (providerId: string) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatSavedDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Saved today"
  if (diffDays === 1) return "Saved yesterday"
  if (diffDays < 7) return `Saved ${diffDays} days ago`
  if (diffDays < 30) return `Saved ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ProviderCard({ provider, onRemove }: ProviderCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    // Simulate async removal
    setTimeout(() => {
      onRemove(provider.id)
    }, 150)
  }

  return (
    <Card className={`p-4 transition-all ${isRemoving ? "opacity-50 scale-98" : ""}`}>
      {/* Provider Identity */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {getInitials(provider.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate">{provider.name}</h3>
            {provider.isVerified && (
              <CheckCircle2 className="size-4 text-primary shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <Star className="size-3.5 text-warning fill-warning" />
              <span className="text-sm font-medium text-foreground">{provider.rating}</span>
              <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleRemove} className="text-destructive focus:text-destructive">
              <Trash2 className="size-4 mr-2" />
              Remove from shortlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Location & Response Time */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <MapPin className="size-3.5" />
          <span className="truncate">{provider.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="size-3.5" />
          <span>{provider.responseTime}</span>
        </div>
      </div>

      {/* Category Badge */}
      <Badge variant="secondary" className="mb-3 text-xs">
        {provider.category}
      </Badge>

      {/* Saved Date - Low Emphasis */}
      <p className="text-xs text-muted-foreground/70 mb-4">
        {formatSavedDate(provider.savedAt)}
      </p>

      {/* Action Hierarchy */}
      <div className="flex items-center gap-2">
        {/* Primary Action */}
        <Button className="flex-1" size="sm">
          <ExternalLink className="size-3.5 mr-1.5" />
          View Profile
        </Button>
        
        {/* Secondary Actions */}
        <Button variant="outline" size="sm" className="px-3">
          <MessageSquare className="size-3.5" />
          <span className="sr-only">Message</span>
        </Button>
        
        <Button variant="outline" size="sm" className="px-3">
          <FileText className="size-3.5" />
          <span className="sr-only">Request Service</span>
        </Button>
      </div>
    </Card>
  )
}
