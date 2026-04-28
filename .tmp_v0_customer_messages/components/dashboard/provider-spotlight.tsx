"use client"

import { Star, CheckCircle2, MessageCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ProviderSpotlightProps {
  provider?: {
    id: string
    name: string
    avatar: string
    profession: string
    rating: number
    reviewCount: number
    verified: boolean
    responseTime: string
    completedJobs: number
  }
}

const defaultProvider = {
  id: "p-1",
  name: "Amira Benali",
  avatar: "",
  profession: "Interior Designer",
  rating: 4.9,
  reviewCount: 127,
  verified: true,
  responseTime: "< 1 hour",
  completedJobs: 89,
}

export function ProviderSpotlight({ provider = defaultProvider }: ProviderSpotlightProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Trusted Provider
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-normal">
            Featured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 ring-2 ring-primary/10">
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
            <p className="text-sm text-muted-foreground">{provider.profession}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">{provider.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({provider.reviewCount})
                </span>
              </div>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">
                {provider.completedJobs} jobs
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <MessageCircle className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Typically responds in {provider.responseTime}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 text-sm" asChild>
            <a href={`/provider/${provider.id}`}>View Profile</a>
          </Button>
          <Button className="flex-1 text-sm group" asChild>
            <a href={`/customer/messages?provider=${provider.id}`}>
              Contact
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
