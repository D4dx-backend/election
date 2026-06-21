import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { ElectionFilters } from "@/components/elections/ElectionFilters";
import { ElectionsTable } from "@/components/elections/ElectionsTable";
import { Button } from "@/components/ui/button";
import { PlusIcon, AlertCircle } from "lucide-react";
import { ElectionFilter, ElectionWithDetails, Franchise, Pagination } from "@/lib/types";
import { useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function Elections() {
  const [filters, setFilters] = useState<ElectionFilter>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteElectionId, setDeleteElectionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user data from localStorage for role-based filtering
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userRole = userData?.role || '';
  const userFranchiseId = userData?.franchiseId || '';
  const userElectionAccess = userData?.electionAccess || [];

  // Construct query string from filters
  const getQueryString = useCallback(() => {
    const queryParams = new URLSearchParams();

    if (filters.franchiseId) {
      queryParams.append('franchiseId', filters.franchiseId.toString());
    }

    if (filters.status) {
      queryParams.append('status', filters.status);
    }

    if (filters.dateFrom) {
      queryParams.append('fromDate', filters.dateFrom.toISOString().split('T')[0]);
    }

    if (filters.dateTo) {
      queryParams.append('toDate', filters.dateTo.toISOString().split('T')[0]);
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }, [filters]);

  // Auto-apply franchise filter for franchise admins
  useEffect(() => {
    if (userRole === 'franchise_admin' && userFranchiseId) {
      setFilters(prev => ({
        ...prev,
        franchiseId: userFranchiseId
      }));
    }
  }, [userRole, userFranchiseId]);

  // Fetch elections with filters + server-side pagination applied
  const {
    data: electionsResponse,
    isLoading: electionsLoading,
    isError: electionsError,
    refetch: refetchElections
  } = useQuery<{ data: ElectionWithDetails[]; pagination?: Pagination }>({
    queryKey: ['/api/elections', getQueryString(), page],
    queryFn: async () => {
      const qs = getQueryString();
      const sep = qs ? '&' : '?';
      const res = await apiRequest('GET', `/api/elections${qs}${sep}page=${page}&limit=${pageSize}`);
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const elections = electionsResponse?.data ?? [];
  const electionsPagination = electionsResponse?.pagination;

  // Fetch franchises for filtering
  const { 
    data: franchises = [], 
    isLoading: franchisesLoading, 
    isError: franchisesError 
  } = useQuery<Franchise[]>({
    queryKey: ['/api/franchises']
  });

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'active' | 'completed' | 'archived') => {
    try {
      await fetch(`/api/elections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      // Refetch elections
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });

      toast({
        title: "Status Updated",
        description: "Election status has been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update election status.",
        variant: "destructive"
      });
    }
  };

  // Delete election mutation
  const deleteMutation = useMutation({
    mutationFn: async (electionId: string) => {
      await apiRequest('DELETE', `/api/elections/${electionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Election deleted",
        description: "The election has been successfully deleted",
        variant: "success"
      });

      // Invalidate and refetch elections
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });

      setDeleteElectionId(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: `Failed to delete election: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setDeleteElectionId(null);
    }
  });

  const handleApplyFilters = (newFilters: ElectionFilter) => {
    // For franchise admin, ensure franchiseId filter is always applied
    if (userRole === 'franchise_admin' && userFranchiseId) {
      newFilters.franchiseId = userFranchiseId;
    }
    setPage(1);
    setFilters(newFilters);
  };

  const handleDeleteElection = (id: string) => {
    setDeleteElectionId(id);
  };

  const confirmDelete = () => {
    if (deleteElectionId) {
      deleteMutation.mutate(deleteElectionId);
    }
  };

  useEffect(() => {
    document.title = "Elections | Vote+";
  }, []);

  // Get filtered elections based on user role
  const getFilteredElections = () => {
    if (!elections || !elections.length) return [];

    if (userRole === 'super_admin') {
      // Super admin can see all elections
      return elections;
    } else if (userRole === 'franchise_admin') {
      // Franchise admin sees only their franchise's elections
      // (Already filtered by API due to franchiseId filter set above)
      return elections;
    } else if (userRole === 'election_admin' && userElectionAccess && userElectionAccess.length > 0) {
      // Election admin sees only elections they have access to
      return elections.filter(election => {
        const electionId = election._id?.toString() || election.id?.toString();
        return electionId && userElectionAccess.includes(electionId);
      });
    } else {
      // Default fallback
      return elections;
    }
  };

  // Use the data from API responses
  const displayElections = getFilteredElections();
  const displayFranchises = franchises || [];

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Elections</h1>
          <p className="text-sm text-gray-600">Manage all your election campaigns</p>
        </div>
        <div className="mt-4 sm:mt-0 flex w-full gap-2 sm:w-auto">
          <Link href="/elections/create">
            <Button className="w-full sm:w-auto">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Election
            </Button>
          </Link>
        </div>
      </div>

      {franchisesError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch franchises. Showing cached data instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Only show franchise filter if user is not a franchise admin */}
      {userRole !== 'franchise_admin' && !franchisesLoading && (
        <ElectionFilters
          franchises={displayFranchises}
          onApplyFilters={handleApplyFilters}
        />
      )}

      {electionsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch elections. Showing cached data instead.
          </AlertDescription>
        </Alert>
      )}

      {electionsLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <ElectionsTable 
            elections={displayElections} 
            onDelete={handleDeleteElection}
            onStatusChange={handleStatusChange}
          />
          {electionsPagination && (
            <PaginationControls
              page={electionsPagination.page}
              totalPages={electionsPagination.totalPages ?? 1}
              total={electionsPagination.total}
              pageSize={electionsPagination.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AlertDialog 
        open={deleteElectionId !== null} 
        onOpenChange={(open) => !open && setDeleteElectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              election and all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}