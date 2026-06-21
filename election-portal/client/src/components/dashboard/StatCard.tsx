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
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex min-h-20 flex-col items-start gap-2 md:min-h-0 md:flex-row md:items-center md:gap-0">
          <div className={cn("flex-shrink-0 rounded-md p-2 md:p-3", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="min-w-0 md:ml-5">
            <p className="text-[11px] font-medium leading-tight text-gray-500 sm:text-xs md:text-sm">{title}</p>
            <div className="flex min-w-0 items-baseline md:items-center">
              <p className="text-lg font-semibold leading-none text-gray-900 md:text-xl">{value}</p>
              {trend && (
                <>
                  {trend.direction === 'up' && (
                    <TrendingUp className="ml-1 hidden h-4 w-4 text-green-500 sm:block md:ml-2" />
                  )}
                  {trend.direction === 'down' && (
                    <TrendingDown className="ml-1 hidden h-4 w-4 text-red-500 sm:block md:ml-2" />
                  )}
                  <span 
                    className={cn(
                      "ml-1 hidden truncate text-xs sm:inline md:text-sm",
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
