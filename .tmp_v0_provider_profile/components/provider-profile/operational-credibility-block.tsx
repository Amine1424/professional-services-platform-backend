"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface OperationalCredibilityBlockProps {
  responseTimeMinutes: number
  actualResponseTime?: string
  responseTimeStatus: "excellent" | "good" | "slow" | "unknown"
  onResponseTimeChange: (minutes: number) => void
}

export function OperationalCredibilityBlock({
  responseTimeMinutes,
  actualResponseTime,
  responseTimeStatus,
  onResponseTimeChange,
}: OperationalCredibilityBlockProps) {
  const responseTimeOptions = [
    { value: 30, label: "Under 30 minutes" },
    { value: 60, label: "Under 1 hour" },
    { value: 120, label: "Under 2 hours" },
    { value: 240, label: "Under 4 hours" },
    { value: 480, label: "Same day" },
    { value: 1440, label: "Within 24 hours" },
  ]

  const statusConfig = {
    excellent: {
      icon: Zap,
      label: "Excellent",
      description: "You respond faster than most providers",
      className: "text-success bg-success/10",
      iconClass: "text-success",
    },
    good: {
      icon: CheckCircle2,
      label: "Good",
      description: "Your response time meets customer expectations",
      className: "text-primary bg-primary/10",
      iconClass: "text-primary",
    },
    slow: {
      icon: AlertCircle,
      label: "Needs Improvement",
      description: "Faster responses increase inquiry conversion",
      className: "text-warning-foreground bg-warning/10",
      iconClass: "text-warning",
    },
    unknown: {
      icon: Clock,
      label: "Not Yet Measured",
      description: "Respond to inquiries to build your track record",
      className: "text-muted-foreground bg-secondary",
      iconClass: "text-muted-foreground",
    },
  }

  const status = statusConfig[responseTimeStatus]
  const StatusIcon = status.icon

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Response & Credibility</CardTitle>
            <p className="text-xs text-muted-foreground">
              How quickly customers can expect to hear from you
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Performance */}
        {actualResponseTime && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 ${
              responseTimeStatus === "excellent"
                ? "border-success/30 bg-success/5"
                : responseTimeStatus === "good"
                  ? "border-primary/30 bg-primary/5"
                  : responseTimeStatus === "slow"
                    ? "border-warning/30 bg-warning/5"
                    : "border-border bg-secondary/30"
            }`}
          >
            <StatusIcon className={`size-5 shrink-0 ${status.iconClass}`} />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Your actual response time: {actualResponseTime}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{status.description}</p>
            </div>
          </div>
        )}

        {/* Committed Response Time */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="responseTime">Committed Response Time</FieldLabel>
            <Select
              value={responseTimeMinutes.toString()}
              onValueChange={(v) => onResponseTimeChange(parseInt(v))}
            >
              <SelectTrigger id="responseTime" className="w-full sm:w-72">
                <SelectValue placeholder="Select response time" />
              </SelectTrigger>
              <SelectContent>
                {responseTimeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This is displayed publicly. Set a realistic time you can consistently meet.
            </p>
          </Field>
        </FieldGroup>

        {/* Response Tips */}
        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
          <p className="text-xs font-medium text-foreground">
            Why response time matters:
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
              <span>Providers who respond within 1 hour get 3x more bookings</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
              <span>Fast responders appear higher in search results</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
              <span>Customers trust businesses that reply quickly</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
