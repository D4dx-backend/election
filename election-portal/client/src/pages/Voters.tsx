import { useState, useEffect, useMemo, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { VoterBulkGenerator } from "@/components/voters/VoterBulkGenerator";
import { VotersTable } from "@/components/voters/VotersTable";
import { BulkVoterSlipPrinter } from "@/components/voters/BulkVoterSlipPrinter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
<<<<<<< HEAD
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, Upload, AlertCircle, UsersRound, Search, UserPlus, UserCheck } from "lucide-react";
=======
import { PlusIcon, Upload, AlertCircle, UsersRound, Search, UserPlus } from "lucide-react";
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
import { BulkVoterGenerationOptions, Pagination, User, Election, ElectionGroup } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { extractApiList, normalizeEntityId } from "@/lib/apiHelpers";
import { assignVotersToElection as assignVotersApi } from "@/lib/assignVoters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
type VoterRecord = User &
  MongoIdRecord & {
    electionAccess?: Array<string | number | { toString: () => string }>;
    plainPassword?: string;
    isAssignedToElection?: boolean;
  };
type ElectionRecord = Election & MongoIdRecord;
type VoterGroupResponse = { data?: ElectionGroup[] };
type VotersResponse = { data?: VoterRecord[]; pagination?: Pagination };
type ElectionsResponse = { data?: ElectionRecord[] };

function normalizeRecordId(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "object") {
    const rec = id as { _id?: unknown; id?: unknown; toString?: () => string };
    if (rec._id != null) return normalizeRecordId(rec._id);
    if (rec.id != null) return normalizeRecordId(rec.id);
    if (typeof rec.toString === "function") {
      const s = rec.toString();
      if (s && s !== "[object Object]") return s;
    }
    return "";
  }
  return String(id).trim();
}

function getRecordId(record: MongoIdRecord): string {
  return normalizeRecordId(record._id ?? record.id);
}

function voterHasElectionAccess(voter: VoterRecord, electionId: string): boolean {
  if (!electionId || !voter.electionAccess?.length) return false;
  const target = normalizeRecordId(electionId);
  return voter.electionAccess.some((entry) => normalizeRecordId(entry) === target);
}

function isVoterAssignedToElection(voter: VoterRecord, electionId: string): boolean {
  return Boolean(voter.isAssignedToElection) || voterHasElectionAccess(voter, electionId);
}

export default function Voters({
  embedded = false,
  electionId,
}: { embedded?: boolean; electionId?: string } = {}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteVoterId, setDeleteVoterId] = useState<string | null>(null);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedElectionId, setSelectedElectionId] = useState<string>(electionId || "all");
  const [createVoterOpen, setCreateVoterOpen] = useState(false);
<<<<<<< HEAD
  const [addVoterTab, setAddVoterTab] = useState<"create" | "existing">("create");
