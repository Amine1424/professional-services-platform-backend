"use client"

import { ArrowRight, Clock, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Service {
  id: string
  name: string
  category: string
  avgPrice: string
  avgRating: number
  deliveryTime: string
  popular: boolean
}

const services: Service[] = [
  {
    id: "srv-1",
    name: "Home Cleaning",
    category: "Household",
    avgPrice: "2,500 DZD",
    avgRating: 4.8,
    deliveryTime: "Same day",
    popular: true,
  },
  {
    id: "srv-2",
    name: "Plumbing Repair",
    category: "Maintenance",
    avgPrice: "3,000 DZD",
    avgRating: 4.7,
    deliveryTime: "1-2 days",
    popular: false,
  },
  {
    id: "srv-3",
    name: "Electrical Work",
    category: "Maintenance",
    avgPrice: "4,500 DZD",
    avgRating: 4.9,
    deliveryTime: "1-3 days",
    popular: true,
  },
  {
    id: "srv-4",
    name: "Interior Design",
    category: "Design",
    avgPrice: "15,000 DZD",
    avgRating: 4.8,
    deliveryTime: "1-2 weeks",
    popular: false,
  },
]

export function FeaturedServices() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Popular Services
          </CardTitle>
          <a
            href="/customer/explore"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse all
            <ArrowRight className="size-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <a
              key={service.id}
              href={`/customer/explore?service=${service.id}`}
              className="group flex items-center gap-3 rounded-lg border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/20 hover:bg-muted/50"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-sm font-semibold">
                  {service.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {service.name}
                  </span>
                  {service.popular && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs text-muted-foreground">
                      {service.avgRating}
                    </span>
                  </div>
                  <span className="text-muted-foreground/30">·</span>
                  <div className="flex items-center gap-0.5">
                    <Clock className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {service.deliveryTime}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-medium text-foreground">
                  {service.avgPrice}
                </span>
                <p className="text-[10px] text-muted-foreground">avg.</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
