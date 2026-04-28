"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Send,
  Paperclip,
  Star,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { Conversation, Message } from "./types"

interface ThreadAreaProps {
  conversation: Conversation | null
  onSendMessage: (content: string) => void
  onRequestQuote: () => void
  isLoading?: boolean
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatMessageDate(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatMessageTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium">
        {formatMessageDate(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function ThreadHeader({ conversation }: { conversation: Conversation }) {
  const { provider, service } = conversation

  return (
    <div className="px-6 py-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={provider.avatar} alt={provider.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {provider.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground">{provider.name}</span>
            {provider.verified && (
              <CheckCircle2 className="size-4 text-primary fill-primary/10" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{provider.profession}</span>
            <span className="text-muted-foreground/40">·</span>
            <div className="flex items-center gap-0.5">
              <Star className="size-3 text-amber-500 fill-amber-500" />
              <span>{provider.rating}</span>
            </div>
          </div>
        </div>
      </div>
      {service && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <Badge variant="secondary" className="text-xs font-normal">
            {service.category}
          </Badge>
          <span className="text-sm text-foreground font-medium">{service.name}</span>
          {service.pricingModel !== "quote" && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">
                From ${service.startingPrice}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MessageComposer({
  onSend,
  onRequestQuote,
  showRequestCTA,
}: {
  onSend: (content: string) => void
  onRequestQuote: () => void
  showRequestCTA: boolean
}) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-6 py-4 border-t border-border bg-card space-y-3">
      {showRequestCTA && (
        <button
          onClick={onRequestQuote}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary font-medium">Ready to proceed?</span>
            <span className="text-muted-foreground">Request a quote from this provider</span>
          </div>
          <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 size-9 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="size-4" />
          <span className="sr-only">Attach file</span>
        </Button>
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32 py-3 pr-12 resize-none"
            rows={1}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className="shrink-0 size-9"
        >
          <Send className="size-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  )
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-accent animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-accent animate-pulse rounded" />
            <div className="h-3 w-24 bg-accent animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "h-16 rounded-2xl bg-accent animate-pulse",
                i % 2 === 0 ? "w-48" : "w-64"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ThreadArea({
  conversation,
  onSendMessage,
  onRequestQuote,
  isLoading,
}: ThreadAreaProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <ThreadSkeleton />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-background">
        <Empty className="flex-1 border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare className="size-5" />
            </EmptyMedia>
            <EmptyTitle>Select a conversation</EmptyTitle>
            <EmptyDescription>
              Choose a conversation from the list to view messages and continue your discussion.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  const messages = conversation.messages
  const showRequestCTA =
    !conversation.hasLinkedRequest && messages.length >= 3

  // Group messages by date
  let lastDate: string | null = null

  return (
    <div className="flex flex-col h-full bg-background">
      <ThreadHeader conversation={conversation} />
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-3">
          {messages.map((msg) => {
            const msgDate = msg.timestamp.toDateString()
            const showDate = msgDate !== lastDate
            lastDate = msgDate

            return (
              <div key={msg.id}>
                {showDate && <DateDivider date={msg.timestamp} />}
                <MessageBubble
                  message={msg}
                  isOwn={msg.senderType === "customer"}
                />
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <MessageComposer
        onSend={onSendMessage}
        onRequestQuote={onRequestQuote}
        showRequestCTA={showRequestCTA}
      />
    </div>
  )
}
