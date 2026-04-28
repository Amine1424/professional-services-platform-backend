import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react"

interface Service {
  id: string
  title: string
  status: "published" | "draft" | "archived"
  category: string
  inquiries: number
}

interface RecentServicesProps {
  services: Service[]
  totalServices: number
}

export function RecentServices({ services, totalServices }: RecentServicesProps) {
  const statusConfig = {
    published: {
      label: "Published",
      icon: Eye,
      className: "bg-success/10 text-success-foreground border-success/20",
    },
    draft: {
      label: "Draft",
      icon: EyeOff,
      className: "bg-muted text-muted-foreground border-muted",
    },
    archived: {
      label: "Archived",
      icon: EyeOff,
      className: "bg-secondary text-secondary-foreground border-secondary",
    },
  }

  if (services.length === 0) {
    return null
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent Services
          </span>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" asChild>
            <a href="/provider/services">
              View all ({totalServices})
              <ChevronRight className="ml-0.5 size-3" />
            </a>
          </Button>
        </div>

        <div className="space-y-2">
          {services.map((service) => {
            const status = statusConfig[service.status]
            const StatusIcon = status.icon
            return (
              <a
                key={service.id}
                href={`/provider/services/${service.id}`}
                className="group flex items-center justify-between rounded-md border border-border/50 bg-card px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {service.title}
                    </span>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${status.className}`}>
                      <StatusIcon className="mr-0.5 size-2.5" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{service.category}</span>
                    {service.status === "published" && (
                      <>
                        <span className="text-border">•</span>
                        <span>{service.inquiries} inquiries</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="ml-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </a>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          asChild
        >
          <a href="/provider/services/new">
            Add New Service
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
