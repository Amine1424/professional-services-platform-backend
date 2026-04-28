"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, Camera, Upload, Trash2 } from "lucide-react"
import Image from "next/image"

interface VisualPresenceBlockProps {
  avatarUrl?: string
  coverUrl?: string
  businessName: string
  onAvatarUpload: () => void
  onCoverUpload: () => void
  onAvatarRemove: () => void
  onCoverRemove: () => void
}

export function VisualPresenceBlock({
  avatarUrl,
  coverUrl,
  businessName,
  onAvatarUpload,
  onCoverUpload,
  onAvatarRemove,
  onCoverRemove,
}: VisualPresenceBlockProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <ImageIcon className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Visual Presence</CardTitle>
            <p className="text-xs text-muted-foreground">
              Photos that represent your business publicly
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Image Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Cover Photo</label>
            <div className="flex items-center gap-2">
              {coverUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCoverRemove}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3" />
                  Remove
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onCoverUpload} className="h-7 text-xs">
                <Upload className="mr-1 size-3" />
                {coverUrl ? "Change" : "Upload"}
              </Button>
            </div>
          </div>
          <div
            className={`relative aspect-[3/1] overflow-hidden rounded-lg border-2 border-dashed ${
              coverUrl ? "border-transparent" : "border-border"
            } bg-secondary/30`}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="size-8" />
                <span className="text-xs">Recommended: 1200 x 400px</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Profile Photo</label>
            <div className="flex items-center gap-2">
              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAvatarRemove}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-1 size-3" />
                  Remove
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onAvatarUpload} className="h-7 text-xs">
                <Camera className="mr-1 size-3" />
                {avatarUrl ? "Change" : "Upload"}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                avatarUrl ? "border-border/50" : "border-dashed border-border"
              } bg-secondary/30`}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={businessName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Camera className="size-6" />
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Profile photo tips:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Use a professional headshot or logo</li>
                <li>Square format works best</li>
                <li>Minimum 200x200px</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="rounded-lg border border-border/60 bg-secondary/20 p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            How customers see your profile:
          </p>
          <div className="relative overflow-hidden rounded-lg bg-card">
            {/* Mini Cover */}
            <div className="relative h-16 bg-gradient-to-r from-primary/20 to-primary/5">
              {coverUrl && (
                <Image
                  src={coverUrl}
                  alt="Cover preview"
                  fill
                  className="object-cover opacity-90"
                />
              )}
            </div>
            {/* Avatar Overlay */}
            <div className="absolute left-4 top-10">
              <div className="size-12 overflow-hidden rounded-lg border-2 border-card bg-secondary shadow-sm">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={businessName}
                    width={48}
                    height={48}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary text-muted-foreground">
                    <Camera className="size-4" />
                  </div>
                )}
              </div>
            </div>
            {/* Name Preview */}
            <div className="px-4 pb-3 pt-8">
              <p className="text-sm font-medium text-foreground">{businessName || "Your Business Name"}</p>
              <p className="text-xs text-muted-foreground">Professional Services</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
