"use client"

import {
  CheckCircle2,
  Star,
  Clock,
  MessageCircle,
  FileText,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation } from "./types"

interface ContextRailProps {
  conversation: Conversation | null
  onViewProfile: () => void
  onViewService: () => void
  onCreateRequest: () => void
  onViewRequest: () => void
}

function ProviderSummary({ conversation }: { conversation: Conversation }) {
  const { provider } = conversation

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 ring-2 ring-primary/10">
            <AvatarImage src={provider.avatar} alt={provider.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {provider.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate">
                {provider.name}
              </span>
              {provider.verified && (
                <CheckCircle2 className="size-4 text-primary fill-primary/10 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{provider.profession}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Star className="size-4 text-amber-500 fill-amber-500" />
            <div className="text-sm">
              <span className="font-semibold">{provider.rating}</span>
              <span className="text-muted-foreground text-xs ml-1">
                ({provider.reviewCount})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            <Clock className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {provider.responseTime}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full text-sm group" asChild>
          <a href={`/provider/${provider.id}`}>
            View Full Profile
            <ExternalLink className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

function ServiceSummary({
  conversation,
  onViewService,
}: {
  conversation: Conversation
  onViewService: () => void
}) {
  const { service } = conversation
  if (!service) return null

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Service
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        <div className="px-3 py-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">
              {service.category}
            </Badge>
          </div>
          <p className="font-medium text-foreground">{service.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {service.pricingModel === "quote" ? (
              <span>Custom pricing</span>
            ) : (
              <>
                <span>From ${service.startingPrice}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="capitalize">{service.pricingModel}</span>
              </>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm group"
          onClick={onViewService}
        >
          View Service Details
          <ExternalLink className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function RequestStatus({
  conversation,
  onCreateRequest,
  onViewRequest,
}: {
  conversation: Conversation
  onCreateRequest: () => void
  onViewRequest: () => void
}) {
  const { hasLinkedRequest, linkedRequestId, linkedRequestStatus } = conversation

  if (hasLinkedRequest && linkedRequestId) {
    const statusColors = {
      draft: "bg-muted text-muted-foreground",
      pending: "bg-amber-100 text-amber-700",
      accepted: "bg-emerald-100 text-emerald-700",
      completed: "bg-primary/10 text-primary",
    }

    const statusLabels = {
      draft: "Draft",
      pending: "Pending Review",
      accepted: "Accepted",
      completed: "Completed",
    }

    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-0 pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Request Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-3">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-muted/50">
            <FileText className="size-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Request #{linkedRequestId.slice(0, 8)}
              </p>
              <Badge
                variant="secondary"
                className={`mt-1 text-xs font-normal ${
                  linkedRequestStatus ? statusColors[linkedRequestStatus] : ""
                }`}
              >
                {linkedRequestStatus ? statusLabels[linkedRequestStatus] : "Unknown"}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm group"
            onClick={onViewRequest}
          >
            View Request
            <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Next Step
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-3">
        <div className="flex items-start gap-3 px-3 py-3 rounded-lg bg-primary/5 border border-primary/10">
          <AlertCircle className="size-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No request created yet
            </p>
            <p className="text-xs text-muted-foreground">
              When you&apos;re ready, create a formal request to get a quote from this
              provider.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full text-sm group"
          onClick={onCreateRequest}
        >
          Create Request
          <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </CardContent>
    </Card>
  )
}

function ConversationMeta({ conversation }: { conversation: Conversation }) {
  const originLabels = {
    provider_page: "Provider profile",
    story_reply: "Story reply",
    service_intent: "Service inquiry",
    explore: "Explore page",
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0 pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Started from</span>
          <span className="text-foreground">{originLabels[conversation.origin]}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last activity</span>
          <span className="text-foreground">
            {conversation.lastActivity.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Messages</span>
          <span className="text-foreground">{conversation.messages.length}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ContextSkeleton() {
  return (
    <div className="p-5 space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-16 bg-accent animate-pulse rounded" />
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-full bg-accent animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-accent animate-pulse rounded" />
            <div className="h-3 w-20 bg-accent animate-pulse rounded" />
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="h-4 w-16 bg-accent animate-pulse rounded" />
        <div className="h-20 bg-accent animate-pulse rounded-lg" />
      </div>
    </div>
  )
}

export function ContextRail({
  conversation,
  onViewProfile,
  onViewService,
  onCreateRequest,
  onViewRequest,
}: ContextRailProps) {
  if (!conversation) {
    return (
      <div className="h-full bg-card border-l border-border">
        <div className="p-5 text-center text-sm text-muted-foreground">
          <MessageCircle className="size-8 mx-auto mb-3 text-muted-foreground/50" />
          <p>Select a conversation to see details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-card border-l border-border">
      <ScrollArea className="h-full">
        <div className="p-5 space-y-1">
          <ProviderSummary conversation={conversation} />
          <Separator className="my-4" />
          {conversation.service && (
            <>
              <ServiceSummary
                conversation={conversation}
                onViewService={onViewService}
              />
              <Separator className="my-4" />
            </>
          )}
          <RequestStatus
            conversation={conversation}
            onCreateRequest={onCreateRequest}
            onViewRequest={onViewRequest}
          />
          <Separator className="my-4" />
          <ConversationMeta conversation={conversation} />
        </div>
      </ScrollArea>
    </div>
  )
}
