"use client"

import Link from "next/link"
import { ArrowLeft, LayoutDashboard, Compass, Send, FileText, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TopNavProps {
  currentPage?: "messages" | "dashboard" | "explore" | "requests"
  unreadMessages?: number
  activeRequests?: number
}

export function TopNav({
  currentPage = "messages",
  unreadMessages = 2,
  activeRequests = 3,
}: TopNavProps) {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        
        <Separator orientation="vertical" className="h-5" />
        
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          
          <span className="text-muted-foreground/50">/</span>
          
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-foreground">
            <Send className="h-4 w-4" />
            <span>Messages</span>
          </span>
        </nav>
      </div>

      {/* Right: Quick Nav Links */}
      <nav className="flex items-center gap-1">
        <Button
          variant={currentPage === "explore" ? "secondary" : "ghost"}
          size="sm"
          asChild
          className="h-8 gap-1.5"
        >
          <Link href="/explore">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>
        </Button>
        
        <Button
          variant={currentPage === "messages" ? "secondary" : "ghost"}
          size="sm"
          asChild
          className="h-8 gap-1.5 relative"
        >
          <Link href="/customer/messages">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
            {unreadMessages > 0 && currentPage !== "messages" && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {unreadMessages}
              </Badge>
            )}
          </Link>
        </Button>
        
        <Button
          variant={currentPage === "requests" ? "secondary" : "ghost"}
          size="sm"
          asChild
          className="h-8 gap-1.5 relative"
        >
          <Link href="/customer/requests">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
            {activeRequests > 0 && currentPage !== "requests" && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary"
              >
                {activeRequests}
              </Badge>
            )}
          </Link>
        </Button>

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
