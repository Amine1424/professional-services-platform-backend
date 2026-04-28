"use client"

import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

type NotificationsHeaderProps = {
  unreadCount: number
  onMarkAllAsRead: () => void
}

export function NotificationsHeader({ 
  unreadCount, 
  onMarkAllAsRead 
}: NotificationsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
          <Bell className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Activity</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onMarkAllAsRead}
          className="text-muted-foreground hover:text-foreground"
        >
          <CheckCheck className="size-4 mr-1.5" />
          Mark all read
        </Button>
      )}
    </div>
  )
}
