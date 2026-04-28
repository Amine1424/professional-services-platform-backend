"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Globe, Building, Home } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface Region {
  id: string
  name: string
  cities?: { id: string; name: string }[]
}

interface ServiceAreaBlockProps {
  wilaya: string
  city: string
  address: string
  coverageMode: "local" | "regional" | "national"
  coverageRegions: string[]
  regions: Region[]
  onWilayaChange: (value: string) => void
  onCityChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCoverageModeChange: (value: "local" | "regional" | "national") => void
  onCoverageRegionsChange: (regions: string[]) => void
}

export function ServiceAreaBlock({
  wilaya,
  city,
  address,
  coverageMode,
  coverageRegions,
  regions,
  onWilayaChange,
  onCityChange,
  onAddressChange,
  onCoverageModeChange,
  onCoverageRegionsChange,
}: ServiceAreaBlockProps) {
  const selectedRegion = regions.find((r) => r.id === wilaya)
  const cities = selectedRegion?.cities || []

  const handleRegionToggle = (regionId: string, checked: boolean) => {
    if (checked) {
      onCoverageRegionsChange([...coverageRegions, regionId])
    } else {
      onCoverageRegionsChange(coverageRegions.filter((r) => r !== regionId))
    }
  }

  const coverageModeConfig = {
    local: {
      icon: Home,
      label: "Local Only",
      description: "I serve only my city/wilaya",
    },
    regional: {
      icon: Building,
      label: "Regional",
      description: "I serve multiple wilayas",
    },
    national: {
      icon: Globe,
      label: "National",
      description: "I serve all of Algeria",
    },
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Location & Service Area</CardTitle>
            <p className="text-xs text-muted-foreground">
              Where customers can find and reach you
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Location */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Business Location</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="wilaya">Wilaya</FieldLabel>
                <Select value={wilaya} onValueChange={onWilayaChange}>
                  <SelectTrigger id="wilaya">
                    <SelectValue placeholder="Select wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Select
                  value={city}
                  onValueChange={onCityChange}
                  disabled={cities.length === 0}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="address">Street Address (Optional)</FieldLabel>
              <Input
                id="address"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="e.g., 123 Rue Didouche Mourad"
              />
              <p className="text-xs text-muted-foreground">
                Only shown to customers after they contact you
              </p>
            </Field>
          </FieldGroup>
        </div>

        {/* Service Coverage Mode */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Service Coverage</p>
          <RadioGroup
            value={coverageMode}
            onValueChange={(v) => onCoverageModeChange(v as "local" | "regional" | "national")}
            className="grid gap-3 sm:grid-cols-3"
          >
            {(Object.keys(coverageModeConfig) as Array<keyof typeof coverageModeConfig>).map(
              (mode) => {
                const config = coverageModeConfig[mode]
                const Icon = config.icon
                const isSelected = coverageMode === mode
                return (
                  <label
                    key={mode}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-secondary/30"
                    }`}
                  >
                    <RadioGroupItem value={mode} className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </label>
                )
              }
            )}
          </RadioGroup>
        </div>

        {/* Regional Coverage Selection */}
        {coverageMode === "regional" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Select wilayas you serve
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {regions.slice(0, 12).map((region) => {
                const isChecked = coverageRegions.includes(region.id)
                return (
                  <label
                    key={region.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      isChecked
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-secondary/30"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleRegionToggle(region.id, checked as boolean)
                      }
                    />
                    <span className={isChecked ? "font-medium" : ""}>{region.name}</span>
                  </label>
                )
              })}
            </div>
            {coverageRegions.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {coverageRegions.length} wilaya{coverageRegions.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {/* National notice */}
        {coverageMode === "national" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm text-foreground">
              <span className="font-medium">National coverage enabled.</span>{" "}
              Your profile will appear in searches across all wilayas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
