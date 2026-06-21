import { useEffect, useState, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertCircle, Users, PlusCircle, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Pagination } from "@/lib/types";

interface VoterGroup {
  _id: string;
  name?: string;
  description?: string;
  prefix?: string;
  voters?: string[];
  createdAt?: string;
}

export default function VoterGroups({ embedded = false }: { embedded?: boolean; electionId?: string } = {}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", prefix: "" });
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!embedded) document.title = "Voter Groups | Vote+";
  }, [embedded]);

  const userDataString = localStorage.getItem("user");
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const franchiseId = userData?.franchiseId;

  const { data, isLoading, error } = useQuery<{ data: VoterGroup[]; pagination?: Pagination }>({
    queryKey: ["/api/voter-groups", page],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/voter-groups?page=${page}&limit=${pageSize}`);
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const groups = Array.isArray(data?.data) ? data!.data : [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/voter-groups", {
        name: form.name,
        description: form.description,
        prefix: form.prefix || undefined,
        franchiseId: franchiseId || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Voter group created", variant: "success" });
      setIsOpen(false);
      setForm({ name: "", description: "", prefix: "" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/voter-groups"] });
    },
    onError: (err: Error) => {
      toast({ title: "Could not delete group", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  const Wrapper = embedded ? Fragment : MainLayout;

  return (
    <Wrapper>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className={embedded ? "text-lg font-semibold text-gray-900 flex items-center gap-2" : "text-2xl font-bold text-gray-900 flex items-center gap-2"}>
            <Users className={embedded ? "h-5 w-5 text-primary" : "h-6 w-6 text-primary"} />
            Voter Groups
          </h1>
          <p className="text-sm text-gray-500 mt-1">Organize voters into manageable groups.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Voter Group</DialogTitle>
              <DialogDescription>Add a new group to organize voters.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Block A Voters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                  placeholder="Optional voter ID prefix"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </form>
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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No voter groups yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <Card key={g._id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{g.name || "Untitled"}</p>
                  {g.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {(g.voters?.length || 0)} voters
                    {g.prefix ? ` · prefix "${g.prefix}"` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-900 hover:bg-red-50 shrink-0"
                  onClick={() => setDeleteGroupId(g._id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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

      <ConfirmDialog
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onConfirm={() => deleteGroupId && deleteMutation.mutate(deleteGroupId)}
        loading={deleteMutation.isPending}
        title="Delete voter group?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold">
              {groups.find((g) => g._id === deleteGroupId)?.name || "this group"}
            </span>
            . This action cannot be undone.
          </>
        }
        confirmText="Delete group"
      />
    </Wrapper>
  );
}
