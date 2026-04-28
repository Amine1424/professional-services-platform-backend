import Link from "next/link";
import { 
  AlertCircle, 
  Wrench, 
  Sparkles, 
  TreePine,
  LucideIcon 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { QuickAction } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  "alert-circle": AlertCircle,
  "wrench": Wrench,
  "sparkles": Sparkles,
  "tree": TreePine,
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] || Wrench;
            
            return (
              <Link key={action.id} href={action.href}>
                <Card className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{action.label}</h3>
                      {action.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
