import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Story } from "@/lib/types";

interface StoryCardProps {
  story: Story;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex flex-col items-center gap-2"
    >
      {/* Avatar with ring */}
      <div
        className={cn(
          "relative h-20 w-20 shrink-0 rounded-full p-0.5 transition-transform group-hover:scale-105",
          story.isLive
            ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-500"
            : "bg-border"
        )}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background bg-background">
          <Image
            src={story.provider.avatarUrl}
            alt={story.provider.name}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Live indicator */}
        {story.isLive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-sm bg-gradient-to-r from-amber-500 to-rose-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Live
          </div>
        )}
      </div>

      {/* Name */}
      <span className="max-w-20 truncate text-xs text-muted-foreground group-hover:text-foreground">
        {story.provider.name.split(" ")[0]}
      </span>
    </Link>
  );
}
