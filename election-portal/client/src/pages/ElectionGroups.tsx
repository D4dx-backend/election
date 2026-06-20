import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PlusIcon, Pencil, Trash2, FolderPlus, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
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

export default function ElectionGroups() {
  const [open, setOpen] = useState(false);
  // Get the user data to get franchiseId for admins
  const { data: userData } = useQuery({ queryKey: ['/api/auth/me'] });
  const userFranchiseId = userData?.user?.franchiseId;
  const userRole = userData?.user?.role;

  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    franchiseId: ''
  });
  const [editFormData, setEditFormData] = useState({ id: '', name: '', description: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch election groups with proper handling for the API response format
  const {
    data: electionGroupsRawData,
    isLoading: electionGroupsLoading,
    isError: electionGroupsError,
    refetch: refetchElectionGroups
  } = useQuery({
    queryKey: ['/api/election-groups']
  });
  
  // Extract the actual groups from the response
  const electionGroupsData = electionGroupsRawData?.data || [];

  // Fetch franchises with proper response handling
  const {
    data: franchisesRawData,
    isLoading: franchisesLoading,
    isError: franchisesError
  } = useQuery({
    queryKey: ['/api/franchises']
  });
  
  // Extract franchises from response
  const franchisesData = franchisesRawData?.data || [];

  // Fetch elections with proper response handling
  const {
    data: electionsRawData,
    isLoading: electionsLoading,
    isError: electionsError
  } = useQuery({
    queryKey: ['/api/elections']
  });
  
  // Extract elections from response
  const electionsData = electionsRawData?.data || [];

  // Now we need to get the data from the raw response
  // The API returns the data in the raw response directly as an array
  const allElectionGroups = electionGroupsRawData || [];
  const franchises = franchisesRawData?.data || [];
  const elections = electionsRawData?.data || [];
  
  // Filter election groups based on user role and franchise
  const electionGroups = userRole === 'franchise_admin'
    ? allElectionGroups.filter(group => {
        const groupFranchiseId = group.franchiseId?._id?.toString() || 
                                group.franchiseId?.toString() || 
                                String(group.franchiseId);
        return groupFranchiseId === userFranchiseId;
      })
    : allElectionGroups;
    
  // Add complete debugging info to understand data structure
  console.log("Election Groups Raw:", electionGroupsRawData);
  console.log("Election Groups Data:", electionGroupsData);
  console.log("Franchises Raw:", franchisesRawData);
  console.log("Franchises Data:", franchisesData);
  console.log("Elections Raw:", electionsRawData);
  console.log("Elections Data:", electionsData);
  
  console.log("Filtered Election Groups:", electionGroups);

  console.log('Election Groups Data:', {
    allGroups: allElectionGroups,
    filtered: electionGroups,
    userRole,
    userFranchiseId
  });

  console.log('Election Groups:', electionGroups); // Debug log

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; franchiseId?: string }) => {
       return await apiRequest('POST', '/api/election-groups', data);
    },
    onSuccess: () => {
      toast({
        title: "Group created",
        description: "New election group has been created successfully"
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/election-groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; description: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest('PATCH', `/api/election-groups/${id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Group updated",
        description: "Election group has been updated successfully"
      });
      setIsEditOpen(false);
      setEditFormData({ id: '', name: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/election-groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/election-groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Group deleted",
        description: "Election group has been deleted successfully"
      });
      setDeleteGroupId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/election-groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setDeleteGroupId(null);
    }
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare data to submit
    let dataToSubmit: { name: string; description: string; franchiseId?: string } = {
      name: createFormData.name,
      description: createFormData.description
    };

    // For franchise admin, use their franchiseId
    if (userRole === 'franchise_admin' && userFranchiseId) {
      dataToSubmit.franchiseId = userFranchiseId;
    } 
    // For super admin, require franchise selection
    else if (userRole === 'super_admin') {
      if (!createFormData.franchiseId) {
        toast({
          title: "Error",
          description: "Please select a franchise",
          variant: "destructive"
        });
        return;
      }
      dataToSubmit.franchiseId = createFormData.franchiseId;
    }
    createMutation.mutate(dataToSubmit);
  };

  const handleEditGroup = (id: string) => {
    // Find the group to edit
    const group = electionGroups.find(g => {
      const groupId = g._id?.toString() || g.id?.toString();
      return groupId === id;
    });

    if (group) {
      setEditFormData({
        id,
        name: group.name,
        description: group.description || ''
      });
      setIsEditOpen(true);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate(editFormData);
  };

  const handleDeleteGroup = (id: string) => {
    setDeleteGroupId(id);
  };

  const confirmDelete = () => {
    if (deleteGroupId) {
      deleteMutation.mutate(deleteGroupId);
    }
  };

  // Count elections in each group
  const getElectionCount = (groupId: string) => {
    return elections?.filter(e => {
      const eGroupId = e.electionGroupId?._id?.toString() ||
        e.electionGroupId?.toString() ||
        String(e.electionGroupId);
      return eGroupId === groupId;
    }).length || 0;
  };

  // Get franchise name
  const getFranchiseName = (franchiseId: string) => {
    const franchise = franchises?.find(f => {
      const fId = f._id?.toString() || f.id?.toString();
      return fId === franchiseId;
    });
    return franchise?.name || "Unknown";
  };

  useEffect(() => {
    document.title = "Election Groups | ElectManager";
  }, []);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Election Groups</h1>
          <p className="text-sm text-gray-600">Organize and manage election groups</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateGroup}>
                <DialogHeader>
                  <DialogTitle>Create Election Group</DialogTitle>
                  <DialogDescription>
                    Create a new group to organize multiple elections together.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Group name"
                      className="col-span-3"
                      required
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      placeholder="Group description (optional)"
                      className="col-span-3"
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Only show franchise selection for super_admin users */}
                  {userRole === 'super_admin' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="franchiseId" className="text-right">
                        Franchise
                      </Label>
                      <Select
                        value={createFormData.franchiseId}
                        onValueChange={(value) => setCreateFormData({ ...createFormData, franchiseId: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a franchise" />
                        </SelectTrigger>
                        <SelectContent>
                          {franchises.map((franchise) => {
                            const id = franchise._id?.toString() || franchise.id?.toString();
                            return (
                              <SelectItem key={id} value={id}>
                                {franchise.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={!createFormData.name || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Election Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Election Group</DialogTitle>
              <DialogDescription>
                Update the details of this election group.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  placeholder="Group name"
                  className="col-span-3"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  placeholder="Group description (optional)"
                  className="col-span-3"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={editMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editFormData.name || editMutation.isPending}
              >
                {editMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteGroupId !== null}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              election group and remove its association with any elections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Election Groups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {electionGroupsLoading ? (
            <div className="p-6 text-center">Loading groups...</div>
          ) : electionGroups && electionGroups.length > 0 ? (
            <div className="space-y-6">
              {/* Simple list view of all election groups */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Franchise</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {electionGroups.map((group) => {
                    const groupId = group._id?.toString() || group.id?.toString();
                    
                    // Find franchise name
                    const franchiseId = typeof group.franchiseId === 'object' 
                      ? (group.franchiseId?._id?.toString() || group.franchiseId?.toString())
                      : group.franchiseId?.toString();
                      
                    const franchise = franchises.find(f => 
                      (f._id?.toString() || f.id?.toString()) === franchiseId
                    );
                    
                    return (
                      <TableRow key={groupId}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.description || 'No description'}</TableCell>
                        <TableCell>{franchise?.name || 'Unknown franchise'}</TableCell>
                        <TableCell>
                          {group.createdAt ?
                            new Date(group.createdAt).toLocaleDateString() :
                            'Not available'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGroup(groupId)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            onClick={() => handleDeleteGroup(groupId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FolderPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No election groups found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating a new election group.
              </p>
              <Button
                onClick={() => setOpen(true)}
                className="mt-4"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}