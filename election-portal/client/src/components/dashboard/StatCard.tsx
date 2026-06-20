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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-center">
              <p className="text-xl font-semibold text-gray-900">{value}</p>
              {trend && (
                <>
                  {trend.direction === 'up' && (
                    <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                  )}
                  {trend.direction === 'down' && (
                    <TrendingDown className="ml-2 h-4 w-4 text-red-500" />
                  )}
                  <span 
                    className={cn(
                      "text-sm ml-1",
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
