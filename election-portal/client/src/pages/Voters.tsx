import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { VoterBulkGenerator } from "@/components/voters/VoterBulkGenerator";
import { VotersTable } from "@/components/voters/VotersTable";
import { BulkVoterSlipPrinter } from "@/components/voters/BulkVoterSlipPrinter";
import VoterGroups from "@/pages/VoterGroups";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Upload, AlertCircle, UsersRound, Search, UserPlus } from "lucide-react";
import { BulkVoterGenerationOptions, Pagination, User, Election, ElectionGroup } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type MongoIdRecord = { _id?: string; id?: string | number };
type VoterRecord = User & MongoIdRecord & { electionAccess?: Array<string | number | { toString: () => string }> };
type ElectionRecord = Election & MongoIdRecord;
type VoterGroupResponse = { data?: ElectionGroup[] };
type VotersResponse = { data?: VoterRecord[]; pagination?: Pagination };
type ElectionsResponse = { data?: ElectionRecord[] };

function getRecordId(record: MongoIdRecord): string {
  return record._id?.toString() || record.id?.toString() || "";
}

export default function Voters({ embedded = false, electionId }: { embedded?: boolean; electionId?: string } = {}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteVoterId, setDeleteVoterId] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElectionId, setSelectedElectionId] = useState<string>(electionId || "all");
  const [createVoterOpen, setCreateVoterOpen] = useState(false);
  const [createVoterMode, setCreateVoterMode] = useState<'choice' | 'existing' | 'new'>('choice');
  const [existingVoterSearch, setExistingVoterSearch] = useState("");
  const [selectedExistingVoterIds, setSelectedExistingVoterIds] = useState<string[]>([]);
  const [existingVoterElectionId, setExistingVoterElectionId] = useState(electionId || "");
  const [bulkVoterOpen, setBulkVoterOpen] = useState(false);
  const [newVoter, setNewVoter] = useState({
    fullName: "",
    username: "",
    password: "",
    registrationNumber: "",
    electionId: electionId || "",
  });
  
  // Construct the query string for pagination and filtering
  const getVotersQueryString = () => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    // Add election filter if selected and not "all"
    if (selectedElectionId && selectedElectionId !== "all") {
      params.append('electionId', selectedElectionId);
    }
    
    return params.toString();
  };
  
  // Fetch voters with pagination
  const { 
    data: votersResponse, 
    isLoading: votersLoading, 
    isError: votersError,
    refetch: refetchVoters
  } = useQuery<VotersResponse>({
    queryKey: ['/api/users/voters', selectedElectionId, page, pageSize],
    queryFn: async () => {
      const queryString = getVotersQueryString();
      console.log(`Fetching voters with query params: ${queryString}`);
      const response = await apiRequest('GET', `/api/users/voters?${queryString}`);
      return response.json();
    },
    refetchOnWindowFocus: false
  });

  // Fetch elections for the bulk generator
  const { 
    data: allElections,
    isLoading: electionsLoading,
    isError: electionsError
  } = useQuery<ElectionsResponse>({
    queryKey: ['/api/elections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/elections');
      return response.json();
    },
    refetchOnWindowFocus: false
  });
  
  // Fetch all voters for the existing picker in Create Voter dialog
  const { data: allVotersPickerData } = useQuery<{ data: Array<{ _id: string; username: string; role?: string; isVoter?: boolean }> }>({
    queryKey: ["/api/users/voters-picker"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.json();
    },
    enabled: createVoterOpen && createVoterMode === 'existing',
  });

  // Fetch election groups for the bulk generator
  const {
    data: electionGroups,
    isLoading: electionGroupsLoading,
    isError: electionGroupsError
  } = useQuery<VoterGroupResponse>({
    queryKey: ['/api/election-groups'],
    refetchOnWindowFocus: false
  });

  // Fetch voter groups for the bulk generator
  const { data: voterGroupsData } = useQuery<{ data: Array<{ _id: string; name?: string; description?: string; voters?: string[] }> }>({
    queryKey: ['/api/voter-groups/all-for-bulk'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/voter-groups?limit=200');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  // Mutation for adding existing voters to an election
  const addUsersToElectionMutation = useMutation({
    mutationFn: async ({ userIds, electionIds }: { userIds: string[]; electionIds: string[] }) => {
      const response = await apiRequest('POST', '/api/users/add-to-election', { userIds, electionIds });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.data?.updated || 0} voter(s) assigned to election`, variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['/api/users/voters'] });
    },
    onError: (error) => {
      toast({ title: 'Assignment failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    },
  });

  // Mutation for generating voters in bulk
  const generateVotersMutation = useMutation({
    mutationFn: async (options: BulkVoterGenerationOptions) => {
      const response = await apiRequest('POST', '/api/users/voters/generate', options);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voters generated",
        description: `Successfully generated ${data.count} voter accounts`,
        variant: "success",
      });
      setBulkVoterOpen(false);
      
      // Invalidate and refetch voters
      queryClient.invalidateQueries({ queryKey: ['/api/users/voters'] });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: `Failed to generate voters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for creating a single voter
  const createVoterMutation = useMutation({
    mutationFn: async (payload: { fullName: string; username: string; password: string; registrationNumber: string; electionIds: string[] }) => {
      const response = await apiRequest('POST', '/api/users/voters', payload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voter created",
        description: `Voter "${data?.data?.username}" created${data?.data?.password ? ` (password: ${data.data.password})` : ''}`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/voters'] });
      setCreateVoterOpen(false);
      setNewVoter({ fullName: "", username: "", password: "", registrationNumber: "", electionId: electionId || "" });
    },
    onError: (error) => {
      toast({
        title: "Create failed",
        description: `Failed to create voter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting a voter
  const deleteVoterMutation = useMutation({
    mutationFn: async (voterId: string) => {
      await apiRequest('DELETE', `/api/users/voters/${voterId}`);
    },
    onSuccess: () => {
      toast({
        title: "Voter deleted",
        description: "The voter has been successfully deleted",
        variant: "success"
      });
      
      // Invalidate and refetch voters
      queryClient.invalidateQueries({ queryKey: ['/api/users/voters'] });
      
      setDeleteVoterId(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: `Failed to delete voter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      setDeleteVoterId(null);
    }
  });

  // Use data from API responses
  const voters = votersResponse?.data || [];
  const pagination = votersResponse?.pagination || {
    page,
    pageSize,
    total: 0
  };
  const displayElections = allElections?.data || [];

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleGenerateVoters = (options: BulkVoterGenerationOptions) => {
    generateVotersMutation.mutate(options);
  };

  const handleAssignVoterGroup = async (voterIds: string[]) => {
    const eId = embedded ? electionId : selectedElectionId !== 'all' ? selectedElectionId : undefined;
    if (!eId || voterIds.length === 0) {
      toast({ title: 'No election context', description: 'Please filter by an election first.', variant: 'destructive' });
      return;
    }
    await addUsersToElectionMutation.mutateAsync({ userIds: voterIds, electionIds: [eId] });
  };

  const handleImportVoters = () => {
    toast({
      title: "Feature coming soon",
      description: "The ability to import voters will be available soon",
    });
  };

  const handleExportVoters = () => {
    toast({
      title: "Feature coming soon",
      description: "The ability to export voters will be available soon",
    });
  };

  const handleEditVoter = (id: string) => {
    toast({
      title: "Feature coming soon",
      description: "The ability to edit voters will be available soon",
    });
  };

  const handleDeleteVoter = (id: string) => {
    setDeleteVoterId(id);
  };

  const confirmDelete = () => {
    if (deleteVoterId) {
      deleteVoterMutation.mutate(deleteVoterId);
    }
  };

  const handleAddVoter = () => {
    setCreateVoterOpen(true);
  };

  const handleSubmitNewVoter = () => {
    if (!newVoter.username.trim()) {
      toast({ title: "Username required", description: "Please enter a username for the voter", variant: "destructive" });
      return;
    }
    createVoterMutation.mutate({
      fullName: newVoter.fullName.trim() || newVoter.username.trim(),
      username: newVoter.username.trim(),
      password: newVoter.password.trim(),
      registrationNumber: newVoter.registrationNumber.trim(),
      electionIds: embedded && electionId ? [electionId] : (newVoter.electionId ? [newVoter.electionId] : []),
    });
  };

  // Refetch voters when election filter changes
  useEffect(() => {
    refetchVoters();
  }, [selectedElectionId]);

  useEffect(() => {
    if (!embedded) document.title = "Voters | Vote+";
  }, [embedded]);

  // When embedded in an election workspace, scope bulk generation / create to
  // the current election only.
  const formElections = embedded
    ? displayElections.filter((election) => getRecordId(election) === selectedElectionId)
    : displayElections;
  const bulkGeneratorElections = formElections
    .map((election) => ({
      _id: getRecordId(election),
      title: election.title,
      organization: election.organization,
    }))
    .filter((election) => election._id);
  const bulkGeneratorGroups = (electionGroups?.data ?? [])
    .map((group) => ({
      _id: getRecordId(group),
      name: group.name,
    }))
    .filter((group) => group._id);

  const Wrapper = embedded ? Fragment : MainLayout;

  return (
    <Wrapper>
      {!embedded && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Voter Management</h1>
          <p className="text-sm text-gray-600">Create and manage voter accounts</p>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search voters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full sm:max-w-xs"
          />
          {!embedded && (
            <Select 
              value={selectedElectionId} 
              onValueChange={setSelectedElectionId}
            >
              <SelectTrigger className="h-10 w-full sm:w-64">
                <SelectValue placeholder="Filter by election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {displayElections.map((election) => (
                  <SelectItem 
                    key={getRecordId(election)} 
                    value={getRecordId(election) || 'unknown'}
                  >
                    {election.title} - {election.organization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button variant="outline" size="sm" className="h-10" onClick={handleImportVoters}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => setBulkVoterOpen(true)}>
            <UsersRound className="h-4 w-4 mr-2" />
            Bulk
          </Button>
          <Button size="sm" className="h-10" onClick={handleAddVoter}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Voter
          </Button>
          <BulkVoterSlipPrinter
            voters={voters}
            elections={displayElections}
            selectedElectionId={selectedElectionId}
            label="Print"
            className="h-10"
          />
        </div>
      </div>

      {(electionsError || electionGroupsError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch data. Showing cached data instead.
          </AlertDescription>
        </Alert>
      )}

      {votersError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch voters. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {votersLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="space-y-6">
          <VotersTable 
            voters={voters} 
            pagination={pagination}
            onPageChange={handlePageChange}
            onEdit={handleEditVoter}
            onDelete={handleDeleteVoter}
            onExport={handleExportVoters}
            elections={displayElections}
          />
          {embedded && <VoterGroups embedded electionId={electionId} />}
        </div>
      )}

      <Dialog open={bulkVoterOpen} onOpenChange={setBulkVoterOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Bulk Voters</DialogTitle>
            <DialogDescription>
              Generate multiple voter accounts without leaving this election.
            </DialogDescription>
          </DialogHeader>
          {(electionsLoading || electionGroupsLoading) ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <VoterBulkGenerator
              elections={bulkGeneratorElections}
              electionGroups={bulkGeneratorGroups}
              voterGroups={voterGroupsData?.data || []}
              onGenerate={handleGenerateVoters}
              onAssignVoterGroup={handleAssignVoterGroup}
              isGenerating={generateVotersMutation.isPending}
              fixedElectionId={embedded ? electionId : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVoterId} onOpenChange={(open) => !open && setDeleteVoterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the voter account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createVoterOpen} onOpenChange={(open) => {
          setCreateVoterOpen(open);
          if (!open) { setCreateVoterMode('choice'); setExistingVoterSearch(''); setSelectedExistingVoterIds([]); }
        }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Voter</DialogTitle>
            <DialogDescription>
              {createVoterMode === 'choice' && 'Choose how to add a voter.'}
              {createVoterMode === 'existing' && 'Search and select existing voters to assign to this election.'}
              {createVoterMode === 'new' && 'Create a new voter account.'}
            </DialogDescription>
          </DialogHeader>

          {/* Choice */}
          {createVoterMode === 'choice' && (
            <div className="grid grid-cols-2 gap-3 py-2">
              <button
                onClick={() => setCreateVoterMode('existing')}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <Search className="h-7 w-7 text-primary" />
                <span className="text-sm font-medium text-gray-800">Existing Voter</span>
                <span className="text-xs text-gray-400 text-center">Pick from your voter list</span>
              </button>
              <button
                onClick={() => setCreateVoterMode('new')}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <UserPlus className="h-7 w-7 text-primary" />
                <span className="text-sm font-medium text-gray-800">New Voter</span>
                <span className="text-xs text-gray-400 text-center">Create a new account</span>
              </button>
            </div>
          )}

          {/* Existing voter picker */}
          {createVoterMode === 'existing' && (
            <div className="space-y-3 py-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder="Search voters by username…"
                  value={existingVoterSearch}
                  onChange={(e) => setExistingVoterSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-56 overflow-y-auto border rounded-md divide-y bg-white">
                {(() => {
                  const filtered = (allVotersPickerData?.data || [])
                    .filter(u => (u.role === 'voter' || u.isVoter === true) && (!existingVoterSearch || u.username.toLowerCase().includes(existingVoterSearch.toLowerCase())))
                    .slice(0, 80);
                  if (filtered.length === 0) return (
                    <p className="text-sm text-gray-400 px-3 py-4 text-center">
                      {allVotersPickerData ? 'No voters found.' : 'Loading…'}
                    </p>
                  );
                  return filtered.map(u => (
                    <label key={u._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedExistingVoterIds.includes(u._id)}
                        onCheckedChange={(checked) =>
                          setSelectedExistingVoterIds(prev => checked ? [...prev, u._id] : prev.filter(id => id !== u._id))
                        }
                      />
                      <span className="text-sm font-mono">{u.username}</span>
                    </label>
                  ));
                })()}
              </div>
              {selectedExistingVoterIds.length > 0 && (
                <p className="text-xs text-primary font-medium">{selectedExistingVoterIds.length} selected</p>
              )}
              {!embedded && (
                <div className="space-y-1">
                  <Label>Assign to Election</Label>
                  <Select value={existingVoterElectionId} onValueChange={setExistingVoterElectionId}>
                    <SelectTrigger><SelectValue placeholder="Select election" /></SelectTrigger>
                    <SelectContent>
                      {displayElections.map(e => (
                        <SelectItem key={getRecordId(e)} value={getRecordId(e)}>{e.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* New voter form */}
          {createVoterMode === 'new' && (
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label htmlFor="voter-fullname">Full Name</Label>
                <Input id="voter-fullname" value={newVoter.fullName} onChange={(e) => setNewVoter({ ...newVoter, fullName: e.target.value })} placeholder="e.g. John Doe" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voter-username">Username *</Label>
                <Input id="voter-username" value={newVoter.username} onChange={(e) => setNewVoter({ ...newVoter, username: e.target.value })} placeholder="e.g. john.doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voter-password">Password</Label>
                <Input id="voter-password" value={newVoter.password} onChange={(e) => setNewVoter({ ...newVoter, password: e.target.value })} placeholder="Leave blank to auto-generate" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voter-regno">Registration Number</Label>
                <Input id="voter-regno" value={newVoter.registrationNumber} onChange={(e) => setNewVoter({ ...newVoter, registrationNumber: e.target.value })} placeholder="Optional (defaults to username)" />
              </div>
              {!embedded && (
                <div className="space-y-1.5">
                  <Label>Assign to Election</Label>
                  <Select value={newVoter.electionId} onValueChange={(value) => setNewVoter({ ...newVoter, electionId: value })}>
                    <SelectTrigger><SelectValue placeholder="Select an election" /></SelectTrigger>
                    <SelectContent>
                      {formElections.map((election) => (
                        <SelectItem key={getRecordId(election)} value={getRecordId(election)}>{election.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {createVoterMode !== 'choice' && (
              <Button variant="ghost" size="sm" onClick={() => { setCreateVoterMode('choice'); setExistingVoterSearch(''); setSelectedExistingVoterIds([]); }}>
                ← Back
              </Button>
            )}
            {createVoterMode === 'existing' && (
              <Button
                disabled={selectedExistingVoterIds.length === 0 || addUsersToElectionMutation.isPending || (!embedded && !existingVoterElectionId)}
                onClick={async () => {
                  const eIds = embedded && electionId ? [electionId] : (existingVoterElectionId ? [existingVoterElectionId] : []);
                  if (eIds.length === 0) return;
                  await addUsersToElectionMutation.mutateAsync({ userIds: selectedExistingVoterIds, electionIds: eIds });
                  setCreateVoterOpen(false);
                  setCreateVoterMode('choice');
                  setSelectedExistingVoterIds([]);
                  setExistingVoterSearch('');
                }}
              >
                {addUsersToElectionMutation.isPending ? 'Assigning…' : `Assign ${selectedExistingVoterIds.length} Voter(s)`}
              </Button>
            )}
            {createVoterMode === 'new' && (
              <>
                <Button variant="outline" onClick={() => setCreateVoterOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitNewVoter} disabled={createVoterMutation.isPending}>
                  {createVoterMutation.isPending ? 'Creating…' : 'Create Voter'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}