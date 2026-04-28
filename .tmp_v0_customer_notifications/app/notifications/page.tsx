"use client"

import { useState, useMemo } from "react"
import { mockNotifications, type Notification, type NotificationType } from "@/lib/mock-data"
import { NotificationsHeader } from "@/components/customer-notifications/notifications-header"
import { AttentionBlock } from "@/components/customer-notifications/attention-block"
import { FilterBar } from "@/components/customer-notifications/filter-bar"
import { NotificationFeed } from "@/components/customer-notifications/notification-feed"
import { EmptyNotifications } from "@/components/customer-notifications/empty-notifications"

export type FilterType = "all" | "unread" | NotificationType

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  )

  const urgentUnread = useMemo(() => 
    notifications.filter(n => !n.isRead && n.isUrgent),
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications
    if (activeFilter === "unread") return notifications.filter(n => !n.isRead)
    return notifications.filter(n => n.type === activeFilter)
  }, [notifications, activeFilter])

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    message: notifications.filter(n => n.type === "message").length,
    request: notifications.filter(n => n.type === "request").length,
    comment: notifications.filter(n => n.type === "comment").length,
    favorite_provider_update: notifications.filter(n => n.type === "favorite_provider_update").length,
    system: notifications.filter(n => n.type === "system").length,
  }), [notifications])

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <NotificationsHeader 
          unreadCount={unreadCount}
          onMarkAllAsRead={handleMarkAllAsRead}
        />

        {/* Attention Block - only show if urgent items exist */}
        {urgentUnread.length > 0 && (
          <AttentionBlock 
            urgentItems={urgentUnread}
            onMarkAsRead={handleMarkAsRead}
          />
        )}

        {/* Filter Bar */}
        <FilterBar 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Notification Feed */}
        {filteredNotifications.length > 0 ? (
          <NotificationFeed 
            notifications={filteredNotifications}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <EmptyNotifications filter={activeFilter} />
        )}
      </div>
    </div>
  )
}
