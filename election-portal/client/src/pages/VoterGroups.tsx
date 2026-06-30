import { useEffect, useState, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
<<<<<<< HEAD
import { Checkbox } from "@/components/ui/checkbox";
import { BulkVoterSlipPrinter } from "@/components/voters/BulkVoterSlipPrinter";
import { ManageVoterGroupDialog } from "@/components/voters/ManageVoterGroupDialog";
import { AlertCircle, Users, PlusCircle, Trash2, Link2, Printer, Settings2 } from "lucide-react";
=======
import { AlertCircle, Users, PlusCircle, Trash2, ArrowLeft, Settings2, Loader2, Search, UserPlus } from "lucide-react";
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Pagination } from "@/lib/types";
import { VoterSlipPrinter } from "@/components/voters/VoterSlipPrinter";

interface LinkedElection {
  _id?: string;
  id?: string;
  title?: string;
  organization?: string;
}

interface VoterGroup {
  _id: string;
  name?: string;
  description?: string;
  prefix?: string;
  voters?: string[];
<<<<<<< HEAD
  elections?: LinkedElection[];
=======
  electionIds?: string[];
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
  createdAt?: string;
}

interface Election {
  _id: string;
  title: string;
  organization: string;
}

interface GroupVoter {
  _id: string;
  username: string;
  status?: string;
  plainPassword?: string;
  sequenceNumber?: number;
  electionAccess?: string[];
}

export default function VoterGroups({ embedded = false }: { embedded?: boolean; electionId?: string } = {}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [linkGroup, setLinkGroup] = useState<VoterGroup | null>(null);
  const [linkSelected, setLinkSelected] = useState<string[]>([]);
  const [printGroupId, setPrintGroupId] = useState<string | null>(null);
  const [manageGroup, setManageGroup] = useState<VoterGroup | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected group for management view
  const [selectedGroup, setSelectedGroup] = useState<VoterGroup | null>(null);

  // Group management state
  const [selectedElectionIds, setSelectedElectionIds] = useState<string[]>([]);
  const [singleVoterUsername, setSingleVoterUsername] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkStart, setBulkStart] = useState(1001);
  const [bulkCount, setBulkCount] = useState(10);
  const [singleVoterOpen, setSingleVoterOpen] = useState(false);
  const [addVoterMode, setAddVoterMode] = useState<'choice' | 'existing' | 'new'>('choice');
  const [addVoterSearch, setAddVoterSearch] = useState("");
  const [addVoterSelectedIds, setAddVoterSelectedIds] = useState<string[]>([]);
  const [bulkVoterOpen, setBulkVoterOpen] = useState(false);

  // Create dialog extended state
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPrefix, setGroupPrefix] = useState("");
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [existingVoterSearch, setExistingVoterSearch] = useState("");
  const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!embedded) document.title = "Voter Groups | Vote+";
  }, [embedded]);

  const userDataString = localStorage.getItem("user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const franchiseId = userData?.franchiseId;

  // --- Queries ---
  const { data, isLoading, error } = useQuery<{ data: VoterGroup[]; pagination?: Pagination }>({
    queryKey: ["/api/voter-groups", page],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/voter-groups?page=${page}&limit=${pageSize}`);
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const { data: electionsData } = useQuery<{ data: Election[] }>({
    queryKey: ["/api/elections/all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/elections?limit=200");
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  const { data: groupVotersData, isLoading: votersLoading, refetch: refetchVoters } = useQuery<{ data: GroupVoter[] }>({
    queryKey: ["/api/voter-groups/voters", selectedGroup?._id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/voter-groups/${selectedGroup!._id}/voters`);
      return res.json();
    },
    enabled: !!selectedGroup,
  });

  // Fetch existing voters for the "Add Existing Voters" step in create dialog
  const { data: allVotersData } = useQuery<{ data: Array<{ _id: string; username: string; role?: string; isVoter?: boolean }> }>({
    queryKey: ["/api/users/voters-for-picker"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return res.json();
    },
    enabled: (isOpen && createStep === 2) || (singleVoterOpen && addVoterMode === 'existing'),
  });

  const elections = electionsData?.data || [];
  const groupVoters = groupVotersData?.data || [];
  const groups = Array.isArray(data?.data) ? data!.data : [];
  const pagination = data?.pagination;

