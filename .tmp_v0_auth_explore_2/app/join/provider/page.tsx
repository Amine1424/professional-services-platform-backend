import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Shield,
  UserPlus,
  Briefcase,
  CheckCircle2,
  Search,
  Star,
  MessageSquare,
} from "lucide-react";
import { ProviderSignupForm } from "@/components/auth/provider-signup-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Join as Provider - Professional Services Platform",
  description:
    "Create your professional presence on the marketplace. Build credibility, attract customers, and grow your service business.",
};

export default function ProviderSignupPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/auth-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Minimal Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Marketplace
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to marketplace</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Left Column - Value Proposition */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700">
                <Briefcase className="h-3 w-3" />
                For Service Professionals
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl text-balance">
                Build your professional presence
              </h1>
              <p className="text-muted-foreground text-balance">
                Join verified service providers. Create a credible profile that
                helps customers find and trust you from day one.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <Search className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Appear in search results
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get discovered by customers searching for your services
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <Star className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Build trust with reviews
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collect verified reviews from satisfied customers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <MessageSquare className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Direct customer messaging
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Communicate directly and manage service requests
                  </p>
                </div>
              </div>
            </div>

            {/* Moderation Note */}
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">
                  Quality-first marketplace
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All provider profiles are reviewed before appearing in search
                  results. Complete profiles are approved faster.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-3">
            <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
              <CardContent className="pt-6">
                <ProviderSignupForm />
              </CardContent>
            </Card>

            {/* Secondary Actions */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground">
                  Already have an account?
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-card hover:border-primary/30 hover:shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/join/customer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-card hover:border-primary/30 hover:shadow-sm"
                >
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>Join as Customer</span>
                </Link>
              </div>
            </div>

            {/* Help Note */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Need help?{" "}
              <Link
                href="/support"
                className="text-primary hover:text-primary/80 underline underline-offset-4 hover:no-underline transition-colors"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
