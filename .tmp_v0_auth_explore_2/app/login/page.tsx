import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, UserPlus, Briefcase, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Sign In - Professional Services Platform",
  description: "Sign in to continue where you left off. Your saved searches, conversations, and requests are waiting.",
};

export default function LoginPage() {
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
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
      <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Heading & Reassurance */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Your progress is saved
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-balance">
              Sign in to continue where you left off. Your searches and conversations are saved.
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80">
            <CardContent className="pt-6">
              <LoginForm />

              {/* Trust Signal */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-teal-600" />
                <span>Secure, encrypted connection</span>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Actions */}
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              {"Don't have an account?"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/join/customer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-card hover:border-primary/30 hover:shadow-sm"
              >
                <UserPlus className="h-4 w-4 text-primary" />
                <span>Create Account</span>
              </Link>
              <Link
                href="/join/provider"
                className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-card hover:border-teal-500/30 hover:shadow-sm"
              >
                <Briefcase className="h-4 w-4 text-teal-600" />
                <span>Join as Provider</span>
              </Link>
            </div>
          </div>

          {/* Help Note */}
          <p className="text-center text-xs text-muted-foreground">
            Need help?{" "}
            <Link
              href="/support"
              className="text-primary hover:text-primary/80 underline underline-offset-4 hover:no-underline transition-colors"
            >
              Contact support
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
