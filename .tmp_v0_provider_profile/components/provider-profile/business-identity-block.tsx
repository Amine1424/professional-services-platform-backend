"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Sparkles } from "lucide-react"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface BusinessIdentityBlockProps {
  businessName: string
  description: string
  primaryCategory: string
  subcategory?: string
  yearsOfExperience: number
  categories: { id: string; name: string; subcategories?: { id: string; name: string }[] }[]
  onBusinessNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSubcategoryChange: (value: string) => void
  onYearsChange: (value: number) => void
}

export function BusinessIdentityBlock({
  businessName,
  description,
  primaryCategory,
  subcategory,
  yearsOfExperience,
  categories,
  onBusinessNameChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onYearsChange,
}: BusinessIdentityBlockProps) {
  const selectedCategory = categories.find((c) => c.id === primaryCategory)
  const subcategories = selectedCategory?.subcategories || []

  const descriptionLength = description.length
  const maxDescription = 500
  const isDescriptionGood = descriptionLength >= 100 && descriptionLength <= maxDescription

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Business Identity</CardTitle>
              <p className="text-xs text-muted-foreground">
                How customers will recognize your business
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Business Name */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => onBusinessNameChange(e.target.value)}
              placeholder="Your business or professional name"
              className="font-medium"
            />
            <p className="text-xs text-muted-foreground">
              This is your primary public identity
            </p>
          </Field>
        </FieldGroup>

        {/* Professional Description */}
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="description">Professional Description</FieldLabel>
              <span
                className={`text-xs tabular-nums ${
                  isDescriptionGood ? "text-success" : "text-muted-foreground"
                }`}
              >
                {descriptionLength}/{maxDescription}
              </span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe your expertise, experience, and what makes your services stand out..."
              rows={4}
              maxLength={maxDescription}
              className="resize-none"
            />
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
              <span>
                Tip: A compelling description (100+ chars) helps customers understand your
                expertise and increases inquiries
              </span>
            </div>
          </Field>
        </FieldGroup>

        {/* Category + Subcategory Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category">Primary Category</FieldLabel>
              <Select value={primaryCategory} onValueChange={onCategoryChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subcategory">Specialization</FieldLabel>
              <Select
                value={subcategory || ""}
                onValueChange={onSubcategoryChange}
                disabled={subcategories.length === 0}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>

        {/* Years of Experience */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="experience">Years of Experience</FieldLabel>
            <Select
              value={yearsOfExperience.toString()}
              onValueChange={(v) => onYearsChange(parseInt(v))}
            >
              <SelectTrigger id="experience" className="w-full sm:w-48">
                <SelectValue placeholder="Select years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
                <SelectItem value="15">15+ years</SelectItem>
                <SelectItem value="20">20+ years</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Displayed on your public profile to build trust
            </p>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
