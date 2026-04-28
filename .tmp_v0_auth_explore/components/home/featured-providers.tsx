import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProviderCard } from "./provider-card";
import type { Provider } from "@/lib/types";

interface FeaturedProvidersProps {
  providers: Provider[];
}

export function FeaturedProviders({ providers }: FeaturedProvidersProps) {
  if (providers.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Featured Providers</h2>
            <p className="mt-1 text-muted-foreground">
              Top-rated professionals in your area
            </p>
          </div>
          <Link
            href="/explore"
            className="group hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            See all providers
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Provider Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {providers.slice(0, 6).map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        {/* Mobile See All Link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See all providers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
