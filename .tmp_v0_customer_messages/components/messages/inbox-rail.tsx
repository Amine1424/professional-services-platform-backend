"use client"

import { CheckCircle2, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ConversationListItem } from "./types"

interface InboxRailProps {
  conversations: ConversationListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: ConversationListItem
  isSelected: boolean
  onSelect: () => void
}) {
  const { provider, service, lastMessage, lastMessageTime, unreadCount } = conversation

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left px-4 py-3 transition-colors border-b border-border/50 last:border-b-0",
        "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none",
        isSelected && "bg-accent border-l-2 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-10">
            <AvatarImage src={provider.avatar} alt={provider.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {provider.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "truncate text-sm",
                  unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"
                )}
              >
                {provider.name}
              </span>
              {provider.verified && (
                <CheckCircle2 className="size-3.5 text-primary fill-primary/10 shrink-0" />
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(lastMessageTime)}
            </span>
          </div>
          {service && (
            <p className="text-xs text-primary/80 truncate">{service.name}</p>
          )}
          <p
            className={cn(
              "text-xs truncate",
              unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {lastMessage}
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className="shrink-0 size-5 p-0 justify-center text-[10px] font-semibold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </div>
    </button>
  )
}

function InboxSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-3 flex items-start gap-3">
          <div className="size-10 rounded-full bg-accent animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-accent animate-pulse rounded" />
            <div className="h-3 w-full bg-accent animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InboxRail({ conversations, selectedId, onSelect, isLoading }: InboxRailProps) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="font-semibold text-foreground">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 h-9 bg-muted/50"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <InboxSkeleton />
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onSelect={() => onSelect(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
