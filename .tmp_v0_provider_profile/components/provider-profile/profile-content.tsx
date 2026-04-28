"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { ProfileReadinessHeader } from "./profile-readiness-header"
import { BusinessIdentityBlock } from "./business-identity-block"
import { VisualPresenceBlock } from "./visual-presence-block"
import { ServiceAreaBlock } from "./service-area-block"
import { OperationalCredibilityBlock } from "./operational-credibility-block"
import { TrustChecklistSidebar } from "./trust-checklist-sidebar"

// Mock data that would come from GET /providers/me
const mockProfileData = {
  businessName: "Ahmed Plomberie Pro",
  description:
    "Expert plumber with over 15 years of experience serving Algiers and surrounding areas. Specializing in emergency repairs, bathroom renovations, and commercial plumbing solutions. Available 24/7 for urgent calls.",
  primaryCategory: "plumbing",
  subcategory: "emergency-repairs",
  yearsOfExperience: 15,
  wilaya: "algiers",
  city: "algiers-centre",
  address: "45 Rue Didouche Mourad",
  coverageMode: "regional" as const,
  coverageRegions: ["algiers", "blida", "boumerdes"],
  responseTimeMinutes: 60,
  actualResponseTime: "45 min",
  responseTimeStatus: "excellent" as const,
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
  coverUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=400&fit=crop",
  profileScore: 85,
  publicReadiness: "ready" as const,
  viewsThisWeek: 247,
}

