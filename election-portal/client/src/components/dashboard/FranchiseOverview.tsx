import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardStats } from "@/lib/types";

interface FranchiseOverviewProps {
  stats: Pick<DashboardStats, 'totalFranchises' | 'totalElections' | 'franchiseDistribution'>;
}

export function FranchiseOverview({ stats }: FranchiseOverviewProps) {
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Franchise Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          <svg
            className="w-20 h-20 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Total Franchises</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalFranchises}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Total Elections</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalElections}</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-md font-medium text-gray-900 mb-2">Franchise Distribution</h3>
          <div className="space-y-3">
            {stats.franchiseDistribution.map((franchise, index) => (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{franchise.name}</span>
                  <span className="text-sm font-medium text-gray-900">{franchise.percentage}%</span>
                </div>
                <Progress value={franchise.percentage} className="h-2.5 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
