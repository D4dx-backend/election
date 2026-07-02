import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardStats } from "@/lib/types";
import { Globe, Phone } from "lucide-react";

interface FranchiseOverviewProps {
  stats: Pick<DashboardStats, "totalFranchises" | "totalElections" | "franchiseDistribution">;
}

function formatWebsiteHref(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function FranchiseOverview({ stats }: FranchiseOverviewProps) {
  const franchises = stats.franchiseDistribution;
  const hasDistribution = franchises.some((f) => (f.electionCount ?? 0) > 0 || f.percentage > 0);

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Franchise Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!hasDistribution && franchises.length > 0 && (
          <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Election distribution will appear once elections are assigned to franchises.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Franchises</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalFranchises}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-500">Total Elections</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalElections}</p>
          </div>
        </div>

        {franchises.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Franchises</h3>
            {franchises.map((franchise) => (
              <div
                key={franchise.id || franchise.name}
                className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{franchise.name}</p>
                    <p className="text-xs text-gray-500">
                      {franchise.electionCount ?? 0} election(s)
                      {hasDistribution ? ` · ${franchise.percentage}% of total` : ""}
                    </p>
                  </div>
                </div>

                {hasDistribution && (
                  <Progress value={franchise.percentage} className="h-2" />
                )}

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Website</p>
                    {franchise.websiteUrl ? (
                      <a
                        href={formatWebsiteHref(franchise.websiteUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center font-medium text-blue-600 hover:underline"
                      >
                        <Globe className="h-4 w-4 mr-1 shrink-0" />
                        <span className="truncate">{franchise.websiteUrl}</span>
                      </a>
                    ) : (
                      <p className="text-gray-400">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact</p>
                    {franchise.contactNumber ? (
                      <p className="inline-flex items-center font-medium text-gray-900">
                        <Phone className="h-4 w-4 mr-1 shrink-0" />
                        {franchise.contactNumber}
                      </p>
                    ) : (
                      <p className="text-gray-400">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No franchises yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
