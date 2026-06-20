import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  fullName: z.string().optional().or(z.literal("")),
  franchiseId: z.string().min(1, "Please select a franchise")
});

// Schema for election admin creation
const electionAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  fullName: z.string().optional().or(z.literal("")),
  franchiseId: z.string().min(1, "Please select a franchise"),
  electionAccess: z.array(z.string()).min(1, "Please select at least one election")
});

type FranchiseAdminFormValues = z.infer<typeof franchiseAdminSchema>;
type ElectionAdminFormValues = z.infer<typeof electionAdminSchema>;

export default function Admins() {
  const [createFranchiseAdminOpen, setCreateFranchiseAdminOpen] = useState(false);
  const [createElectionAdminOpen, setCreateElectionAdminOpen] = useState(false);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("");
  const { toast } = useToast();
  
  // Get user data from localStorage to check permissions
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const userRole = userData?.role || '';
  const userFranchiseId = userData?.franchiseId || '';
  
  // --- Fetch data ---
  
  // Fetch franchises
  const { 
    data: franchises, 
    isLoading: franchisesLoading,
    isError: franchisesError
  } = useQuery({
    queryKey: ['/api/franchises']
  });
  
  // Fetch franchise admins
  const {
    data: franchiseAdmins,
    isLoading: franchiseAdminsLoading,
    isError: franchiseAdminsError
  } = useQuery({
    queryKey: ['/api/users/franchise-admins']
  });
  
  // Fetch elections (for election admin creation)
  const {
    data: elections,
    isLoading: electionsLoading,
    isError: electionsError
  } = useQuery({
    queryKey: ['/api/elections'],
    enabled: true // Always fetch elections, we'll filter them in the component
  });
  
  // --- Form handling ---
  
  // Franchise admin form
  const franchiseAdminForm = useForm<FranchiseAdminFormValues>({
    resolver: zodResolver(franchiseAdminSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
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
      email: "",
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
        description: "Franchise administrator has been created successfully"
      });
      setCreateFranchiseAdminOpen(false);
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
        description: "Election administrator has been created successfully"
      });
      setCreateElectionAdminOpen(false);
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
        description: "Administrator password has been reset successfully"
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
    document.title = "Administrators | ElectManager";
  }, []);
  
  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administrators</h1>
          <p className="text-sm text-gray-600">Manage system administrators</p>
        </div>
      </div>
      
      <Tabs defaultValue={userRole === 'super_admin' ? "franchiseAdmins" : "electionAdmins"}>
        <TabsList>
          {/* Only super admins can see the franchise administrators tab */}
          {userRole === 'super_admin' && (
            <TabsTrigger value="franchiseAdmins">Franchise Administrators</TabsTrigger>
          )}
          <TabsTrigger value="electionAdmins">Election Administrators</TabsTrigger>
        </TabsList>
        
        {/* Franchise Administrators Tab */}
        <TabsContent value="franchiseAdmins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Franchise Administrators</CardTitle>
                <CardDescription>
                  Manage administrators who can control franchises
                </CardDescription>
              </div>
              
              {userRole !== 'franchise_admin' && (
                <Dialog open={createFranchiseAdminOpen} onOpenChange={setCreateFranchiseAdminOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Franchise Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Franchise Administrator</DialogTitle>
                      <DialogDescription>
                        Add a new administrator for a franchise
                      </DialogDescription>
                    </DialogHeader>
                    
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
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
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
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a franchise" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {franchises?.data?.map((franchise) => (
                                    <SelectItem 
                                      key={franchise._id || `franchise-${franchise.id}`} 
                                      value={franchise._id || franchise.id?.toString()}
                                    >
                                      {franchise.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createFranchiseAdminMutation.isPending}
                          >
                            {createFranchiseAdminMutation.isPending ? "Creating..." : "Create Admin"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Franchise</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {franchiseAdmins && franchiseAdmins.data && franchiseAdmins.data.length > 0 ? (
                      franchiseAdmins.data.map((admin) => (
                        <TableRow key={admin._id}>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>{admin.fullName || '-'}</TableCell>
                          <TableCell>{admin.email || '-'}</TableCell>
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No franchise administrators found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Election Administrators Tab */}
        <TabsContent value="electionAdmins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Election Administrators</CardTitle>
                <CardDescription>
                  Manage administrators who can control specific elections
                </CardDescription>
              </div>
              <Dialog open={createElectionAdminOpen} onOpenChange={setCreateElectionAdminOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Election Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create Election Administrator</DialogTitle>
                    <DialogDescription>
                      Add a new administrator for specific elections
                    </DialogDescription>
                  </DialogHeader>
                  
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
                        
                        <FormField
                          control={electionAdminForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
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
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a franchise" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {franchises?.data?.map((franchise) => (
                                    <SelectItem 
                                      key={franchise._id || `franchise-${franchise.id}`} 
                                      value={franchise._id || franchise.id?.toString()}
                                    >
                                      {franchise.name}
                                    </SelectItem>
                                  ))}
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
                                ) : elections && elections.data && elections.data.length > 0 ? (
                                  elections.data
                                    .filter(election => {
                                      // For franchise admin, ensure we're comparing MongoDB ObjectIDs correctly
                                      const electionFranchiseId = 
                                        typeof election.franchiseId === 'object' && election.franchiseId?._id 
                                          ? election.franchiseId._id.toString() 
                                          : (typeof election.franchiseId === 'object' 
                                              ? election.franchiseId.toString() 
                                              : String(election.franchiseId));
                                      
                                      // Debug to console to see what's happening
                                      console.log('Comparing:', {
                                        electionFranchiseId,
                                        selectedFranchiseId,
                                        match: electionFranchiseId === selectedFranchiseId
                                      });
                                      
                                      return electionFranchiseId === selectedFranchiseId;
                                    })
                                    .map(election => (
                                      <div key={election._id || election.id} className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id={`election-${election._id || election.id}`}
                                          value={election._id || election.id}
                                          checked={field.value.includes(election._id || election.id)}
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
                                        <label htmlFor={`election-${election._id}`} className="text-sm font-medium text-gray-700">
                                          {election.title} - {election.organization}
                                        </label>
                                      </div>
                                    ))
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
                        <Button 
                          type="submit" 
                          disabled={createElectionAdminMutation.isPending}
                        >
                          {createElectionAdminMutation.isPending ? "Creating..." : "Create Admin"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}