const categories = [
  {
    id: "plumbing",
    name: "Plumbing",
    subcategories: [
      { id: "emergency-repairs", name: "Emergency Repairs" },
      { id: "bathroom-renovation", name: "Bathroom Renovation" },
      { id: "commercial", name: "Commercial Plumbing" },
    ],
  },
  {
    id: "electrical",
    name: "Electrical",
    subcategories: [
      { id: "residential", name: "Residential" },
      { id: "commercial-electrical", name: "Commercial" },
      { id: "installation", name: "Installation" },
    ],
  },
  {
    id: "construction",
    name: "Construction",
    subcategories: [
      { id: "residential-construction", name: "Residential" },
      { id: "renovation", name: "Renovation" },
      { id: "masonry", name: "Masonry" },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning Services",
    subcategories: [
      { id: "residential-cleaning", name: "Residential" },
      { id: "commercial-cleaning", name: "Commercial" },
      { id: "deep-cleaning", name: "Deep Cleaning" },
    ],
  },
]

const regions = [
  {
    id: "algiers",
    name: "Algiers",
    cities: [
      { id: "algiers-centre", name: "Algiers Centre" },
      { id: "bab-el-oued", name: "Bab El Oued" },
      { id: "hussein-dey", name: "Hussein Dey" },
    ],
  },
  {
    id: "blida",
    name: "Blida",
    cities: [
      { id: "blida-centre", name: "Blida Centre" },
      { id: "boufarik", name: "Boufarik" },
    ],
  },
  {
    id: "boumerdes",
    name: "Boumerdes",
    cities: [
      { id: "boumerdes-centre", name: "Boumerdes Centre" },
      { id: "bordj-menaiel", name: "Bordj Menaiel" },
    ],
  },
  { id: "tipaza", name: "Tipaza", cities: [] },
  { id: "oran", name: "Oran", cities: [] },
  { id: "constantine", name: "Constantine", cities: [] },
  { id: "annaba", name: "Annaba", cities: [] },
  { id: "setif", name: "Setif", cities: [] },
  { id: "batna", name: "Batna", cities: [] },
  { id: "tizi-ouzou", name: "Tizi Ouzou", cities: [] },
  { id: "bejaia", name: "Bejaia", cities: [] },
  { id: "djelfa", name: "Djelfa", cities: [] },
]

export function ProfileContent() {
  const [profile, setProfile] = useState(mockProfileData)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateProfile = useCallback(
    <K extends keyof typeof mockProfileData>(
      key: K,
      value: (typeof mockProfileData)[K]
    ) => {
      setProfile((prev) => ({ ...prev, [key]: value }))
      setHasChanges(true)
    },
    []
  )

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call to PUT /providers/me
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
    setHasChanges(false)
  }

  const handlePreview = () => {
    // Would open public profile preview modal or new tab
    window.open("/provider/preview", "_blank")
  }

  const scrollTo = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Build checklist items based on profile state
  const checklistItems = [
    {
      id: "business-name",
      label: "Business name",
      completed: profile.businessName.length > 0,
      weight: 15,
      category: "identity" as const,
      scrollTo: "identity-block",
    },
    {
      id: "description",
      label: "Professional description",
      completed: profile.description.length >= 100,
      weight: 20,
      category: "identity" as const,
      scrollTo: "identity-block",
    },
    {
      id: "category",
      label: "Primary category",
      completed: !!profile.primaryCategory,
      weight: 10,
      category: "identity" as const,
      scrollTo: "identity-block",
    },
    {
      id: "avatar",
      label: "Profile photo",
      completed: !!profile.avatarUrl,
      weight: 15,
      category: "visual" as const,
      scrollTo: "visual-block",
    },
    {
      id: "cover",
      label: "Cover photo",
      completed: !!profile.coverUrl,
      weight: 5,
      category: "visual" as const,
      scrollTo: "visual-block",
    },
    {
      id: "location",
      label: "Business location",
      completed: !!profile.wilaya && !!profile.city,
      weight: 15,
      category: "location" as const,
      scrollTo: "location-block",
    },
    {
      id: "coverage",
      label: "Service coverage",
      completed:
        profile.coverageMode === "national" ||
        profile.coverageMode === "local" ||
        (profile.coverageMode === "regional" && profile.coverageRegions.length > 0),
      weight: 10,
      category: "location" as const,
      scrollTo: "location-block",
    },
    {
      id: "response-time",
      label: "Response time set",
      completed: profile.responseTimeMinutes > 0,
      weight: 10,
      category: "response" as const,
      scrollTo: "credibility-block",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Profile Readiness Header */}
      <ProfileReadinessHeader
        businessName={profile.businessName}
        profileScore={profile.profileScore}
        publicReadiness={profile.publicReadiness}
        viewsThisWeek={profile.viewsThisWeek}
        onPreviewClick={handlePreview}
      />

      {/* Main Layout: Content + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: Form Blocks */}
        <div className="space-y-6">
          {/* Business Identity */}
          <div id="identity-block">
            <BusinessIdentityBlock
              businessName={profile.businessName}
              description={profile.description}
              primaryCategory={profile.primaryCategory}
              subcategory={profile.subcategory}
              yearsOfExperience={profile.yearsOfExperience}
              categories={categories}
              onBusinessNameChange={(v) => updateProfile("businessName", v)}
              onDescriptionChange={(v) => updateProfile("description", v)}
              onCategoryChange={(v) => updateProfile("primaryCategory", v)}
              onSubcategoryChange={(v) => updateProfile("subcategory", v)}
              onYearsChange={(v) => updateProfile("yearsOfExperience", v)}
            />
          </div>

          {/* Visual Presence */}
          <div id="visual-block">
            <VisualPresenceBlock
              avatarUrl={profile.avatarUrl}
              coverUrl={profile.coverUrl}
              businessName={profile.businessName}
              onAvatarUpload={() => {
                // Would trigger file upload to POST /providers/me/media
                console.log("Upload avatar")
              }}
              onCoverUpload={() => {
                // Would trigger file upload to POST /providers/me/media
                console.log("Upload cover")
              }}
              onAvatarRemove={() => updateProfile("avatarUrl", undefined as unknown as string)}
              onCoverRemove={() => updateProfile("coverUrl", undefined as unknown as string)}
            />
          </div>

          {/* Service Area & Location */}
          <div id="location-block">
            <ServiceAreaBlock
              wilaya={profile.wilaya}
              city={profile.city}
              address={profile.address}
              coverageMode={profile.coverageMode}
              coverageRegions={profile.coverageRegions}
              regions={regions}
              onWilayaChange={(v) => updateProfile("wilaya", v)}
              onCityChange={(v) => updateProfile("city", v)}
              onAddressChange={(v) => updateProfile("address", v)}
              onCoverageModeChange={(v) => updateProfile("coverageMode", v)}
              onCoverageRegionsChange={(v) => updateProfile("coverageRegions", v)}
            />
          </div>

          {/* Response & Credibility */}
          <div id="credibility-block">
            <OperationalCredibilityBlock
              responseTimeMinutes={profile.responseTimeMinutes}
              actualResponseTime={profile.actualResponseTime}
              responseTimeStatus={profile.responseTimeStatus}
              onResponseTimeChange={(v) => updateProfile("responseTimeMinutes", v)}
            />
          </div>

          {/* Save Action Bar */}
          <div className="sticky bottom-0 -mx-1 flex items-center justify-between rounded-lg border border-border/60 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="text-sm text-muted-foreground">
              {hasChanges ? (
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-warning" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-success">All changes saved</span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right: Trust Checklist Sidebar */}
        <div className="hidden lg:block">
          <TrustChecklistSidebar items={checklistItems} onScrollTo={scrollTo} />
        </div>
      </div>
    </div>
  )
}
