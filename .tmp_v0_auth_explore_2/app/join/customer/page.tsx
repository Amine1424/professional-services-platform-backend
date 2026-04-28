import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, MessageCircle, Heart, ArrowRight } from "lucide-react";
import { CustomerSignupForm } from "@/components/auth/customer-signup-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Join as Customer - Professional Services Platform",
  description: "Create your free account to find trusted local providers, save favorites, and request services.",
};

export default function CustomerSignupPage() {
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
        {/* Decorative Color Accents */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-teal-500/8 rounded-full blur-3xl" />
      </div>

      {/* Minimal Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-sm font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Marketplace</span>
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
      <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-7xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Heading - Short Customer Value Statement */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              Find the right professional, fast
            </h1>
            <p className="text-muted-foreground text-sm">
              Create your free account to get started
            </p>
          </div>

          {/* Signup Card */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
            <CardContent className="pt-6 pb-5">
              <CustomerSignupForm />
            </CardContent>
          </Card>

          {/* What Happens Next - Simple, Clear */}
          <div className="rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              After you sign up
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Browse providers, save favorites, and send messages
              </p>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-foreground font-medium hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
            
            <div className="w-full h-px bg-border/50" />
            
            <Link
              href="/join/provider"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span>Want to offer services instead?</span>
              <span className="font-medium text-teal-600 group-hover:text-teal-500 flex items-center gap-1">
                Join as provider
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
