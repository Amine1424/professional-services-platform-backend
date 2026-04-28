"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

// Algerian Wilayas
const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj",
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane",
];

// Service Categories
const categories = [
  { id: "plumbing", name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "cleaning", name: "Cleaning" },
  { id: "hvac", name: "HVAC" },
  { id: "landscaping", name: "Landscaping" },
  { id: "painting", name: "Painting" },
  { id: "roofing", name: "Roofing" },
  { id: "moving", name: "Moving" },
  { id: "carpentry", name: "Carpentry" },
  { id: "appliance-repair", name: "Appliance Repair" },
];

// Service Coverage Options
const coverageOptions = [
  { id: "local", name: "Local Only", description: "Within my city" },
  { id: "regional", name: "Regional", description: "My wilaya and nearby" },
  { id: "national", name: "National", description: "Across Algeria" },
];

interface FormData {
  // Business Identity
  businessName: string;
  ownerName: string;
  phone: string;
  // Marketplace Placement
  category: string;
  wilaya: string;
  city: string;
  // Service Coverage
  coverage: string;
  // Business Summary
  summary: string;
  // Account Security
  email: string;
  password: string;
  // Terms
  agreeTerms: boolean;
}

interface FormErrors {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  category?: string;
  wilaya?: string;
  city?: string;
  coverage?: string;
  summary?: string;
  email?: string;
  password?: string;
  agreeTerms?: string;
}

export function ProviderSignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    ownerName: "",
    phone: "",
    category: "",
    wilaya: "",
    city: "",
    coverage: "",
    summary: "",
    email: "",
    password: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const sections = [
    { id: "identity", title: "Business Identity", fields: ["businessName", "ownerName", "phone"] },
    { id: "placement", title: "Marketplace Placement", fields: ["category", "wilaya", "city"] },
    { id: "coverage", title: "Service Coverage", fields: ["coverage"] },
    { id: "summary", title: "Business Summary", fields: ["summary"] },
    { id: "security", title: "Account Security", fields: ["email", "password"] },
  ];

  const validateSection = (sectionIndex: number): boolean => {
    const section = sections[sectionIndex];
    const newErrors: FormErrors = {};

    section.fields.forEach((field) => {
      const value = formData[field as keyof FormData];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field as keyof FormErrors] = "This field is required";
      }
    });

    // Additional validations
    if (sectionIndex === 0 && formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (sectionIndex === 3 && formData.summary && formData.summary.length < 50) {
      newErrors.summary = "Please provide at least 50 characters";
    }

    if (sectionIndex === 4) {
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
      }
      if (formData.password && formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSection(currentSection)) return;
    
    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: "You must agree to continue" });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Business Identity
        return (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
              <FieldDescription>The name customers will see</FieldDescription>
              <Input
                id="businessName"
                type="text"
                placeholder="e.g. Ahmed Plumbing Services"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                aria-invalid={!!errors.businessName}
                autoFocus
              />
              {errors.businessName && <FieldError>{errors.businessName}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="ownerName">Your Full Name</FieldLabel>
              <Input
                id="ownerName"
                type="text"
                placeholder="e.g. Ahmed Benali"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                aria-invalid={!!errors.ownerName}
                autoComplete="name"
              />
              {errors.ownerName && <FieldError>{errors.ownerName}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <FieldDescription>Primary contact for customers</FieldDescription>
              <Input
                id="phone"
                type="tel"
                placeholder="0555 00 00 00"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                aria-invalid={!!errors.phone}
                autoComplete="tel"
              />
              {errors.phone && <FieldError>{errors.phone}</FieldError>}
            </Field>
          </FieldGroup>
        );

      case 1: // Marketplace Placement
        return (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="category">Primary Service Category</FieldLabel>
              <FieldDescription>Choose the main service you offer</FieldDescription>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" aria-invalid={!!errors.category}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <FieldError>{errors.category}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="wilaya">Wilaya</FieldLabel>
              <FieldDescription>Your primary operating region</FieldDescription>
              <Select
                value={formData.wilaya}
                onValueChange={(value) => setFormData({ ...formData, wilaya: value })}
              >
                <SelectTrigger id="wilaya" aria-invalid={!!errors.wilaya}>
                  <SelectValue placeholder="Select wilaya" />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((wilaya) => (
                    <SelectItem key={wilaya} value={wilaya}>
                      {wilaya}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.wilaya && <FieldError>{errors.wilaya}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="city">City / Commune</FieldLabel>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Bab El Oued"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                aria-invalid={!!errors.city}
              />
              {errors.city && <FieldError>{errors.city}</FieldError>}
            </Field>
          </FieldGroup>
        );

      case 2: // Service Coverage
        return (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel>Service Coverage Area</FieldLabel>
              <FieldDescription>How far are you willing to travel for work?</FieldDescription>
              <div className="mt-2 space-y-2">
                {coverageOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                      formData.coverage === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="coverage"
                      value={option.id}
                      checked={formData.coverage === option.id}
                      onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      formData.coverage === option.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}>
                      {formData.coverage === option.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.coverage && <FieldError>{errors.coverage}</FieldError>}
            </Field>
          </FieldGroup>
        );

      case 3: // Business Summary
        return (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="summary">Business Summary</FieldLabel>
              <FieldDescription>
                Describe your services, experience, and what makes you stand out. This helps customers find and trust you.
              </FieldDescription>
              <Textarea
                id="summary"
                placeholder="e.g. Professional plumber with 10+ years of experience. Specializing in emergency repairs, bathroom renovations, and water heater installations. Available 7 days a week with same-day service for urgent issues."
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                aria-invalid={!!errors.summary}
                rows={5}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                {errors.summary ? (
                  <FieldError>{errors.summary}</FieldError>
                ) : (
                  <span className="text-xs text-muted-foreground">Minimum 50 characters</span>
                )}
                <span className={`text-xs ${formData.summary.length < 50 ? "text-muted-foreground" : "text-primary"}`}>
                  {formData.summary.length} / 50+
                </span>
              </div>
            </Field>
          </FieldGroup>
        );

      case 4: // Account Security
        return (
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <FieldDescription>Used for account access and notifications</FieldDescription>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                aria-invalid={!!errors.email}
                autoComplete="email"
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Create Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  aria-invalid={!!errors.password}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </Field>
          </FieldGroup>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-1">
        {sections.map((section, index) => (
          <div key={section.id} className="flex items-center flex-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                index < currentSection
                  ? "bg-primary text-primary-foreground"
                  : index === currentSection
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentSection ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < sections.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${
                  index < currentSection ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{sections[currentSection].title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Step {currentSection + 1} of {sections.length}
        </p>
      </div>

      {/* Form Fields */}
      <div className="min-h-[280px]">
        {renderSection()}
      </div>

      {/* Terms (only on last step) */}
      {currentSection === sections.length - 1 && (
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={formData.agreeTerms}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, agreeTerms: checked === true })
              }
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground cursor-pointer select-none leading-snug"
            >
              I agree to the{" "}
              <a href="/terms" className="text-foreground underline underline-offset-4 hover:no-underline">
                Terms of Service
              </a>
              {" "}and{" "}
              <a href="/privacy" className="text-foreground underline underline-offset-4 hover:no-underline">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.agreeTerms && <FieldError>{errors.agreeTerms}</FieldError>}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentSection > 0 && (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
            Back
          </Button>
        )}
        {currentSection < sections.length - 1 ? (
          <Button type="button" onClick={handleNext} className="flex-1">
            Continue
          </Button>
        ) : (
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Join as Service Provider"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
