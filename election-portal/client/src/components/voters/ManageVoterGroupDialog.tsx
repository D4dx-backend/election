import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Search,
  UserPlus,
  UserCheck,
  Users,
  Trash2,
  UsersRound,
  Loader2,
} from "lucide-react";

interface VoterGroup {
  _id: string;
  name?: string;
  description?: string;
  prefix?: string;
  voters?: any[];
  elections?: any[];
}

interface ManageVoterGroupDialogProps {
  group: VoterGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageVoterGroupDialog({
  group,
  open,
  onOpenChange,
}: ManageVoterGroupDialogProps) {
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<"voters" | "add">("voters");
  const [addTab, setAddTab] = useState<"new" | "existing" | "bulk">("new");

  // New voter form
  const [newVoter, setNewVoter] = useState({
    fullName: "",
    username: "",
    password: "",
    registrationNumber: "",
  });

  // Add-existing state
  const [existingSearch, setExistingSearch] = useState("");
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);

  // Bulk generate form
  const [bulkForm, setBulkForm] = useState({
    prefix: group?.prefix || "VOTE",
    startingNumber: 1001,
    count: 10,
  });

  // Track per-voter remove loading
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // ── Fetch full group detail (populated voters) ──────────────────────────
  const {
    data: groupDetail,
    isLoading: groupDetailLoading,
    refetch: refetchGroupDetail,
  } = useQuery({
    queryKey: ["/api/voter-groups", group?._id, "manage-detail"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/voter-groups/${group!._id}`);
      return res.json();
    },
    enabled: !!group && open,
  });

  const currentVoters: any[] = groupDetail?.data?.voters || [];

  // ── Fetch voters NOT yet in this group ──────────────────────────────────
  const { data: availableVotersResponse, isLoading: availableLoading, refetch: refetchAvailableVoters } =
    useQuery({
      queryKey: [
        "/api/users/voters/not-in-group",
        group?._id,
        existingSearch,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          notInGroup: group!._id,
          pageSize: "200",
          page: "1",
        });
        if (existingSearch.trim()) params.append("search", existingSearch.trim());
        const res = await apiRequest(
          "GET",
          `/api/users/voters?${params}`
        );
        return res.json();
      },
      enabled:
        !!group && open && mainTab === "add" && addTab === "existing",
      staleTime: 0,
    });

  const groupMemberIds = useMemo(
    () => new Set(currentVoters.map((v: any) => v._id?.toString() || "")),
    [currentVoters]
  );

  const availableVoters: any[] = (availableVotersResponse?.data || []).filter(
    (v: any) => !groupMemberIds.has(v._id?.toString() || "")
  );

  // ── Mutations ────────────────────────────────────────────────────────────
  const addExistingMutation = useMutation({
    mutationFn: async (voterIds: string[]) => {
      const res = await apiRequest(
        "POST",
        `/api/voter-groups/${group!._id}/add-voters`,
        { voterIds }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Voters added to group", variant: "success" });
      setSelectedVoterIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters/not-in-group"] });
      refetchGroupDetail();
      refetchAvailableVoters();
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to add voters",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const createNewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/voters", {
        username: newVoter.username.trim(),
        fullName: newVoter.fullName.trim() || newVoter.username.trim(),
        password: newVoter.password.trim(),
        registrationNumber: newVoter.registrationNumber.trim(),
        electionIds: [],
        voterGroupId: group!._id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      const pwd = data?.data?.password;
      toast({
        title: "Voter created and added to group",
        description: pwd ? `Auto-generated password: ${pwd}` : undefined,
        variant: "success",
      });
      setNewVoter({ fullName: "", username: "", password: "", registrationNumber: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
      refetchGroupDetail();
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create voter",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/voters/generate", {
        prefix: bulkForm.prefix.trim(),
        startingNumber: bulkForm.startingNumber,
        count: bulkForm.count,
        assignmentType: "election",
        electionIds: [],
        voterGroupId: group!._id,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${data.count} voters generated`,
        description: "Added to group. Elections synced automatically.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/voters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
      refetchGroupDetail();
    },
    onError: (err: Error) => {
      toast({
        title: "Bulk generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const removeVoterMutation = useMutation({
    mutationFn: async (voterId: string) => {
      setRemovingIds((prev) => new Set([...prev, voterId]));
      const res = await apiRequest(
        "POST",
        `/api/voter-groups/${group!._id}/remove-voters`,
        { voterIds: [voterId] }
      );
      return res.json();
    },
    onSuccess: (_data, voterId) => {
      toast({ title: "Voter removed from group", variant: "success" });
      setRemovingIds((prev) => {
        const s = new Set(prev);
        s.delete(voterId);
        return s;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
      refetchGroupDetail();
    },
    onError: (err: Error, voterId) => {
      setRemovingIds((prev) => {
        const s = new Set(prev);
        s.delete(voterId);
        return s;
      });
      toast({
        title: "Failed to remove voter",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleVoterSelection = (id: string) => {
    setSelectedVoterIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVoterIds.length === availableVoters.length) {
      setSelectedVoterIds([]);
    } else {
      setSelectedVoterIds(
        availableVoters.map((v: any) => v._id?.toString() || "").filter(Boolean)
      );
    }
  };

  const handleCreateNew = () => {
    if (!newVoter.username.trim()) {
      toast({ title: "Username is required", variant: "destructive" });
      return;
    }
    createNewMutation.mutate();
  };

  const handleBulkGenerate = () => {
    if (!bulkForm.prefix.trim()) {
      toast({ title: "Prefix is required", variant: "destructive" });
      return;
    }
    if (bulkForm.count < 1 || bulkForm.count > 1000) {
      toast({
        title: "Count must be between 1 and 1000",
        variant: "destructive",
      });
      return;
    }
    if (
      bulkForm.count > 100 &&
      !confirm(`Generate ${bulkForm.count} voters? This may take a moment.`)
    )
      return;
    bulkGenerateMutation.mutate();
  };

  const handleDialogClose = (o: boolean) => {
    if (!o) {
      setMainTab("voters");
      setAddTab("new");
      setNewVoter({ fullName: "", username: "", password: "", registrationNumber: "" });
      setExistingSearch("");
      setSelectedVoterIds([]);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage: {group?.name || "Voter Group"}
          </DialogTitle>
          <DialogDescription>
            View current voters or add new ones to this group.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mainTab}
          onValueChange={(v) => setMainTab(v as "voters" | "add")}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="voters" className="gap-1.5">
              <Users className="h-4 w-4" />
              Current Voters
              {currentVoters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {currentVoters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add Voters
            </TabsTrigger>
          </TabsList>

          {/* ── Current Voters ─────────────────────────────────────────── */}
          <TabsContent value="voters" className="mt-4 flex-1 min-h-0">
            {groupDetailLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : currentVoters.length === 0 ? (
              <div className="py-14 text-center text-sm text-gray-500">
                No voters in this group yet.
                <br />
                Use the{" "}
                <button
                  className="text-primary underline"
                  onClick={() => setMainTab("add")}
                >
                  Add Voters
                </button>{" "}
                tab to add some.
              </div>
            ) : (
              <ScrollArea className="h-80 rounded-md border">
                <div className="divide-y">
                  {currentVoters.map((voter: any) => {
                    const id = voter._id?.toString() || "";
                    const isRemoving = removingIds.has(id);
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                            {(voter.username || "?").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {voter.username}
                            </p>
                            {voter.registrationNumber &&
                              voter.registrationNumber !== voter.username && (
                                <p className="truncate text-xs text-gray-500">
                                  Reg: {voter.registrationNumber}
                                </p>
                              )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                          onClick={() => removeVoterMutation.mutate(id)}
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* ── Add Voters ─────────────────────────────────────────────── */}
          <TabsContent value="add" className="mt-4 flex-1 min-h-0">
            <Tabs
              value={addTab}
              onValueChange={(v) => {
                setAddTab(v as "new" | "existing" | "bulk");
                setSelectedVoterIds([]);
              }}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="new" className="gap-1 text-xs sm:text-sm">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>New Voter</span>
                </TabsTrigger>
                <TabsTrigger
                  value="existing"
                  className="gap-1 text-xs sm:text-sm"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Existing</span>
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-1 text-xs sm:text-sm">
                  <UsersRound className="h-3.5 w-3.5" />
                  <span>Bulk</span>
                </TabsTrigger>
              </TabsList>

              {/* Create New Voter */}
              <TabsContent value="new" className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mg-username">Username *</Label>
                  <Input
                    id="mg-username"
                    value={newVoter.username}
                    onChange={(e) =>
                      setNewVoter({ ...newVoter, username: e.target.value })
                    }
                    placeholder="e.g. voter001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mg-fullname">Full Name</Label>
                  <Input
                    id="mg-fullname"
                    value={newVoter.fullName}
                    onChange={(e) =>
                      setNewVoter({ ...newVoter, fullName: e.target.value })
                    }
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mg-password">Password</Label>
                  <Input
                    id="mg-password"
                    value={newVoter.password}
                    onChange={(e) =>
                      setNewVoter({ ...newVoter, password: e.target.value })
                    }
                    placeholder="Leave blank to auto-generate"
                  />
                  <p className="text-xs text-gray-500">
                    Auto-generated passwords are 8 random alphanumeric characters.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mg-regno">Registration Number</Label>
                  <Input
                    id="mg-regno"
                    value={newVoter.registrationNumber}
                    onChange={(e) =>
                      setNewVoter({
                        ...newVoter,
                        registrationNumber: e.target.value,
                      })
                    }
                    placeholder="Optional — defaults to username"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    onClick={handleCreateNew}
                    disabled={createNewMutation.isPending}
                  >
                    {createNewMutation.isPending
                      ? "Creating…"
                      : "Create & Add to Group"}
                  </Button>
                </div>
              </TabsContent>

              {/* Add Existing Voters */}
              <TabsContent value="existing" className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by username or name…"
                    value={existingSearch}
                    onChange={(e) => setExistingSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {availableLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : availableVoters.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    {existingSearch
                      ? "No matching voters found."
                      : "All existing voters are already in this group."}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      <Checkbox
                        id="mg-select-all"
                        checked={
                          availableVoters.length > 0 &&
                          selectedVoterIds.length === availableVoters.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                      <Label
                        htmlFor="mg-select-all"
                        className="cursor-pointer font-normal"
                      >
                        {selectedVoterIds.length > 0
                          ? `${selectedVoterIds.length} of ${availableVoters.length} selected`
                          : `Select all (${availableVoters.length})`}
                      </Label>
                    </div>

                    <ScrollArea className="h-48 rounded-md border">
                      <div className="divide-y">
                        {availableVoters.map((voter: any) => {
                          const id = voter._id?.toString() || "";
                          const checked = selectedVoterIds.includes(id);
                          return (
                            <label
                              key={id}
                              htmlFor={`mg-ev-${id}`}
                              className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 ${
                                checked ? "bg-primary/5" : ""
                              }`}
                            >
                              <Checkbox
                                id={`mg-ev-${id}`}
                                checked={checked}
                                onCheckedChange={() =>
                                  toggleVoterSelection(id)
                                }
                              />
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                                {(voter.username || "?").slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {voter.username}
                                </p>
                                {voter.fullName &&
                                  voter.fullName !== voter.username && (
                                    <p className="truncate text-xs text-gray-500">
                                      {voter.fullName}
                                    </p>
                                  )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          addExistingMutation.mutate(selectedVoterIds)
                        }
                        disabled={
                          selectedVoterIds.length === 0 ||
                          addExistingMutation.isPending
                        }
                      >
                        {addExistingMutation.isPending
                          ? "Adding…"
                          : `Add${selectedVoterIds.length > 0 ? ` (${selectedVoterIds.length})` : ""} to Group`}
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Bulk Generate */}
              <TabsContent value="bulk" className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Generate voters in bulk. They are automatically added to this
                  group and inherit all elections the group is linked to.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mg-bulk-prefix">Prefix</Label>
                    <Input
                      id="mg-bulk-prefix"
                      value={bulkForm.prefix}
                      onChange={(e) =>
                        setBulkForm({ ...bulkForm, prefix: e.target.value })
                      }
                      placeholder="e.g. VOTE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mg-bulk-start">Starting #</Label>
                    <Input
                      id="mg-bulk-start"
                      type="number"
                      min={0}
                      value={bulkForm.startingNumber}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          startingNumber: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mg-bulk-count">Count</Label>
                    <Input
                      id="mg-bulk-count"
                      type="number"
                      min={1}
                      max={1000}
                      value={bulkForm.count}
                      onChange={(e) =>
                        setBulkForm({
                          ...bulkForm,
                          count: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                  Usernames will be like{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    {bulkForm.prefix || "VOTE"}
                    {bulkForm.startingNumber}
                  </code>
                  . Passwords are auto-generated.
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleBulkGenerate}
                    disabled={bulkGenerateMutation.isPending}
                  >
                    {bulkGenerateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      `Generate ${bulkForm.count} Voter${bulkForm.count !== 1 ? "s" : ""}`
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
