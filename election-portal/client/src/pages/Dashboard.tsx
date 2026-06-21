import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentElectionsTable } from "@/components/dashboard/RecentElectionsTable";
import { FranchiseOverview } from "@/components/dashboard/FranchiseOverview";
import { Vote, Users, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mockDashboardStats, getRecentElections } from "@/lib/mockData";
import { DashboardStats, ElectionWithDetails } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  // Get the user from localStorage
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data', error);
      }
    }
  }, []);
  
  // Fetch dashboard stats from API with fallback to mock data
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsFetchError,
  } = useQuery<DashboardStats>({
    queryKey: ['/api/analytics/dashboard'],
  });

  // Fetch recent elections from API
  const {
    data: recentElections,
    isLoading: electionsLoading,
    isError: electionsError,
    error: electionsFetchError,
  } = useQuery<ElectionWithDetails[]>({
    queryKey: ['/api/elections'],
  });

  useEffect(() => {
    if (statsError) {
      console.error('Error fetching dashboard stats:', statsFetchError);
      toast({
        title: "Failed to load dashboard stats",
        description: "Using cached data instead",
        variant: "destructive"
      });
    }
  }, [statsError, statsFetchError, toast]);

  useEffect(() => {
    if (electionsError) {
      console.error('Error fetching recent elections:', electionsFetchError);
      toast({
        title: "Failed to load recent elections",
        description: "Using cached data instead",
        variant: "destructive"
      });
    }
  }, [electionsError, electionsFetchError, toast]);

  // Use actual data if available, fall back to mock data if needed
  const displayStats = stats || mockDashboardStats;
  const displayElections = recentElections ? recentElections.slice(0, 3) : getRecentElections(3);

  useEffect(() => {
    document.title = "Dashboard | Vote+";
  }, []);

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            {user ? `Welcome, ${user.fullName || user.username}` : 'Overview of all election activities'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6">
          {statsLoading ? (
            <>
              <Skeleton className="h-24 w-full md:h-28" />
              <Skeleton className="h-24 w-full md:h-28" />
              <Skeleton className="h-24 w-full md:h-28" />
            </>
          ) : (
            <>
              <StatCard
                title="Active Elections"
                value={displayStats.activeElections}
                icon={<Vote className="h-5 w-5" />}
                trend={{ 
                  value: `${displayStats.activeElections} active now`, 
                  direction: displayStats.activeElections > 0 ? "up" : "neutral" 
                }}
              />

              <StatCard
                title="Registered Voters"
                value={displayStats.totalVoters.toLocaleString()}
                icon={<Users className="h-5 w-5" />}
                iconBgColor="bg-indigo-100"
                iconColor="text-indigo-600"
                trend={{ 
                  value: `${displayStats.totalVoters} total`, 
                  direction: "neutral" 
                }}
              />

              <StatCard
                title="Votes Cast"
                value={displayStats.votesCast.toLocaleString()}
                icon={<CheckCircle className="h-5 w-5" />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                trend={{ 
                  value: displayStats.totalVoters > 0 
                    ? `${Math.round((displayStats.votesCast / displayStats.totalVoters) * 100)}% turnout` 
                    : 'No voters yet', 
                  direction: "neutral" 
                }}
              />
            </>
          )}
        </div>

        {/* Recent Elections Table */}
        {electionsLoading ? (
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <RecentElectionsTable elections={displayElections} />
        )}

        {/* Franchise Overview — only relevant to super admins (cross-franchise view) */}
        {user?.role === "super_admin" && (
          <div className="mt-6">
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <FranchiseOverview
                stats={{
                  totalFranchises: displayStats.totalFranchises,
                  totalElections: displayStats.totalElections,
                  franchiseDistribution: displayStats.franchiseDistribution
                }}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
