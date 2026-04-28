"use client"

import { Search, MessageCircle, FileText, ArrowRight, CreditCard, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const actions = [
  {
    id: "explore",
    label: "Explore Services",
    description: "Find trusted professionals",
    icon: Search,
    href: "/customer/explore",
    primary: true,
  },
  {
    id: "messages",
    label: "Messages",
    description: "2 unread conversations",
    icon: MessageCircle,
    href: "/customer/messages",
    badge: 2,
  },
  {
    id: "requests",
    label: "Active Requests",
    description: "3 in progress",
    icon: FileText,
    href: "/customer/requests",
    badge: 3,
  },
  {
    id: "subscription",
    label: "Subscription",
    description: "Manage your plan",
    icon: CreditCard,
    href: "/customer/subscription",
  },
  {
    id: "profile",
    label: "Profile",
    description: "Edit your info",
    icon: User,
    href: "/customer/profile",
  },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((action) => (
        <a key={action.id} href={action.href} className="block group">
          <Card
            className={`h-full transition-all duration-200 hover:shadow-md ${
              action.primary
                ? "border-primary/20 bg-primary text-primary-foreground hover:bg-primary/95"
                : "hover:border-primary/30"
            }`}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  action.primary
                    ? "bg-primary-foreground/15"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <action.icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{action.label}</span>
                  {action.badge && (
                    <span
                      className={`flex size-5 items-center justify-center rounded-full text-xs font-medium ${
                        action.primary
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs truncate ${
                    action.primary
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {action.description}
                </p>
              </div>
              <ArrowRight
                className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  action.primary
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground"
                }`}
              />
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  )
}
