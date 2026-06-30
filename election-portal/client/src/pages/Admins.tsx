import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusIcon, AlertCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema for franchise admin creation
const franchiseAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional().or(z.literal("")),
  franchiseId: z.string().min(1, "Please select a franchise")
});

// Schema for election admin creation
const electionAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional().or(z.literal("")),
  franchiseId: z.string().min(1, "Please select a franchise"),
  electionAccess: z.array(z.string()).min(1, "Please select at least one election")
});

type FranchiseAdminFormValues = z.infer<typeof franchiseAdminSchema>;
type ElectionAdminFormValues = z.infer<typeof electionAdminSchema>;

type ListResponse<T> = { data: T[] };

function asList<T>(value: T[] | ListResponse<T> | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

interface AdminFranchiseOption {
  _id: string;
  id?: string | number;
  name: string;
}

interface AdminElectionOption {
  _id: string;
  id?: string | number;
  title: string;
  organization?: string;
  franchiseId: string | { _id?: string; toString: () => string };
}

interface FranchiseAdminUser {
  _id: string;
  username: string;
  fullName?: string;
  status?: string;
  franchiseDetails?: { name?: string };
}

export default function Admins() {
  const [createOpen, setCreateOpen] = useState(false);
  const [adminType, setAdminType] = useState<'franchise' | 'election'>('election');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const { toast } = useToast();
  
  // Get user data from localStorage to check permissions
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userRole = userData?.role || '';
  const userFranchiseId = userData?.franchiseId || '';
  // Only super admins may create franchise administrators
  const canCreateFranchiseAdmin = userRole === 'super_admin';
  
  // --- Fetch data ---
  
  const { 
    data: franchisesRaw, 
    isLoading: franchisesLoading,
    isError: franchisesError
  } = useQuery<AdminFranchiseOption[] | ListResponse<AdminFranchiseOption>>({
    queryKey: ['/api/franchises']
  });
  const franchiseList = asList(franchisesRaw);
  
  // Fetch franchise admins
  const {
    data: franchiseAdminsRaw,
    isLoading: franchiseAdminsLoading,
    isError: franchiseAdminsError
  } = useQuery<FranchiseAdminUser[] | ListResponse<FranchiseAdminUser>>({
    queryKey: ['/api/users/franchise-admins']
  });
  const franchiseAdminList = asList(franchiseAdminsRaw);
  
  // Fetch elections (for election admin creation)
  const {
    data: electionsRaw,
    isLoading: electionsLoading,
    isError: electionsError
  } = useQuery<AdminElectionOption[] | ListResponse<AdminElectionOption>>({
    queryKey: ['/api/elections'],
    enabled: true // Always fetch elections, we'll filter them in the component
  });
  const electionList = asList(electionsRaw);
  
  // --- Form handling ---
  
  // Franchise admin form
  const franchiseAdminForm = useForm<FranchiseAdminFormValues>({
    resolver: zodResolver(franchiseAdminSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      franchiseId: ""
    }
  });
  
  // Election admin form
  const electionAdminForm = useForm<ElectionAdminFormValues>({
    resolver: zodResolver(electionAdminSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      franchiseId: userRole === 'franchise_admin' ? userFranchiseId : "",
      electionAccess: []
    }
  });
  
  // Update available elections when franchise changes or when component mounts for franchise admin
  useEffect(() => {
    // For franchise admin, pre-select their franchise ID
    if (userRole === 'franchise_admin' && userFranchiseId) {
      setSelectedFranchiseId(userFranchiseId);
      electionAdminForm.setValue('franchiseId', userFranchiseId);
    } else if (selectedFranchiseId) {
      // Clear previous election selection
      electionAdminForm.setValue('electionAccess', []);
    }
  }, [selectedFranchiseId, electionAdminForm, userRole, userFranchiseId]);
  
  // --- Mutations ---
  
  // Create franchise admin
  const createFranchiseAdminMutation = useMutation({
    mutationFn: async (data: FranchiseAdminFormValues) => {
      console.log("Creating franchise admin with data:", {...data, password: "******"});
      return await apiRequest('POST', '/api/users/franchise-admin', data);
    },
    onSuccess: (data) => {
      console.log("Admin created successfully:", data);
      toast({
        title: "Administrator created",
        description: "Franchise administrator has been created successfully",
        variant: "success"
      });
      setCreateOpen(false);
      franchiseAdminForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/users/franchise-admins'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create administrator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  // Create election admin
  const createElectionAdminMutation = useMutation({
    mutationFn: async (data: ElectionAdminFormValues) => {
      return await apiRequest('POST', '/api/users/election-admin', data);
    },
    onSuccess: () => {
      toast({
        title: "Administrator created",
        description: "Election administrator has been created successfully",
        variant: "success"
      });
      setCreateOpen(false);
      electionAdminForm.reset();
      setSelectedFranchiseId("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create administrator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  // Form submission handlers
  const onSubmitFranchiseAdmin = (data: FranchiseAdminFormValues) => {
    createFranchiseAdminMutation.mutate(data);
  };
  
  const onSubmitElectionAdmin = (data: ElectionAdminFormValues) => {
    createElectionAdminMutation.mutate(data);
  };
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string, password: string }) => {
      return await apiRequest('POST', `/api/users/${id}/reset-password`, { newPassword: password });
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Administrator password has been reset successfully",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/franchise-admins'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });
  
  useEffect(() => {
    document.title = "Administrators | Vote+";
  }, []);
  
  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrators</h1>
          <p className="text-sm text-gray-600">Manage system administrators</p>
        </div>

        {/* Single unified create flow: asks for the administrator type, then shows matching fields */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setAdminType(canCreateFranchiseAdmin ? 'franchise' : 'election')}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Administrator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Administrator</DialogTitle>
              <DialogDescription>
                Choose which type of administrator to create, then fill in their details.
              </DialogDescription>
            </DialogHeader>

            {/* Administrator type selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Administrator Type</label>
              <Select
                value={adminType}
                onValueChange={(v) => setAdminType(v as 'franchise' | 'election')}
                disabled={!canCreateFranchiseAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canCreateFranchiseAdmin && (
                    <SelectItem value="franchise">Franchise Administrator</SelectItem>
                  )}
                  <SelectItem value="election">Election Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {adminType === 'franchise'
                  ? 'Can manage an entire franchise and its elections.'
                  : 'Can manage only the elections assigned to them.'}
              </p>
            </div>

            {adminType === 'franchise' ? (
              <Form {...franchiseAdminForm}>
                <form onSubmit={franchiseAdminForm.handleSubmit(onSubmitFranchiseAdmin)} className="space-y-4">
                  <FormField
                    control={franchiseAdminForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={franchiseAdminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={franchiseAdminForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={franchiseAdminForm.control}
                    name="franchiseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Franchise</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a franchise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {franchisesLoading ? (
                              <SelectItem value="__loading" disabled>
                                Loading franchises…
                              </SelectItem>
                            ) : franchisesError ? (
                              <SelectItem value="__error" disabled>
                                Failed to load franchises
                              </SelectItem>
                            ) : franchiseList.length === 0 ? (
                              <SelectItem value="__empty" disabled>
                                No franchises found — create one first
                              </SelectItem>
                            ) : (
                              franchiseList.map((franchise) => (
                                <SelectItem
                                  key={franchise._id || `franchise-${franchise.id}`}
                                  value={String(franchise._id || franchise.id)}
                                >
                                  {franchise.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createFranchiseAdminMutation.isPending}>
                      {createFranchiseAdminMutation.isPending ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <Form {...electionAdminForm}>
                <form onSubmit={electionAdminForm.handleSubmit(onSubmitElectionAdmin)} className="space-y-4">
                  <FormField
                    control={electionAdminForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={electionAdminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={electionAdminForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Only show franchise selector if user is not a franchise admin */}
                  {userRole !== 'franchise_admin' ? (
                    <FormField
                      control={electionAdminForm.control}
                      name="franchiseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Franchise</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedFranchiseId(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a franchise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {franchisesLoading ? (
                                <SelectItem value="__loading" disabled>
                                  Loading franchises…
                                </SelectItem>
                              ) : franchiseList.length === 0 ? (
                                <SelectItem value="__empty" disabled>
                                  No franchises found
                                </SelectItem>
                              ) : (
                                franchiseList.map((franchise) => (
                                  <SelectItem
                                    key={franchise._id || `franchise-${franchise.id}`}
                                    value={String(franchise._id || franchise.id)}
                                  >
                                    {franchise.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select a franchise to see available elections
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                  {selectedFranchiseId && (
                    <FormField
                      control={electionAdminForm.control}
                      name="electionAccess"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Elections</FormLabel>
                          <div className="border rounded-md p-4 space-y-2">
                            {electionsLoading ? (
                              <Skeleton className="h-20 w-full" />
                            ) : electionList.length > 0 ? (
                              electionList
                                .filter(election => {
                                  const electionFranchiseId =
                                    typeof election.franchiseId === 'object' && election.franchiseId?._id
                                      ? election.franchiseId._id.toString()
                                      : (typeof election.franchiseId === 'object'
                                          ? election.franchiseId.toString()
                                          : String(election.franchiseId));
                                  return electionFranchiseId === selectedFranchiseId;
                                })
                                .map(election => {
                                  const electionId = String(election._id || election.id);
                                  return (
                                  <div key={electionId} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`election-${electionId}`}
                                      value={electionId}
                                      checked={field.value.includes(electionId)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const value = e.target.value;
                                        if (checked) {
                                          field.onChange([...field.value, value]);
                                        } else {
                                          field.onChange(field.value.filter(v => v !== value));
                                        }
                                      }}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor={`election-${electionId}`} className="text-sm font-medium text-gray-700">
                                      {election.title}{election.organization ? ` - ${election.organization}` : ""}
                                    </label>
                                  </div>
                                );
                                })
                            ) : (
                              <p className="text-sm text-gray-500">
                                No elections found for this franchise
                              </p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={createElectionAdminMutation.isPending}>
                      {createElectionAdminMutation.isPending ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-6">
        {/* Franchise Administrators (super admins only) */}
        {canCreateFranchiseAdmin && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Franchise Administrators</CardTitle>
                <CardDescription>
                  Manage administrators who can control franchises
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {franchiseAdminsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch administrators. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              
              {franchiseAdminsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : franchiseAdminList.length > 0 ? (
                <>
                <div className="divide-y divide-gray-100 md:hidden">
                  {franchiseAdminList.map((admin) => (
                    <div key={admin._id} className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{admin.username}</h3>
                          <p className="text-sm text-gray-500 truncate">{admin.fullName || '-'}</p>
                        </div>
                        <Badge
                          variant={admin.status === 'active' ? 'outline' : 'secondary'}
                          className={
                            admin.status === 'active' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          }
                        >
                          {admin.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3 text-sm">
                        <p className="text-xs text-gray-500">Franchise</p>
                        <p className="font-medium text-gray-900">{admin.franchiseDetails ? admin.franchiseDetails.name : '-'}</p>
                      </div>
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newPassword = prompt("Enter new password (minimum 6 characters):");
                          if (newPassword && newPassword.length >= 6) {
                            resetPasswordMutation.mutate({ id: admin._id, password: newPassword });
                          } else if (newPassword) {
                            toast({
                              title: "Invalid password",
                              description: "Password must be at least 6 characters",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Reset Password
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchiseAdminList.map((admin) => (
                        <TableRow key={admin._id}>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>{admin.fullName || '-'}</TableCell>
                          <TableCell>
                            {admin.franchiseDetails ? admin.franchiseDetails.name : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={admin.status === 'active' ? 'outline' : 'secondary'}
                              className={
                                admin.status === 'active' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                              }
                            >
                              {admin.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="link" 
                              onClick={() => {
                                const newPassword = prompt("Enter new password (minimum 6 characters):");
                                if (newPassword && newPassword.length >= 6) {
                                  resetPasswordMutation.mutate({ id: admin._id, password: newPassword });
                                } else if (newPassword) {
                                  toast({
                                    title: "Invalid password",
                                    description: "Password must be at least 6 characters",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              Reset Password
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                </div>
                </>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">No franchise administrators found</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Election Administrators */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Election Administrators</CardTitle>
              <CardDescription>
                Manage administrators who can control specific elections
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Election Administrators Management</AlertTitle>
              <AlertDescription>
                Election administrators can be created to manage specific elections within a franchise.
                They have limited access only to the elections assigned to them.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}