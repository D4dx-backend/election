import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PlusIcon, Pencil, Trash2, AlertCircle, FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { NomineeForm } from "@/components/nominees/NomineeForm";

export default function Nominees() {
  const [selectedElectionId, setSelectedElectionId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deleteNomineeId, setDeleteNomineeId] = useState<string | null>(null);
  const [isAddNomineeOpen, setIsAddNomineeOpen] = useState(false);
  const [isEditNomineeOpen, setIsEditNomineeOpen] = useState(false);
  const [currentNominee, setCurrentNominee] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch nominees data
  const { 
    data: nomineesData, 
    isLoading: nomineesLoading,
    isError: nomineesError,
    refetch: refetchNominees
  } = useQuery({
    queryKey: ['/api/nominees', selectedElectionId],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Authentication token not found');
        
        const queryString = selectedElectionId && selectedElectionId !== 'all' 
          ? `?electionId=${selectedElectionId}` 
          : '';
          
        const response = await fetch(`/api/nominees${queryString}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch nominees');
        
        const data = await response.json();
        console.log("Nominees API Response:", data);
        return data;
      } catch (error) {
        console.error("Error fetching nominees:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 5000 // Consider data fresh for 5 seconds
  });
  
  // Fetch elections data
  const { 
    data: electionsData, 
    isLoading: electionsLoading,
    isError: electionsError 
  } = useQuery({
    queryKey: ['/api/elections'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Authentication token not found');
        
        const response = await fetch('/api/elections', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch elections');
        
        const data = await response.json();
        console.log("Elections API Response:", data);
        return data;
      } catch (error) {
        console.error("Error fetching elections:", error);
        throw error;
      }
    },
    staleTime: 5000 // Consider data fresh for 5 seconds
  });
  
  // Delete nominee mutation
  const { mutate: deleteNominee, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/nominees/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Nominee Deleted",
        description: "Nominee has been deleted successfully"
      });
      setDeleteNomineeId(null);
      refetchNominees();
      queryClient.invalidateQueries({ queryKey: ['/api/nominees'] });
    },
    onError: (error) => {
      console.error('Error deleting nominee:', error);
      toast({
        title: "Error",
        description: "Failed to delete nominee",
        variant: "destructive"
      });
    }
  });

  // Handle election selection change
  const handleElectionChange = (value: string) => {
    setSelectedElectionId(value);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle edit nominee
  const handleEditNominee = (nominee: any) => {
    setCurrentNominee(nominee);
    setIsEditNomineeOpen(true);
  };
  
  // Handle delete nominee
  const handleDeleteClick = (id: string) => {
    setDeleteNomineeId(id);
  };
  
  // Confirm delete nominee
  const confirmDelete = () => {
    if (deleteNomineeId) {
      deleteNominee(deleteNomineeId);
    }
  };
  
  // Extract nominees and elections from responses - accessing the right data property
  const nominees = nomineesData?.data || [];
  const elections = electionsData?.data || [];
  
  // Log data structure to debug
  console.log("Nominees data type:", nominees && Array.isArray(nominees));
  console.log("Elections data type:", elections && Array.isArray(elections));
  
  // Log the data structure for debugging
  console.log("Election response:", electionsData);
  console.log("Nominee response:", nomineesData);
  
  console.log('Nominees data from API:', nominees);
  
  // Filter nominees based on search term
  const filteredNominees = nominees.filter((nominee: any) => 
    searchTerm === "" || 
    (nominee.name && nominee.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filter nominees based on selected election
  // When "all" is selected, we'll only show nominees from the user's franchise elections
  // When a specific election is selected, we'll only show nominees from that election
  const displayNominees = selectedElectionId === 'all' 
    ? filteredNominees.filter((nominee: any) => {
        // For "all" selection, only show nominees from elections in the user's franchise
        const nomineeElectionId = nominee.electionId?._id?.toString() || 
                                nominee.electionId?.toString() || 
                                nominee.electionId;
        // Check if this nominee's election is in the list of elections for this user's franchise
        return elections.some((e: any) => {
          const electionId = e._id?.toString() || e.id?.toString();
          return electionId === nomineeElectionId;
        });
      })
    : filteredNominees.filter((nominee: any) => {
        const nomineeElectionId = nominee.electionId?._id?.toString() || 
                                nominee.electionId?.toString() || 
                                nominee.electionId;
        return nomineeElectionId === selectedElectionId;
      });
  
  console.log('Display nominees after filtering:', displayNominees);
  
  // Export nominee data to PDF
  const exportToPDF = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Get the title for the PDF based on selected election
      let title = "All Nominees";
      if (selectedElectionId && selectedElectionId !== 'all') {
        const election = elections.find((e: any) => {
          const electionId = e._id?.toString() || e.id?.toString();
          return electionId === selectedElectionId;
        });
        if (election) {
          title = `${election.title} Nominees`;
        }
      }
      
      // Add title to PDF
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(12);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Prepare data for table
      const tableColumn = ["Name", "Gender", "Election"];
      const tableRows = displayNominees.map((nominee: any, index: number) => {
        const election = elections.find((e: any) => {
          const electionId = e._id?.toString() || e.id?.toString();
          const nomineeElectionId = nominee.electionId?._id?.toString() || 
                                nominee.electionId?.toString() || 
                                nominee.electionId;
          return electionId === nomineeElectionId;
        });
        
        return [
          nominee.name || 'Unknown',
          nominee.gender === 'male' ? 'Male' : 'Female',
          election ? election.title : 'Unknown Election'
        ];
      });
      
      // Add table to PDF - wrap in try/catch to handle any autoTable errors
      try {
        (doc as any).autoTable({
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });
        
        // Save the PDF
        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
        
        toast({
          title: "PDF Exported",
          description: "Nominees list has been exported to PDF successfully"
        });
      } catch (tableError) {
        console.error('Error creating PDF table:', tableError);
        toast({
          title: "Export Failed",
          description: "Failed to format PDF table",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export nominees to PDF",
        variant: "destructive"
      });
    }
  };
  
  // Export nominee data to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = displayNominees.map((nominee: any) => {
        const election = elections.find((e: any) => {
          const electionId = e._id?.toString() || e.id?.toString();
          const nomineeElectionId = nominee.electionId?._id?.toString() || 
                                nominee.electionId?.toString() || 
                                nominee.electionId;
          return electionId === nomineeElectionId;
        });
        
        return {
          'Name': nominee.name || 'Unknown',
          'Gender': nominee.gender === 'male' ? 'Male' : 'Female',
          'Election': election ? election.title : 'Unknown Election'
        };
      });
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Get the title for the Excel sheet based on selected election
      let title = "All Nominees";
      if (selectedElectionId && selectedElectionId !== 'all') {
        const election = elections.find((e: any) => {
          const electionId = e._id?.toString() || e.id?.toString();
          return electionId === selectedElectionId;
        });
        if (election) {
          title = `${election.title} Nominees`;
        }
      }
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Nominees");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      
      toast({
        title: "Excel Exported",
        description: "Nominees list has been exported to Excel successfully"
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export nominees to Excel",
        variant: "destructive"
      });
    }
  };

  // Handle add nominee dialog
  const handleAddNominee = () => {
    setIsAddNomineeOpen(true);
  };

  useEffect(() => {
    document.title = "Nominees | ElectManager";
  }, []);

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nominees</h1>
          <p className="text-sm text-gray-600">Manage candidates for your elections</p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-2 flex flex-wrap gap-2">
          <Button onClick={handleAddNominee}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Nominees
          </Button>
          <Button variant="outline" onClick={exportToPDF} disabled={!displayNominees?.length}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportToExcel} disabled={!displayNominees?.length}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {electionsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load elections. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Nominees</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <Select value={selectedElectionId} onValueChange={handleElectionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Election" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {electionsLoading ? (
                  <SelectItem value="loading" disabled>Loading elections...</SelectItem>
                ) : (
                  elections.map((election: any) => (
                    <SelectItem 
                      key={election._id || election.id} 
                      value={election._id?.toString() || election.id?.toString()}>
                      {election.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Search nominees..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nominees List</CardTitle>
        </CardHeader>
        <CardContent>
          {nomineesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : nomineesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load nominees. Please try again later.
              </AlertDescription>
            </Alert>
          ) : displayNominees.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No nominees found. Add some nominees to get started.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Election</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayNominees.map((nominee: any) => {
                    // Find the associated election
                    const election = elections.find((e: any) => {
                      const electionId = e._id?.toString() || e.id?.toString();
                      const nomineeElectionId = nominee.electionId?._id?.toString() || 
                                            nominee.electionId?.toString() || 
                                            nominee.electionId;
                      return electionId === nomineeElectionId;
                    });
                    
                    return (
                      <TableRow key={nominee._id || nominee.id}>
                        <TableCell className="font-medium">{nominee.name}</TableCell>
                        <TableCell>{nominee.gender === 'male' ? 'Male' : 'Female'}</TableCell>
                        <TableCell>{election ? election.title : 'Unknown Election'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditNominee(nominee)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClick(nominee._id || nominee.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Nominee Dialog */}
      <Dialog open={isAddNomineeOpen} onOpenChange={setIsAddNomineeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Nominees</DialogTitle>
            <DialogDescription>
              Add nominees to an election. You can add multiple nominees at once.
            </DialogDescription>
          </DialogHeader>
          <NomineeForm 
            onSuccess={() => {
              setIsAddNomineeOpen(false);
              refetchNominees();
              queryClient.invalidateQueries({ queryKey: ['/api/nominees'] });
            }}
            elections={elections}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Nominee Dialog */}
      <Dialog open={isEditNomineeOpen} onOpenChange={setIsEditNomineeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Nominee</DialogTitle>
            <DialogDescription>
              Update nominee details.
            </DialogDescription>
          </DialogHeader>
          <NomineeForm 
            initialData={currentNominee}
            isEdit={true}
            elections={elections}
            onSuccess={() => {
              setIsEditNomineeOpen(false);
              refetchNominees();
              queryClient.invalidateQueries({ queryKey: ['/api/nominees'] });
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNomineeId} onOpenChange={(open) => !open && setDeleteNomineeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the nominee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}