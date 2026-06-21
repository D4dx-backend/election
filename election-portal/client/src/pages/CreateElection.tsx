import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { ElectionForm } from "@/components/elections/ElectionForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CreateElection() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [userRole, setUserRole] = useState<string>('');
  const [franchiseId, setFranchiseId] = useState<string>('');

  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/auth/me']
  });
  
  useEffect(() => {
    if (user) {
      // Set user role and franchise ID if available
      if (user.role) setUserRole(user.role);
      if (user.franchiseId) setFranchiseId(user.franchiseId);
    }
  }, [user]);

  // Fetch franchises (only needed for super_admin role)
  const { data: franchises, isLoading: isLoadingFranchises } = useQuery({
    queryKey: ['/api/franchises'],
    enabled: userRole === 'super_admin'
  });

  // Fetch election groups
  const { data: electionGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['/api/election-groups']
  });

  const handleSubmit = async (formData: any) => {
    try {
      // Clone the form data to avoid modifying the original
      const { logoFile, ...submitData } = formData;
      
      // If user is a franchise_admin, automatically set the franchiseId
      if (userRole === 'franchise_admin' && franchiseId) {
        submitData.franchiseId = franchiseId;
      }

      console.log("Submitting election data:", submitData);

      // When a banner/logo file is chosen, send multipart FormData so the
      // backend (multer) can store it; otherwise send plain JSON.
      let response: Response;
      if (logoFile instanceof File) {
        const body = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) body.append(key, String(value));
        });
        body.append('logo', logoFile);
        response = await fetch('/api/elections', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body,
        });
      } else {
        response = await fetch('/api/elections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(submitData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create election');
      }
      
      const result = await response.json();
      
      // Show success toast
      toast({
        title: "Election created",
        description: "The election has been successfully created.",
        variant: "success",
      });
      
      // Navigate to elections list
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      navigate("/elections");
    } catch (error) {
      console.error('Error creating election:', error);
      toast({
        title: "Error",
        description: "There was a problem creating the election. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate("/elections");
  };

  useEffect(() => {
    document.title = "Create Election | Vote+";
  }, []);

  const isLoading = isLoadingUser || isLoadingGroups || (userRole === 'super_admin' && isLoadingFranchises);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Election</h1>
        <p className="text-sm text-gray-600">Configure your election parameters</p>
      </div>

      <ElectionForm
        electionGroups={electionGroups || []}
        franchises={userRole === 'super_admin' ? franchises || [] : []}
        showFranchiseSelect={userRole === 'super_admin'}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </MainLayout>
  );
}