=======
  const [createVoterMode, setCreateVoterMode] = useState<'choice' | 'existing' | 'new'>('choice');
  const [existingVoterSearch, setExistingVoterSearch] = useState("");
  const [selectedExistingVoterIds, setSelectedExistingVoterIds] = useState<string[]>([]);
  const [existingVoterElectionId, setExistingVoterElectionId] = useState(electionId || "");
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
  const [bulkVoterOpen, setBulkVoterOpen] = useState(false);

  // ── Create-new form state ────────────────────────────────────────────────
  const [newVoter, setNewVoter] = useState({
    fullName: "",
    username: "",
    password: "",
    registrationNumber: "",
    electionId: electionId || "",
  });

  // ── Add-existing state ───────────────────────────────────────────────────
  const [existingSearch, setExistingSearch] = useState("");
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);
  const [assignProgress, setAssignProgress] = useState<{ done: number; total: number } | null>(null);

  // The election we're currently scoping to (embedded = fixed, standalone = picker)
  const scopedElectionId = embedded
    ? electionId
    : selectedElectionId !== "all"
    ? selectedElectionId
    : undefined;

  // ── Data queries ─────────────────────────────────────────────────────────
  const {
    data: votersResponse,
    isLoading: votersLoading,
    isError: votersError,
    refetch: refetchVoters,
  } = useQuery<VotersResponse>({
    queryKey: ["/api/users/voters", selectedElectionId, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (selectedElectionId && selectedElectionId !== "all")
        params.append("electionId", selectedElectionId);
      const response = await apiRequest("GET", `/api/users/voters?${params}`);
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const {
    data: allElections,
    isLoading: electionsLoading,
    isError: electionsError,
  } = useQuery<ElectionsResponse>({
    queryKey: ["/api/elections"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/elections");
      return response.json();
    },
<<<<<<< HEAD
    refetchOnWindowFocus: false,
  });

  const {
    data: electionGroupsResponse,
    isLoading: electionGroupsLoading,
    isError: electionGroupsError,
  } = useQuery({
    queryKey: ["/api/election-groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/election-groups");
      return response.json();
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
    },
    refetchOnWindowFocus: false,
  });

<<<<<<< HEAD
  const {
    data: availableVotersResponse,
    isLoading: availableLoading,
    refetch: refetchAvailableVoters,
  } = useQuery<VotersResponse>({
    queryKey: ["/api/users/voters/available", scopedElectionId],
    queryFn: async () => {
      const params = new URLSearchParams({
        pageSize: "500",
        page: "1",
      });
      if (scopedElectionId) params.append("forElectionId", scopedElectionId);
      const response = await apiRequest("GET", `/api/users/voters?${params}`);
      return response.json();
    },
    enabled: createVoterOpen && addVoterTab === "existing" && !!scopedElectionId,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // All voters already assigned to this election (for picker badges)
  const {
    data: electionVotersResponse,
    isLoading: electionVotersLoading,
    isFetching: electionVotersFetching,
  } = useQuery<VotersResponse>({
    queryKey: ["/api/users/voters/in-election", scopedElectionId],
    queryFn: async () => {
      const params = new URLSearchParams({
        electionId: scopedElectionId!,
        pageSize: "500",
        page: "1",
      });
      const response = await apiRequest("GET", `/api/users/voters?${params}`);
      return response.json();
    },
    enabled: createVoterOpen && addVoterTab === "existing" && !!scopedElectionId,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // ── Derived data ─────────────────────────────────────────────────────────
  const voters = votersResponse?.data || [];
  const pagination = votersResponse?.pagination || { page, pageSize, total: 0 };
  const displayElections = allElections?.data || [];

  const assignedVoterIds = useMemo(() => {
    const ids = new Set<string>();
    if (!scopedElectionId) return ids;

    (electionVotersResponse?.data ?? []).forEach((v) => {
      const id = getRecordId(v);
      if (id) ids.add(id);
    });

    (availableVotersResponse?.data ?? []).forEach((v) => {
      if (isVoterAssignedToElection(v, scopedElectionId)) {
        ids.add(getRecordId(v));
      }
    });

    if (selectedElectionId === scopedElectionId) {
      voters.forEach((v) => {
        if (isVoterAssignedToElection(v, scopedElectionId)) {
          ids.add(getRecordId(v));
        }
      });
    }

    return ids;
  }, [
    electionVotersResponse,
    availableVotersResponse,
    voters,
    scopedElectionId,
    selectedElectionId,
  ]);

  const isAssignedPickerVoter = (voter: VoterRecord) =>
    assignedVoterIds.has(getRecordId(voter));

  const pickerVoters = useMemo(() => {
    const all = availableVotersResponse?.data || [];
    const q = existingSearch.trim().toLowerCase();
    const filtered = !q
      ? all
      : all.filter(
          (v) =>
            v.username?.toLowerCase().includes(q) ||
            (v.fullName as string | undefined)?.toLowerCase().includes(q)
        );

    return [...filtered].sort((a, b) => {
      const aAssigned = assignedVoterIds.has(getRecordId(a));
      const bAssigned = assignedVoterIds.has(getRecordId(b));
      if (aAssigned === bAssigned) return 0;
      return aAssigned ? 1 : -1;
    });
  }, [availableVotersResponse, existingSearch, assignedVoterIds]);

  const selectablePickerVoters = useMemo(
    () => pickerVoters.filter((v) => !assignedVoterIds.has(getRecordId(v))),
    [pickerVoters, assignedVoterIds]
  );

  const pickerLoading =
    availableLoading || electionVotersLoading || electionVotersFetching;

  // ── Mutations ─────────────────────────────────────────────────────────────
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
  const generateVotersMutation = useMutation({
    mutationFn: async (options: BulkVoterGenerationOptions) => {
      const response = await apiRequest("POST", "/api/users/voters/generate", options);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voters generated",
        description: `Successfully generated ${data.count} voter accounts`,
        variant: "success",
      });
      setBulkVoterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const createVoterMutation = useMutation({
    mutationFn: async (payload: {
      fullName: string;
      username: string;
      password: string;
      registrationNumber: string;
      electionIds: string[];
    }) => {
      const response = await apiRequest("POST", "/api/users/voters", payload);
      return response.json();
    },
    onSuccess: (data) => {
      const pwd = data?.data?.password;
      toast({
        title: "Voter created",
        description: pwd
          ? `Voter "${data.data.username}" created — password: ${pwd}`
          : `Voter "${data?.data?.username}" created`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters/in-election"] });
      setCreateVoterOpen(false);
      setNewVoter({ fullName: "", username: "", password: "", registrationNumber: "", electionId: electionId || "" });
    },
    onError: (error) => {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const assignVotersMutation = useMutation({
    mutationFn: async ({ voterIds, targetElectionId }: { voterIds: string[]; targetElectionId: string }) => {
      setAssignProgress({ done: 0, total: voterIds.length });
      try {
        return await assignVotersApi(
          voterIds,
          targetElectionId,
          availableVotersResponse?.data ?? [],
          (done, total) => setAssignProgress({ done, total })
        );
      } finally {
        setAssignProgress(null);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Voters assigned",
        description: `${data.modified ?? selectedVoterIds.length} voter(s) added to the election.`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters/in-election"] });
      setCreateVoterOpen(false);
      setSelectedVoterIds([]);
      setExistingSearch("");
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteVoterMutation = useMutation({
    mutationFn: async (voterId: string) => {
      await apiRequest("DELETE", `/api/users/voters/${voterId}`);
    },
    onSuccess: () => {
      toast({ title: "Voter deleted", description: "The voter has been successfully deleted", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      setDeleteVoterId(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setDeleteVoterId(null);
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmitNewVoter = () => {
    if (!newVoter.username.trim()) {
      toast({ title: "Username required", description: "Please enter a username for the voter", variant: "destructive" });
      return;
    }
    const targetElectionId = embedded && electionId ? electionId : newVoter.electionId;
    createVoterMutation.mutate({
      fullName: newVoter.fullName.trim() || newVoter.username.trim(),
      username: newVoter.username.trim(),
      password: newVoter.password.trim(),
      registrationNumber: newVoter.registrationNumber.trim(),
      electionIds: targetElectionId ? [targetElectionId] : [],
    });
  };

  const handleAssignExisting = () => {
    if (selectedVoterIds.length === 0) {
      toast({ title: "No voters selected", description: "Select at least one voter to assign.", variant: "destructive" });
      return;
    }
    if (!scopedElectionId) {
      toast({ title: "No election selected", description: "Please select an election to assign voters to.", variant: "destructive" });
      return;
    }
    assignVotersMutation.mutate({ voterIds: selectedVoterIds, targetElectionId: scopedElectionId });
  };

  const toggleVoterSelection = (id: string) => {
    const voter = pickerVoters.find((v) => getRecordId(v) === id);
    if (voter && scopedElectionId && isAssignedPickerVoter(voter)) return;
    setSelectedVoterIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectableIds = selectablePickerVoters.map((v) => getRecordId(v));
    if (selectedVoterIds.length === selectableIds.length && selectableIds.length > 0) {
      setSelectedVoterIds([]);
    } else {
      setSelectedVoterIds(selectableIds);
    }
  };

  const handleGenerateVoters = (options: BulkVoterGenerationOptions) => {
    generateVotersMutation.mutate(options);
  };

<<<<<<< HEAD
  const handleOpenDialog = () => {
    setAddVoterTab("create");
    setSelectedVoterIds([]);
    setExistingSearch("");
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
    setCreateVoterOpen(true);
  };

  useEffect(() => {
    if (createVoterOpen && addVoterTab === "existing" && scopedElectionId) {
      refetchAvailableVoters();
      queryClient.invalidateQueries({
        queryKey: ["/api/users/voters/in-election", scopedElectionId],
      });
    }
  }, [createVoterOpen, addVoterTab, scopedElectionId, refetchAvailableVoters]);

  useEffect(() => { refetchVoters(); }, [selectedElectionId]);
  useEffect(() => { if (!embedded) document.title = "Voters | Vote+"; }, [embedded]);

  // ── Derived form data ─────────────────────────────────────────────────────
  const formElections = embedded
    ? displayElections.filter((e) => getRecordId(e) === selectedElectionId)
    : displayElections;
  const bulkGeneratorElections = formElections
    .map((e) => ({ _id: getRecordId(e), title: e.title, organization: e.organization }))
    .filter((e) => e._id);
  const bulkGeneratorGroups = extractApiList<ElectionGroup>(electionGroupsResponse)
    .map((g) => ({ _id: normalizeEntityId(g._id ?? g.id), name: g.name }))
    .filter((g) => g._id);

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
            <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
              <SelectTrigger className="h-10 w-full sm:w-64">
                <SelectValue placeholder="Filter by election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {displayElections.map((election) => (
                  <SelectItem key={getRecordId(election)} value={getRecordId(election) || "unknown"}>
                    {election.title} - {election.organization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button variant="outline" size="sm" className="h-10"
            onClick={() => toast({ title: "Coming soon", description: "Import will be available soon." })}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => setBulkVoterOpen(true)}>
            <UsersRound className="h-4 w-4 mr-2" />
            Bulk
          </Button>
          <Button size="sm" className="h-10" onClick={handleOpenDialog}>
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
          <AlertDescription>Failed to fetch elections data.</AlertDescription>
        </Alert>
      )}

      {votersError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to fetch voters. Please try again.</AlertDescription>
        </Alert>
      )}

      {votersLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <VotersTable
          voters={voters}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={() => toast({ title: "Coming soon" })}
          onDelete={setDeleteVoterId}
          onExport={() => toast({ title: "Coming soon" })}
          elections={displayElections}
        />
      )}

      {/* ── Bulk generator dialog ─────────────────────────────────────────── */}
      <Dialog open={bulkVoterOpen} onOpenChange={setBulkVoterOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Bulk Voters</DialogTitle>
            <DialogDescription>Generate multiple voter accounts at once.</DialogDescription>
          </DialogHeader>
          {electionsLoading || electionGroupsLoading ? (
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

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteVoterId} onOpenChange={(o) => !o && setDeleteVoterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voter?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The voter account will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVoterId && deleteVoterMutation.mutate(deleteVoterId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

<<<<<<< HEAD
      {/* ── Add voter dialog (Create New | Add Existing) ──────────────────── */}
      <Dialog open={createVoterOpen} onOpenChange={(o) => { setCreateVoterOpen(o); if (!o) { setSelectedVoterIds([]); setExistingSearch(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Voter</DialogTitle>
            <DialogDescription>
              Create a new voter account or assign existing voters to{" "}
              {scopedElectionId ? "the selected election" : "an election"}.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={addVoterTab} onValueChange={(v) => { setAddVoterTab(v as "create" | "existing"); setSelectedVoterIds([]); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-1.5">
                <UserPlus className="h-4 w-4" /> Create New
              </TabsTrigger>
              <TabsTrigger value="existing" className="gap-1.5">
                <UserCheck className="h-4 w-4" /> Add Existing
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Create New ─────────────────────────────────────────── */}
            <TabsContent value="create" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voter-fullname">Full Name</Label>
                <Input
                  id="voter-fullname"
                  value={newVoter.fullName}
                  onChange={(e) => setNewVoter({ ...newVoter, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voter-username">Username *</Label>
                <Input
                  id="voter-username"
                  value={newVoter.username}
                  onChange={(e) => setNewVoter({ ...newVoter, username: e.target.value })}
                  placeholder="e.g. john.doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voter-password">Password</Label>
                <Input
                  id="voter-password"
                  value={newVoter.password}
                  onChange={(e) => setNewVoter({ ...newVoter, password: e.target.value })}
                  placeholder="Leave blank to auto-generate (8 random chars)"
                />
                <p className="text-xs text-gray-500">
                  Auto-generated passwords are 8 lowercase alphanumeric characters.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="voter-regno">Registration Number</Label>
                <Input
                  id="voter-regno"
                  value={newVoter.registrationNumber}
                  onChange={(e) => setNewVoter({ ...newVoter, registrationNumber: e.target.value })}
                  placeholder="Optional — defaults to username"
                />
              </div>
              {!embedded && (
                <div className="space-y-2">
                  <Label>Assign to Election</Label>
                  <Select
                    value={newVoter.electionId}
                    onValueChange={(v) => setNewVoter({ ...newVoter, electionId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an election" />
                    </SelectTrigger>
                    <SelectContent>
                      {formElections.map((e) => (
                        <SelectItem key={getRecordId(e)} value={getRecordId(e)}>
                          {e.title}
                        </SelectItem>
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
<<<<<<< HEAD
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setCreateVoterOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitNewVoter} disabled={createVoterMutation.isPending}>
                  {createVoterMutation.isPending ? "Creating…" : "Create Voter"}
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── Tab: Add Existing ───────────────────────────────────────── */}
            <TabsContent value="existing" className="mt-4 space-y-3">
              {!scopedElectionId ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Please select a specific election from the filter above before using this tab.
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by username or name…"
                      value={existingSearch}
                      onChange={(e) => setExistingSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {pickerLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : pickerVoters.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                      {existingSearch ? "No matching voters found." : "No voters available."}
                    </div>
                  ) : (
                    <>
                      {assignedVoterIds.size > 0 && (
                        <p className="text-xs text-gray-500">
                          {assignedVoterIds.size} already assigned to this election
                          {selectablePickerVoters.length > 0
                            ? ` · ${selectablePickerVoters.length} available to add`
                            : ""}
                        </p>
                      )}
                      {/* Select-all header */}
                      <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        <Checkbox
                          id="select-all"
                          checked={
                            selectablePickerVoters.length > 0 &&
                            selectedVoterIds.length === selectablePickerVoters.length
                          }
                          disabled={selectablePickerVoters.length === 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <Label htmlFor="select-all" className="cursor-pointer font-normal">
                          {selectedVoterIds.length > 0
                            ? `${selectedVoterIds.length} of ${selectablePickerVoters.length} selected`
                            : selectablePickerVoters.length > 0
                            ? `Select all unassigned (${selectablePickerVoters.length})`
                            : "All voters shown are already assigned"}
                        </Label>
                      </div>

                      <ScrollArea className="h-56 rounded-md border">
                        <div className="divide-y">
                          {pickerVoters.map((voter) => {
                            const id = getRecordId(voter);
                            const isAssigned = isAssignedPickerVoter(voter);
                            const checked = !isAssigned && selectedVoterIds.includes(id);
                            return (
                              <div
                                key={id}
                                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                                  isAssigned
                                    ? "bg-gray-50 opacity-70"
                                    : checked
                                    ? "bg-primary/5"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <Checkbox
                                  id={`voter-${id}`}
                                  checked={checked}
                                  disabled={isAssigned}
                                  onCheckedChange={() => toggleVoterSelection(id)}
                                />
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                                  {(voter.username || "?").slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {voter.username}
                                  </p>
                                  {voter.fullName && voter.fullName !== voter.username && (
                                    <p className="truncate text-xs text-gray-500">{voter.fullName as string}</p>
                                  )}
                                </div>
                                {isAssigned && (
                                  <Badge variant="secondary" className="shrink-0 text-xs">
                                    Already assigned
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  )}

                  <DialogFooter className="pt-1">
                    <Button variant="outline" onClick={() => setCreateVoterOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignExisting}
                      disabled={selectedVoterIds.length === 0 || assignVotersMutation.isPending}
                    >
                      {assignVotersMutation.isPending
                        ? assignProgress
                          ? `Assigning ${assignProgress.done}/${assignProgress.total}…`
                          : "Assigning…"
                        : `Assign ${selectedVoterIds.length > 0 ? `(${selectedVoterIds.length}) ` : ""}Voters`}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </TabsContent>
          </Tabs>
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}

