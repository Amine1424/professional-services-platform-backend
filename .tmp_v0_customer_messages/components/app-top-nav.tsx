"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Compass, 
  MessageCircle, 
  FileText, 
  Bell,
  User,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface AppTopNavProps {
  unreadMessages?: number
  activeRequests?: number
}

const navItems = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard,
    paths: ["/", "/customer/dashboard"]
  },
  { 
    id: "explore", 
    label: "Explore", 
    href: "/explore", 
    icon: Compass,
    paths: ["/explore", "/services", "/providers"]
  },
  { 
    id: "messages", 
    label: "Messages", 
    href: "/customer/messages", 
    icon: MessageCircle,
    paths: ["/customer/messages"],
    showBadge: "messages"
  },
  { 
    id: "requests", 
    label: "Requests", 
    href: "/customer/requests", 
    icon: FileText,
    paths: ["/customer/requests"],
    showBadge: "requests"
  },
  { 
    id: "subscription", 
    label: "Subscription", 
    href: "/customer/subscription", 
    icon: CreditCard,
    paths: ["/customer/subscription"]
  },
  { 
    id: "profile", 
    label: "Profile", 
    href: "/customer/profile", 
    icon: User,
    paths: ["/customer/profile"]
  },
]

export function AppTopNav({
  unreadMessages = 2,
  activeRequests = 3,
}: AppTopNavProps) {
  const pathname = usePathname()
  
  const getCurrentPage = () => {
    for (const item of navItems) {
      if (item.paths.some(p => pathname === p || pathname.startsWith(p + "/"))) {
        return item.id
      }
    }
    return "dashboard"
  }
  
  const currentPage = getCurrentPage()
  const isDashboard = currentPage === "dashboard"
  
  // Get breadcrumb path
  const getBreadcrumb = () => {
    const current = navItems.find(item => item.id === currentPage)
    if (!current || isDashboard) return null
    return current.label
  }
  
  const breadcrumb = getBreadcrumb()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Breadcrumb */}
      <div className="flex items-center gap-3">
        {!isDashboard && (
          <>
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            
            <Separator orientation="vertical" className="h-5" />
          </>
        )}
        
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors rounded-md ${
              isDashboard 
                ? "font-medium text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          
          {breadcrumb && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-foreground">
                {navItems.find(i => i.id === currentPage)?.icon && (
                  (() => {
                    const Icon = navItems.find(i => i.id === currentPage)!.icon
                    return <Icon className="h-4 w-4" />
                  })()
                )}
                <span>{breadcrumb}</span>
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Quick Nav Links */}
      <nav className="flex items-center gap-1">
        {navItems.slice(1, 4).map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          const badgeCount = item.showBadge === "messages" ? unreadMessages : 
                            item.showBadge === "requests" ? activeRequests : 0
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="h-8 gap-1.5 relative"
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
                {badgeCount > 0 && !isActive && (
                  <Badge 
                    variant={item.showBadge === "messages" ? "destructive" : "default"}
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )
        })}

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>
      </nav>
    </header>
  )
}
