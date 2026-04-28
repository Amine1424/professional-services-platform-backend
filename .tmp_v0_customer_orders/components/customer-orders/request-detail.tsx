"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Loader2,
  MessageSquare,
  BadgeCheck,
  Star,
  ChevronRight,
  StickyNote,
  Calendar,
  AlertCircle
} from "lucide-react"
import type { ServiceRequest, RequestStatus } from "@/lib/mock-data"

interface RequestDetailProps {
  request: ServiceRequest
}

const statusConfig: Record<RequestStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending_quote: { 
    label: "Awaiting Quote", 
    color: "text-amber-600", 
    bgColor: "bg-amber-50",
    icon: <Clock className="size-4" /> 
  },
  quote_received: { 
    label: "Quote Ready", 
    color: "text-primary", 
    bgColor: "bg-primary/10",
    icon: <FileText className="size-4" /> 
  },
  in_progress: { 
    label: "In Progress", 
    color: "text-blue-600", 
    bgColor: "bg-blue-50",
    icon: <Loader2 className="size-4 animate-spin" /> 
  },
  completed: { 
    label: "Completed", 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-50",
    icon: <CheckCircle2 className="size-4" /> 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "text-rose-600", 
    bgColor: "bg-rose-50",
    icon: <XCircle className="size-4" /> 
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: "numeric"
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", { 
    hour: "numeric",
    minute: "2-digit"
  })
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    minimumFractionDigits: 0
  }).format(amount) + " " + currency
}

export function RequestDetail({ request }: RequestDetailProps) {
  const [customerNote, setCustomerNote] = useState(request.customerNote || "")
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  
  const status = statusConfig[request.status]
  const hasQuote = !!request.quote
  const canAcceptQuote = request.status === "quote_received"
  const canReject = request.status === "quote_received"
  const canCancel = request.status === "pending_quote" || request.status === "quote_received"

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Request Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground text-balance">
                {request.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {request.category}
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              status.bgColor, status.color
            )}>
              {status.icon}
              {status.label}
            </div>
          </div>

          {/* Provider Identity */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {request.provider.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      {request.provider.name}
                    </span>
                    {request.provider.isVerified && (
                      <BadgeCheck className="size-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {request.provider.rating}
                    </span>
                    <span>•</span>
                    <span>{request.provider.responseTime}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="size-3.5" />
                Open Conversation
              </Button>
            </div>
          </Card>
        </div>

        {/* Quote & Decision Zone */}
        {hasQuote && (
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Quote</span>
                {request.quote?.validUntil && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    Valid until {formatDate(request.quote.validUntil)}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Quote Amount */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground">
                  {formatCurrency(request.quote!.amount, request.quote!.currency)}
                </span>
              </div>

              {/* Quote Breakdown */}
              {request.quote?.breakdown && (
                <div className="space-y-2 pt-2">
                  {request.quote.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-foreground">
                        {formatCurrency(item.amount, request.quote!.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quote Notes */}
              {request.quote?.notes && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {request.quote.notes}
                </p>
              )}

              {/* Provider Response */}
              {request.providerResponse && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Provider Response
                  </p>
                  <p className="text-sm text-foreground">
                    {request.providerResponse}
                  </p>
                </div>
              )}

              {/* Decision Actions */}
              {canAcceptQuote && (
                <div className="pt-4 space-y-3">
                  <Button className="w-full" size="lg">
                    <CheckCircle2 className="size-4 mr-2" />
                    Accept Quote
                  </Button>
                  <div className="flex gap-2">
                    <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1" size="sm">
                          Reject Quote
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Quote</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to reject this quote? You can still continue the conversation with the provider.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive">
                            Reject Quote
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="flex-1 text-muted-foreground" size="sm">
                          Cancel Request
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Request</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel this entire request? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                            Keep Request
                          </Button>
                          <Button variant="destructive">
                            Cancel Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Awaiting Quote State */}
        {request.status === "pending_quote" && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Awaiting Quote</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The provider is reviewing your request. You&apos;ll be notified when a quote is ready.
                </p>
                {request.providerResponse && (
                  <p className="text-sm text-foreground mt-3 p-3 bg-muted/50 rounded-lg">
                    {request.providerResponse}
                  </p>
                )}
              </div>
            </div>
            {canCancel && (
              <div className="mt-4 pt-4 border-t border-border">
                <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Cancel Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Request</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel this request? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
                        Keep Request
                      </Button>
                      <Button variant="destructive">
                        Cancel Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </Card>
        )}

        {/* In Progress State */}
        {request.status === "in_progress" && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Loader2 className="size-5 text-blue-600 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Work in Progress</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {request.providerResponse || "The provider is working on your request."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Completed State */}
        {request.status === "completed" && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Request Completed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {request.providerResponse || "This request has been completed successfully."}
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Leave a Review
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Cancelled State */}
        {request.status === "cancelled" && (
          <Card className="p-6 border-rose-200 bg-rose-50/30">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle className="size-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Request Cancelled</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This request was cancelled and is no longer active.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Customer Note */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Your Note</span>
          </div>
          <Textarea 
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder="Add a personal note about this request..."
            className="min-h-[80px] resize-none"
          />
          {customerNote !== (request.customerNote || "") && (
            <div className="flex justify-end mt-2">
              <Button size="sm">Save Note</Button>
            </div>
          )}
        </Card>

        {/* Lifecycle */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Request Timeline</h3>
          <div className="space-y-4">
            {[...request.lifecycle].reverse().map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "size-2 rounded-full mt-1.5",
                    index === 0 ? "bg-primary" : "bg-border"
                  )} />
                  {index < request.lifecycle.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm text-foreground">{event.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                    </span>
                    {event.actor && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{event.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Request Details */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Request Details</h3>
          <p className="text-sm text-muted-foreground">{request.description}</p>
          <Separator className="my-4" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Created {formatDate(request.createdAt)}</span>
            <span>Last updated {formatDate(request.updatedAt)}</span>
          </div>
        </Card>
      </div>
    </ScrollArea>
  )
}
