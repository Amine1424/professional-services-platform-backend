"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  MessageSquare, 
  FileText, 
  MessageCircle, 
  Heart,
  Settings,
  ArrowRight,
  Check
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Notification, NotificationType } from "@/lib/mock-data"

type NotificationFeedProps = {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
}

const typeConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  message: {
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  request: {
    icon: FileText,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  comment: {
    icon: MessageCircle,
    color: "text-violet-600",
    bgColor: "bg-violet-50"
  },
  favorite_provider_update: {
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50"
  },
  system: {
    icon: Settings,
    color: "text-slate-600",
    bgColor: "bg-slate-50"
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function NotificationFeed({ notifications, onMarkAsRead }: NotificationFeedProps) {
  // Group notifications by date using UTC to avoid hydration mismatch
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp)
    const groupKey = `${months[date.getUTCMonth()]} ${date.getUTCDate()}`

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedNotifications).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NotificationCard({ 
  notification,
  onMarkAsRead
}: { 
  notification: Notification
  onMarkAsRead: (id: string) => void
}) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <Card 
      className={cn(
        "transition-colors",
        !notification.isRead && "bg-primary/[0.02] border-primary/10"
      )}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Type Icon or Actor Avatar */}
          {notification.actor ? (
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className={cn(config.bgColor, config.color, "text-xs font-medium")}>
                {getInitials(notification.actor.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={cn(
              "size-10 rounded-full flex items-center justify-center shrink-0",
              config.bgColor
            )}>
              <Icon className={cn("size-5", config.color)} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm font-medium",
                    notification.isRead ? "text-foreground" : "text-foreground"
                  )}>
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.body}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button asChild size="sm" variant="secondary">
                <Link href={notification.deepLink.href}>
                  {notification.deepLink.label}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
              
              {!notification.isRead && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <Check className="size-3.5 mr-1" />
                  Mark read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
