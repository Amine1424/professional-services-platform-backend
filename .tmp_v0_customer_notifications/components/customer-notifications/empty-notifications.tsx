"use client"

import { Bell, Inbox } from "lucide-react"
import type { FilterType } from "@/app/notifications/page"

type EmptyNotificationsProps = {
  filter: FilterType
}

const emptyMessages: Record<FilterType, { title: string; description: string }> = {
  all: {
    title: "No activity yet",
    description: "When providers respond to your requests or send messages, they will appear here."
  },
  unread: {
    title: "All caught up",
    description: "You have no unread notifications. Check back later for new activity."
  },
  message: {
    title: "No messages",
    description: "When providers send you messages, they will appear here."
  },
  request: {
    title: "No request updates",
    description: "Updates about your service requests will appear here."
  },
  comment: {
    title: "No comments",
    description: "Responses to your reviews and comments will appear here."
  },
  favorite_provider_update: {
    title: "No provider updates",
    description: "Updates from your saved providers will appear here."
  },
  system: {
    title: "No system notifications",
    description: "Important platform announcements will appear here."
  }
}

export function EmptyNotifications({ filter }: EmptyNotificationsProps) {
  const { title, description } = emptyMessages[filter]
  const isAllCaughtUp = filter === "unread"

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
        {isAllCaughtUp ? (
          <Inbox className="size-6 text-muted-foreground" />
        ) : (
          <Bell className="size-6 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {description}
      </p>
    </div>
  )
}
