import { MarketplaceHeader } from "./marketplace-header";

interface PublicMarketplaceLayoutProps {
  children: React.ReactNode;
}

export function PublicMarketplaceLayout({ children }: PublicMarketplaceLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">For Customers</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
                    Find Providers
                  </a>
                </li>
                <li>
                  <a href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/help" className="text-sm text-muted-foreground hover:text-foreground">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">For Providers</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="/for-providers" className="text-sm text-muted-foreground hover:text-foreground">
                    Join as Provider
                  </a>
                </li>
                <li>
                  <a href="/provider-resources" className="text-sm text-muted-foreground hover:text-foreground">
                    Resources
                  </a>
                </li>
                <li>
                  <a href="/success-stories" className="text-sm text-muted-foreground hover:text-foreground">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/trust-safety" className="text-sm text-muted-foreground hover:text-foreground">
                    Trust & Safety
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
