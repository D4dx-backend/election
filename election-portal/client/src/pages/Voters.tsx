import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { VoterBulkGenerator } from "@/components/voters/VoterBulkGenerator";
import { VotersTable } from "@/components/voters/VotersTable";
import { BulkVoterSlipPrinter } from "@/components/voters/BulkVoterSlipPrinter";
import VoterGroups from "@/pages/VoterGroups";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusIcon, Upload, AlertCircle, UsersRound, Search, UserPlus, Download, FileSpreadsheet } from "lucide-react";
import { assignVotersToElection } from "@/lib/assignVoters";
import {
  downloadVoterImportTemplate,
  exportVotersToExcel,
  fetchAllVoters,
  importVotersFromRows,
  parseVoterImportFile,
  type ParsedVoterImportRow,
} from "@/lib/voterImportExport";
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

type EntityRecord = { _id?: string; id?: string };
type VoterRecord = User & EntityRecord & { electionAccess?: string[] };
type ElectionRecord = Election & EntityRecord;
type VoterGroupResponse = { data?: ElectionGroup[] };
type VotersResponse = { data?: VoterRecord[]; pagination?: Pagination };
type ElectionsResponse = { data?: ElectionRecord[] };

function getRecordId(record: EntityRecord): string {
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
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ParsedVoterImportRow[]>([]);
  const [importElectionId, setImportElectionId] = useState(electionId || "");
  const [isExporting, setIsExporting] = useState(false);
  const [editVoterOpen, setEditVoterOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    username: "",
    registrationNumber: "",
    status: "active",
    electionIds: [] as string[],
  });
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
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
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
    queryKey: ['/api/users/voters', selectedElectionId, page, pageSize, searchQuery],
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

  // Mutation for assigning existing voters to an election
  const assignVotersMutation = useMutation({
    mutationFn: async ({ voterIds, electionId }: { voterIds: string[]; electionId: string }) => {
      return assignVotersToElection(voterIds, electionId);
    },
    onSuccess: (data) => {
      toast({
        title: `${data.modified} voter(s) assigned to election`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateVoterMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        fullName: string;
        username: string;
        registrationNumber: string;
        status: string;
        electionAccess: string[];
      };
    }) => {
      const response = await apiRequest("PUT", `/api/users/${id}`, payload);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Failed to update voter");
      return body;
    },
    onSuccess: () => {
      toast({ title: "Voter updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      setEditVoterOpen(false);
      setEditingVoter(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const importVotersMutation = useMutation({
    mutationFn: async ({
      rows,
      defaultElectionIds,
    }: {
      rows: ParsedVoterImportRow[];
      defaultElectionIds: string[];
    }) => importVotersFromRows(rows, defaultElectionIds),
    onSuccess: (result) => {
      toast({
        title: "Import complete",
        description: `${result.created} created, ${result.skipped} skipped.`,
        variant: result.errors.length ? "destructive" : "success",
      });
      if (result.errors.length) {
        console.warn("Voter import errors:", result.errors);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      setImportOpen(false);
      setImportFile(null);
      setImportPreview([]);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
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
    await assignVotersMutation.mutateAsync({ voterIds, electionId: eId });
  };

  const handleImportVoters = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportElectionId(embedded && electionId ? electionId : selectedElectionId !== "all" ? selectedElectionId : "");
    setImportOpen(true);
  };

  const handleImportFileChange = async (file: File | null) => {
    setImportFile(file);
    setImportPreview([]);
    if (!file) return;
    try {
      const rows = await parseVoterImportFile(file, displayElections);
      setImportPreview(rows);
    } catch (error) {
      toast({
        title: "Could not read file",
        description: error instanceof Error ? error.message : "Invalid file",
        variant: "destructive",
      });
      setImportFile(null);
    }
  };

  const handleSubmitImport = () => {
    if (!importPreview.length) {
      toast({ title: "No rows to import", variant: "destructive" });
      return;
    }
    const defaultElectionIds =
      importElectionId && importElectionId !== "all" ? [importElectionId] : [];
    importVotersMutation.mutate({ rows: importPreview, defaultElectionIds });
  };

  const handleExportVoters = async () => {
    setIsExporting(true);
    try {
      const allVoters = await fetchAllVoters({
        electionId: selectedElectionId,
        search: searchQuery,
      });
      if (!allVoters.length) {
        toast({ title: "No voters to export", variant: "destructive" });
        return;
      }
      const label =
        selectedElectionId !== "all"
          ? displayElections.find((e) => getRecordId(e) === selectedElectionId)?.title || "Filtered_Voters"
          : "All_Voters";
      exportVotersToExcel(allVoters, displayElections, { electionFilterLabel: label });
      toast({
        title: "Export complete",
        description: `${allVoters.length} voter(s) exported to Excel.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEditVoter = (id: string) => {
    const voter = voters.find((v) => getRecordId(v) === id);
    if (!voter) {
      toast({ title: "Voter not found", variant: "destructive" });
      return;
    }
    setEditingVoter(voter);
    setEditForm({
      fullName: voter.fullName || "",
      username: voter.username || "",
      registrationNumber: voter.registrationNumber || "",
      status: voter.status || "active",
      electionIds: (voter.electionAccess || []).map(String),
    });
    setEditVoterOpen(true);
  };

  const handleSubmitEditVoter = () => {
    if (!editingVoter) return;
    if (!editForm.username.trim()) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }
    updateVoterMutation.mutate({
      id: getRecordId(editingVoter),
      payload: {
        fullName: editForm.fullName.trim() || editForm.username.trim(),
        username: editForm.username.trim(),
        registrationNumber: editForm.registrationNumber.trim() || editForm.username.trim(),
        status: editForm.status,
        electionAccess: editForm.electionIds,
      },
    });
  };

  const toggleEditElection = (electionIdValue: string, checked: boolean) => {
    setEditForm((prev) => ({
      ...prev,
      electionIds: checked
        ? [...new Set([...prev.electionIds, electionIdValue])]
        : prev.electionIds.filter((id) => id !== electionIdValue),
    }));
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

  // Refetch voters when election filter or search changes
  useEffect(() => {
    setPage(1);
    refetchVoters();
  }, [selectedElectionId, searchQuery]);

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
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={handleExportVoters}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting…" : "Export"}
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto top-[8vh] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
          <DialogHeader className="pr-8">
            <DialogTitle>Create Bulk Voters</DialogTitle>
            <DialogDescription>
              Generate multiple voter accounts and assign them to an election, group, or voter group.
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
              onCancel={() => setBulkVoterOpen(false)}
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
                disabled={selectedExistingVoterIds.length === 0 || assignVotersMutation.isPending || (!embedded && !existingVoterElectionId)}
                onClick={async () => {
                  const eId = embedded && electionId ? electionId : existingVoterElectionId;
                  if (!eId) return;
                  await assignVotersMutation.mutateAsync({
                    voterIds: selectedExistingVoterIds,
                    electionId: eId,
                  });
                  setCreateVoterOpen(false);
                  setCreateVoterMode('choice');
                  setSelectedExistingVoterIds([]);
                  setExistingVoterSearch('');
                }}
              >
                {assignVotersMutation.isPending ? 'Assigning…' : `Assign ${selectedExistingVoterIds.length} Voter(s)`}
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

      <Dialog open={editVoterOpen} onOpenChange={(open) => {
        setEditVoterOpen(open);
        if (!open) setEditingVoter(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Voter</DialogTitle>
            <DialogDescription>Update voter account details and election access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-username">Username *</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-regno">Registration Number</Label>
              <Input
                id="edit-regno"
                value={editForm.registrationNumber}
                onChange={(e) => setEditForm({ ...editForm, registrationNumber: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!embedded && displayElections.length > 0 && (
              <div className="space-y-2">
                <Label>Election Access</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                  {displayElections.map((election) => {
                    const eid = getRecordId(election);
                    return (
                      <label key={eid} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <Checkbox
                          checked={editForm.electionIds.includes(eid)}
                          onCheckedChange={(checked) => toggleEditElection(eid, checked === true)}
                        />
                        <span className="text-sm">{election.title} — {election.organization}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditVoterOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitEditVoter} disabled={updateVoterMutation.isPending}>
              {updateVoterMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setImportFile(null);
          setImportPreview([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Voters</DialogTitle>
            <DialogDescription>
              Upload Excel (.xlsx) or CSV with columns: username, full_name, password (optional), registration_number, elections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <label className="flex flex-col items-center justify-center w-full min-h-28 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center py-5">
                <FileSpreadsheet className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {importFile ? importFile.name : "Click to upload spreadsheet"}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.csv,.xls"
                onChange={(e) => handleImportFileChange(e.target.files?.[0] || null)}
              />
            </label>
            <Button type="button" variant="link" className="px-0 h-auto" onClick={downloadVoterImportTemplate}>
              Download template
            </Button>
            {importPreview.length > 0 && (
              <p className="text-sm text-primary font-medium">{importPreview.length} row(s) ready to import</p>
            )}
            {!embedded && (
              <div className="space-y-1.5">
                <Label>Default election (optional)</Label>
                <Select value={importElectionId || "none"} onValueChange={(v) => setImportElectionId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Assign all imported voters to…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — use elections column only</SelectItem>
                    {displayElections.map((election) => (
                      <SelectItem key={getRecordId(election)} value={getRecordId(election)}>
                        {election.title} — {election.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitImport}
              disabled={!importPreview.length || importVotersMutation.isPending}
            >
              {importVotersMutation.isPending ? "Importing…" : `Import ${importPreview.length || 0} Voter(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}