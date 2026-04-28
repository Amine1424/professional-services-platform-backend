import Link from "next/link";
import {
  Droplet,
  Zap,
  Sparkles,
  Thermometer,
  TreePine,
  Paintbrush,
  Home,
  Truck,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  droplet: Droplet,
  zap: Zap,
  sparkles: Sparkles,
  thermometer: Thermometer,
  tree: TreePine,
  paintbrush: Paintbrush,
  home: Home,
  truck: Truck,
};

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Home;

  return (
    <Link href={`/explore?category=${category.slug}`}>
      <Card className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground">{category.name}</h3>
            <p className="text-sm text-muted-foreground">
              {category.providerCount} providers
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
