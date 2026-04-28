"use client"

import { Play, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Story {
  id: string
  provider: {
    name: string
    avatar: string
    profession: string
  }
  thumbnail: string
  title: string
  isNew: boolean
  duration: string
}

const stories: Story[] = [
  {
    id: "s-1",
    provider: {
      name: "Youssef Kaddour",
      avatar: "",
      profession: "Electrician",
    },
    thumbnail: "",
    title: "Home wiring project completed",
    isNew: true,
    duration: "0:45",
  },
  {
    id: "s-2",
    provider: {
      name: "Fatima Meziane",
      avatar: "",
      profession: "House Cleaner",
    },
    thumbnail: "",
    title: "Deep cleaning transformation",
    isNew: true,
    duration: "1:20",
  },
  {
    id: "s-3",
    provider: {
      name: "Karim Bouzid",
      avatar: "",
      profession: "Plumber",
    },
    thumbnail: "",
    title: "Bathroom renovation showcase",
    isNew: false,
    duration: "2:10",
  },
]

export function StoriesSection() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            Stories from Providers
          </CardTitle>
          <a
            href="/customer/explore?tab=stories"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            See all
            <ArrowRight className="size-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {stories.map((story) => (
            <a
              key={story.id}
              href={`/story/${story.id}`}
              className="group flex-shrink-0 w-28"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-2">
                {/* Thumbnail placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-foreground/80 text-background transition-transform group-hover:scale-110">
                    <Play className="size-4 ml-0.5 fill-current" />
                  </div>
                </div>

                {/* Duration */}
                <span className="absolute bottom-2 right-2 rounded bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-background">
                  {story.duration}
                </span>

                {/* New indicator */}
                {story.isNew && (
                  <span className="absolute top-2 left-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    New
                  </span>
                )}

                {/* Provider avatar ring */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <Avatar className="size-8 ring-2 ring-card">
                    <AvatarImage
                      src={story.provider.avatar}
                      alt={story.provider.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {story.provider.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="text-center pt-3">
                <p className="text-xs font-medium text-foreground truncate">
                  {story.provider.name.split(" ")[0]}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {story.provider.profession}
                </p>
              </div>
            </a>
          ))}

          {/* View more stories */}
          <a
            href="/customer/explore?tab=stories"
            className="group flex-shrink-0 w-28"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/50 border border-dashed border-border flex items-center justify-center mb-2">
              <div className="text-center px-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2 transition-colors group-hover:bg-primary/20">
                  <ArrowRight className="size-4" />
                </div>
                <span className="text-xs text-muted-foreground">
                  View more
                </span>
              </div>
            </div>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
