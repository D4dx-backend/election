import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary-100",
  iconColor = "text-primary",
  trend,
}: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-row items-center gap-3">
          <div className={cn("flex-shrink-0 rounded-md p-2", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">{title}</p>
            <div className="flex min-w-0 items-center gap-1">
              <p className="text-lg font-bold leading-none text-gray-900">{value}</p>
              {trend && (
                <>
                  {trend.direction === 'up' && (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  )}
                  {trend.direction === 'down' && (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span 
                    className={cn(
                      "truncate text-xs",
                      trend.direction === 'up' ? "text-green-500" : 
                      trend.direction === 'down' ? "text-red-500" : "text-gray-500"
                    )}
                  >
                    {trend.value}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