<<<<<<< HEAD
  // Elections available to link groups to.
  const { data: electionsResponse } = useQuery<{ data?: LinkedElection[] } | LinkedElection[]>({
    queryKey: ["/api/elections"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/elections");
      return res.json();
    },
  });

  const elections: LinkedElection[] = Array.isArray(electionsResponse)
    ? electionsResponse
    : Array.isArray(electionsResponse?.data)
    ? electionsResponse.data
    : [];

  const openLinkDialog = (group: VoterGroup) => {
    setLinkGroup(group);
    setLinkSelected(
      (group.elections || []).map((e) => (e._id || e.id || "").toString()).filter(Boolean)
    );
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!linkGroup) return;
      const res = await apiRequest("PUT", `/api/voter-groups/${linkGroup._id}`, {
        elections: linkSelected,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Election links updated", variant: "success" });
      setLinkGroup(null);
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not update links", description: err.message, variant: "destructive" });
    },
  });

  const toggleLink = (id: string) => {
    setLinkSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Fetch the selected group's full voter docs (populated) for slip printing.
  const { data: printDetail } = useQuery<{ data?: { voters?: any[] } }>({
    queryKey: ["/api/voter-groups", printGroupId, "detail"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/voter-groups/${printGroupId}`);
      return res.json();
    },
    enabled: !!printGroupId,
  });
  const printGroup = groups.find((g) => g._id === printGroupId);
  const printVoters = printDetail?.data?.voters || [];

=======
  // When entering a group, seed election selection from group data
  const openGroup = (g: VoterGroup) => {
    setSelectedGroup(g);
    setSelectedElectionIds(g.electionIds || []);
    setBulkPrefix(g.prefix || "VOTE");
  };

  const closeGroup = () => {
    setSelectedGroup(null);
    setSelectedElectionIds([]);
    setSingleVoterUsername("");
  };

  // --- Mutations ---
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/voter-groups", {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        prefix: groupPrefix.trim() || undefined,
        franchiseId: franchiseId || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Voter group created", variant: "success" });
      const newId = data.voterGroup?._id?.toString() || data.data?._id?.toString();
      if (newId) {
        setCreatedGroupId(newId);
        setCreateStep(2);
      } else {
        setIsOpen(false);
        setGroupName(""); setGroupDescription(""); setGroupPrefix("");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not create group", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/voter-groups/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Voter group deleted", variant: "success" });
      setDeleteGroupId(null);
      if (selectedGroup?._id === deleteGroupId) closeGroup();
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not delete group", description: err.message, variant: "destructive" });
    },
  });

  const assignElectionsMutation = useMutation({
    mutationFn: async (electionIds: string[]) => {
      const res = await apiRequest("PUT", `/api/voter-groups/${selectedGroup!._id}/elections`, { electionIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Elections saved", description: "Voter access updated for all group members.", variant: "success" });
      setSelectedGroup((g) => g ? { ...g, electionIds: selectedElectionIds } : g);
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not save elections", description: err.message, variant: "destructive" });
    },
  });

  const addSingleVoterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/voter-groups/${selectedGroup!._id}/voter`, {
        username: singleVoterUsername.trim(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voter created",
        description: `${data.data.username} — password: ${data.data.plainPassword}`,
        variant: "success",
      });
      setSingleVoterUsername("");
      setSingleVoterOpen(false);
      setAddVoterMode('choice');
      refetchVoters();
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not create voter", description: err.message, variant: "destructive" });
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/voter-groups/${selectedGroup!._id}/generate`, {
        prefix: bulkPrefix.trim() || undefined,
        startingNumber: bulkStart,
        count: bulkCount,
        franchiseId: franchiseId || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.count} voters created`, description: data.skipped ? `${data.skipped} skipped (already exist)` : undefined, variant: "success" });
      setBulkVoterOpen(false);
      refetchVoters();
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Bulk creation failed", description: err.message, variant: "destructive" });
    },
  });

  const addExistingUsersMutation = useMutation({
    mutationFn: async ({ groupId, userIds }: { groupId: string; userIds: string[] }) => {
      const res = await apiRequest("POST", `/api/voter-groups/${groupId}/add-users`, { userIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `${data.data?.added || 0} voter(s) added to group`, variant: "success" });
      const closeCreate = () => {
        setIsOpen(false);
        setGroupName(""); setGroupDescription(""); setGroupPrefix("");
        setCreateStep(1); setCreatedGroupId(null); setSelectedExistingIds([]);
      };
      closeCreate();
    },
    onError: (err: Error) => {
      toast({ title: "Could not add voters", description: err.message, variant: "destructive" });
    },
  });

  const toggleElection = (id: string) => {
    setSelectedElectionIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const Wrapper = embedded ? Fragment : MainLayout;

  // â”€â”€ Group detail view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (selectedGroup) {
    return (
      <Wrapper>
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={closeGroup} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> All Groups
          </Button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {selectedGroup.name || "Voter Group"}
          </h1>
          <Badge variant="outline">{groupVoters.length} voters</Badge>
        </div>

        <Tabs defaultValue="elections">
          <TabsList>
            <TabsTrigger value="elections">Elections</TabsTrigger>
            <TabsTrigger value="voters">Voters</TabsTrigger>
          </TabsList>

          {/* â”€â”€ Elections tab â”€â”€ */}
          <TabsContent value="elections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assign Elections to this Group</CardTitle>
                <p className="text-sm text-gray-500">Voters in this group will have access to the selected elections.</p>
              </CardHeader>
              <CardContent>
                {elections.length === 0 ? (
                  <p className="text-sm text-gray-500">No elections available.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {elections.map((el) => (
                      <label key={el._id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                        <Checkbox
                          checked={selectedElectionIds.includes(el._id)}
                          onCheckedChange={() => toggleElection(el._id)}
                        />
                        <span className="text-sm font-medium">{el.title}</span>
                        <span className="text-xs text-gray-400 ml-1">â€” {el.organization}</span>
                      </label>
                    ))}
                  </div>
                )}
                <Button
                  className="mt-4"
                  onClick={() => assignElectionsMutation.mutate(selectedElectionIds)}
                  disabled={assignElectionsMutation.isPending}
                >
                  {assignElectionsMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Savingâ€¦</> : "Save Elections"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* â”€â”€ Voters tab â”€â”€ */}
          <TabsContent value="voters" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Group Voters</h2>
              <div className="flex gap-2">
                {/* Single voter */}
                <Dialog open={singleVoterOpen} onOpenChange={(open) => {
                    setSingleVoterOpen(open);
                    if (!open) { setAddVoterMode('choice'); setAddVoterSearch(""); setAddVoterSelectedIds([]); setSingleVoterUsername(""); }
                  }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <PlusCircle className="h-4 w-4" /> Add Voter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Voter</DialogTitle>
                      <DialogDescription>
                        {addVoterMode === 'choice' && 'Choose how to add a voter to this group.'}
                        {addVoterMode === 'existing' && 'Search and select existing voters to add.'}
                        {addVoterMode === 'new' && 'Create a new voter account and add them to this group.'}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Mode: choice */}
                    {addVoterMode === 'choice' && (
                      <div className="grid grid-cols-2 gap-3 py-2">
                        <button
                          onClick={() => setAddVoterMode('existing')}
                          className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                          <Search className="h-7 w-7 text-primary" />
                          <span className="text-sm font-medium text-gray-800">Existing Voter</span>
                          <span className="text-xs text-gray-400 text-center">Pick from your voter list</span>
                        </button>
                        <button
                          onClick={() => setAddVoterMode('new')}
                          className="flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-7 w-7 text-primary" />
                          <span className="text-sm font-medium text-gray-800">New Voter</span>
                          <span className="text-xs text-gray-400 text-center">Create a new account</span>
                        </button>
                      </div>
                    )}

                    {/* Mode: existing */}
                    {addVoterMode === 'existing' && (
                      <div className="space-y-3 py-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          <Input
                            className="pl-9"
                            placeholder="Search voters by username…"
                            value={addVoterSearch}
                            onChange={(e) => setAddVoterSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto border rounded-md divide-y bg-white">
                          {(() => {
                            const alreadyInGroup = new Set(groupVoters.map(v => v._id));
                            const filtered = (allVotersData?.data || [])
                              .filter(u => (u.role === 'voter' || u.isVoter === true) && !alreadyInGroup.has(u._id) && (!addVoterSearch || u.username.toLowerCase().includes(addVoterSearch.toLowerCase())))
                              .slice(0, 80);
                            if (filtered.length === 0) return (
                              <p className="text-sm text-gray-400 px-3 py-4 text-center">
                                {allVotersData ? 'No voters found.' : 'Loading…'}
                              </p>
                            );
                            return filtered.map(u => (
                              <label key={u._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                <Checkbox
                                  checked={addVoterSelectedIds.includes(u._id)}
                                  onCheckedChange={(checked) =>
                                    setAddVoterSelectedIds(prev => checked ? [...prev, u._id] : prev.filter(id => id !== u._id))
                                  }
                                />
                                <span className="text-sm font-mono">{u.username}</span>
                              </label>
                            ));
                          })()}
                        </div>
                        {addVoterSelectedIds.length > 0 && (
                          <p className="text-xs text-primary font-medium">{addVoterSelectedIds.length} selected</p>
                        )}
                      </div>
                    )}

                    {/* Mode: new */}
                    {addVoterMode === 'new' && (
                      <div className="space-y-3 py-1">
                        <div className="space-y-1">
                          <Label>Username *</Label>
                          <Input
                            value={singleVoterUsername}
                            onChange={(e) => setSingleVoterUsername(e.target.value)}
                            placeholder="e.g. VOTE1001"
                            autoFocus
                          />
                        </div>
                        <p className="text-xs text-gray-500">A unique random password will be generated automatically.</p>
                      </div>
                    )}

                    <DialogFooter className="gap-2">
                      {addVoterMode !== 'choice' && (
                        <Button variant="ghost" size="sm" onClick={() => { setAddVoterMode('choice'); setAddVoterSearch(""); setAddVoterSelectedIds([]); setSingleVoterUsername(""); }}>
                          ← Back
                        </Button>
                      )}
                      {addVoterMode === 'existing' && (
                        <Button
                          disabled={addVoterSelectedIds.length === 0 || addExistingUsersMutation.isPending}
                          onClick={() => selectedGroup && addExistingUsersMutation.mutate(
                            { groupId: selectedGroup._id, userIds: addVoterSelectedIds },
                            {
                              onSuccess: () => {
                                setSingleVoterOpen(false);
                                setAddVoterMode('choice');
                                setAddVoterSearch("");
                                setAddVoterSelectedIds([]);
                                refetchVoters();
                              }
                            }
                          )}
                        >
                          {addExistingUsersMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : `Add ${addVoterSelectedIds.length} Voter(s)`}
                        </Button>
                      )}
                      {addVoterMode === 'new' && (
                        <Button
                          onClick={() => addSingleVoterMutation.mutate()}
                          disabled={!singleVoterUsername.trim() || addSingleVoterMutation.isPending}
                        >
                          {addSingleVoterMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : 'Create Voter'}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Bulk voters */}
                <Dialog open={bulkVoterOpen} onOpenChange={setBulkVoterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Users className="h-4 w-4" /> Bulk Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Create Voters</DialogTitle>
                      <DialogDescription>
                        Generating for <strong>{selectedGroup?.name}</strong>.
                        {selectedGroup?.description && <span className="block text-xs text-gray-400 mt-0.5">{selectedGroup.description}</span>}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-1">
                        <Label>Prefix <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
                        <Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="e.g. VOTE (leave blank for numbers only)" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Starting #</Label>
                          <Input type="number" value={bulkStart} onChange={(e) => setBulkStart(parseInt(e.target.value) || 1)} min={1} />
                        </div>
                        <div className="space-y-1">
                          <Label>Count</Label>
                          <Input type="number" value={bulkCount} onChange={(e) => setBulkCount(Math.min(parseInt(e.target.value) || 1, 1000))} min={1} max={1000} />
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                        Usernames: <strong>{bulkPrefix}{bulkStart}</strong> → <strong>{bulkPrefix}{bulkStart + bulkCount - 1}</strong> · Unique random passwords.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => bulkGenerateMutation.mutate()}
                        disabled={bulkGenerateMutation.isPending}
                      >
                        {bulkGenerateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : `Generate ${bulkCount} Voters`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {votersLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : groupVoters.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-gray-500">No voters in this group yet. Add voters above.</CardContent></Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Username</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Password</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groupVoters.map((v) => (
                      <tr key={v._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono">{v.username}</td>
                        <td className="px-4 py-2 font-mono text-gray-600">{(v as any).plainPassword || <span className="text-gray-400 italic">hidden</span>}</td>
                        <td className="px-4 py-2">
                          <Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status || "active"}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          <VoterSlipPrinter voter={v as any} electionNames={elections.filter(e => (v.electionAccess || []).includes(e._id)).map(e => `${e.title} â€” ${e.organization}`)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Wrapper>
    );
  }

  // â”€â”€ Group list view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Wrapper>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className={embedded ? "text-lg font-semibold text-gray-900 flex items-center gap-2" : "text-2xl font-bold text-gray-900 flex items-center gap-2"}>
            <Users className={embedded ? "h-5 w-5 text-primary" : "h-6 w-6 text-primary"} />
            Voter Groups
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create groups, assign elections, and manage voters inside each group.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
              setIsOpen(false);
              setGroupName(""); setGroupDescription(""); setGroupPrefix("");
              setCreateStep(1); setCreatedGroupId(null); setSelectedExistingIds([]);
              setExistingVoterSearch("");
            } else { setIsOpen(true); }
          }}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            {createStep === 1 ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create Voter Group</DialogTitle>
                  <DialogDescription>Set up the group details. You can add voters after creation.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (groupName.trim()) createMutation.mutate(); }} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="gname">Group Name *</Label>
                    <Input id="gname" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Block A Voters" autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gdesc">Description <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
                    <Input id="gdesc" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="e.g. Voters from Ward 3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gpfx">Default Prefix <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
                    <Input id="gpfx" value={groupPrefix} onChange={(e) => setGroupPrefix(e.target.value.toUpperCase())} placeholder="e.g. WARD3" />
                    <p className="text-xs text-gray-400">Used as default when bulk generating voters in this group.</p>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={!groupName.trim() || createMutation.isPending}>
                      {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create & Continue →"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Add Existing Voters</DialogTitle>
                  <DialogDescription>Optionally add existing voter accounts to <strong>"{groupName}"</strong>.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      className="pl-9"
                      placeholder="Search voters by username…"
                      value={existingVoterSearch}
                      onChange={(e) => setExistingVoterSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto border rounded-md divide-y bg-white">
                    {(allVotersData?.data || [])
                      .filter(u => (u.role === 'voter' || u.isVoter === true) && (!existingVoterSearch || u.username.toLowerCase().includes(existingVoterSearch.toLowerCase())))
                      .slice(0, 60)
                      .map(u => (
                        <label key={u._id} className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                          <Checkbox
                            checked={selectedExistingIds.includes(u._id)}
                            onCheckedChange={(checked) => setSelectedExistingIds(prev => checked ? [...prev, u._id] : prev.filter(id => id !== u._id))}
                          />
                          <span className="text-sm font-mono">{u.username}</span>
                        </label>
                      ))
                    }
                    {(allVotersData?.data || []).filter(u => u.role === 'voter' || u.isVoter === true).length === 0 && (
                      <p className="text-sm text-gray-400 px-3 py-4 text-center">No existing voters found.</p>
                    )}
                  </div>
                  {selectedExistingIds.length > 0 && (
                    <p className="text-xs text-primary font-medium">{selectedExistingIds.length} voter(s) selected</p>
                  )}
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setIsOpen(false); setGroupName(""); setGroupDescription(""); setGroupPrefix(""); setCreateStep(1); setCreatedGroupId(null); setSelectedExistingIds([]); setExistingVoterSearch(""); }}>
                    Skip & Close
                  </Button>
                  <Button
                    disabled={selectedExistingIds.length === 0 || addExistingUsersMutation.isPending}
                    onClick={() => createdGroupId && addExistingUsersMutation.mutate({ groupId: createdGroupId, userIds: selectedExistingIds })}
                  >
                    {addExistingUsersMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : `Add ${selectedExistingIds.length} Voter(s) →`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load voter groups</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : groups.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">No voter groups yet. Create one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <Card key={g._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{g.name || "Untitled"}</p>
<<<<<<< HEAD
                  {g.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {(g.voters?.length || 0)} voters
                    {g.prefix ? ` · prefix "${g.prefix}"` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(g.elections?.length || 0) > 0
                      ? `Linked to ${g.elections!.length} election${g.elections!.length > 1 ? "s" : ""}`
                      : "Not linked to any election"}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManageGroup(g)}
                  >
                    <Settings2 className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openLinkDialog(g)}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Links
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrintGroupId(g._id)}
                    disabled={(g.voters?.length || 0) === 0}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Slips
=======
                  {g.description && <p className="text-xs text-gray-400 truncate mt-0.5">{g.description}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>{g.voters?.length || 0} voters</span>
                    <span>{g.electionIds?.length || 0} elections</span>
                    {g.prefix && <span className="font-mono text-gray-400">prefix: {g.prefix}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openGroup(g)}>
                    <Settings2 className="h-3.5 w-3.5" /> Manage
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-900 hover:bg-red-50"
                    onClick={() => setDeleteGroupId(g._id)}
<<<<<<< HEAD
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
=======
                  >
                    <Trash2 className="h-4 w-4" />
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.total > 0 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages ?? 1}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
        />
      )}

      <Dialog open={!!linkGroup} onOpenChange={(open) => !open && setLinkGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link "{linkGroup?.name || "group"}" to elections</DialogTitle>
            <DialogDescription>
              Voters in this group automatically get access to every linked election and appear in that election's voter list.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {elections.length === 0 ? (
              <p className="text-sm text-gray-500">No elections available.</p>
            ) : (
              elections.map((e) => {
                const id = (e._id || e.id || "").toString();
                if (!id) return null;
                return (
                  <label key={id} className="flex items-center gap-3 cursor-pointer rounded-md p-2 hover:bg-gray-50">
                    <Checkbox
                      checked={linkSelected.includes(id)}
                      onCheckedChange={() => toggleLink(id)}
                    />
                    <span className="text-sm">
                      {e.title}
                      {e.organization ? <span className="text-gray-400"> — {e.organization}</span> : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkGroup(null)}>Cancel</Button>
            <Button onClick={() => linkMutation.mutate()} disabled={linkMutation.isPending}>
              {linkMutation.isPending ? "Saving..." : "Save Links"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkVoterSlipPrinter
        hideTrigger
        open={!!printGroupId}
        onOpenChange={(o) => { if (!o) setPrintGroupId(null); }}
        voters={printVoters as any}
        elections={elections as any}
        title={printGroup?.name ? `Voter Group: ${printGroup.name}` : "Voter Group"}
      />

      <ManageVoterGroupDialog
        group={manageGroup}
        open={!!manageGroup}
        onOpenChange={(o) => { if (!o) setManageGroup(null); }}
      />

      <ConfirmDialog
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onConfirm={() => deleteGroupId && deleteMutation.mutate(deleteGroupId)}
        loading={deleteMutation.isPending}
        title="Delete voter group?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold">{groups.find((g) => g._id === deleteGroupId)?.name || "this group"}</span>.
            Voters inside will not be deleted.
          </>
        }
        confirmText="Delete group"
      />
    </Wrapper>
  );
}
