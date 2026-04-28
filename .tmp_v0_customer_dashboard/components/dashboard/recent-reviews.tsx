"use client"

import { Star, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Review {
  id: string
  customer: {
    name: string
    avatar: string
  }
  provider: {
    name: string
    profession: string
  }
  rating: number
  excerpt: string
  date: string
}

const reviews: Review[] = [
  {
    id: "r-1",
    customer: {
      name: "Mohamed A.",
      avatar: "",
    },
    provider: {
      name: "Amira Benali",
      profession: "Interior Designer",
    },
    rating: 5,
    excerpt: "Exceptional work on our living room renovation. Highly professional and creative.",
    date: "2 days ago",
  },
  {
    id: "r-2",
    customer: {
      name: "Leila K.",
      avatar: "",
    },
    provider: {
      name: "Youssef Kaddour",
      profession: "Electrician",
    },
    rating: 5,
    excerpt: "Quick response and solved our electrical issue same day. Very reliable.",
    date: "3 days ago",
  },
]

export function RecentReviews() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Recent Reviews
          </CardTitle>
          <a
            href="/customer/reviews"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all
            <ArrowRight className="size-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review, index) => (
          <div key={review.id}>
            {index > 0 && <div className="border-t border-border mb-4" />}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={review.customer.avatar}
                      alt={review.customer.name}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {review.customer.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      reviewed {review.provider.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < review.rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {`"${review.excerpt}"`}
              </p>
              <p className="text-xs text-muted-foreground/70">{review.date}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
