"use client"

import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Clock, XCircle, FileText, Loader2 } from "lucide-react"
import type { ServiceRequest, RequestStatus } from "@/lib/mock-data"

interface RequestListProps {
  requests: ServiceRequest[]
  selectedRequestId: string
  onSelectRequest: (id: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

const statusConfig: Record<RequestStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
  pending_quote: { label: "Awaiting Quote", variant: "secondary", icon: <Clock className="size-3" /> },
  quote_received: { label: "Quote Ready", variant: "default", icon: <FileText className="size-3" /> },
  in_progress: { label: "In Progress", variant: "outline", icon: <Loader2 className="size-3 animate-spin" /> },
  completed: { label: "Completed", variant: "secondary", icon: <CheckCircle2 className="size-3" /> },
  cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="size-3" /> }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    minimumFractionDigits: 0
  }).format(amount) + " " + currency
}

export function RequestList({ 
  requests, 
  selectedRequestId, 
  onSelectRequest, 
  activeTab, 
  onTabChange 
}: RequestListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">My Requests</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{requests.length} requests</p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 border-b border-border">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="w-full grid grid-cols-5 h-8">
            <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-2">Pending</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-2">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-2">Done</TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs px-2">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Request List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No requests found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {requests.map((request) => {
                const status = statusConfig[request.status]
                const isSelected = request.id === selectedRequestId
                
                return (
                  <button
                    key={request.id}
                    onClick={() => onSelectRequest(request.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      "hover:bg-accent/50",
                      isSelected && "bg-accent ring-1 ring-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-foreground" : "text-foreground/90"
                        )}>
                          {request.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {request.provider.name}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="shrink-0 text-[10px] px-1.5 py-0">
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(request.updatedAt)}
                      </span>
                      {request.quote && (
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(request.quote.amount, request.quote.currency)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
