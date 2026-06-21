import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { ElectionForm } from "@/components/elections/ElectionForm";
import { mockElections, mockElectionGroups } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function EditElection() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch election data from API
  const { data: election, isLoading: isElectionLoading, isError: isElectionError } = useQuery({
    queryKey: [`/api/elections/${id}`]
  });
  
  // Fetch election groups from API
  const { data: electionGroups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['/api/election-groups']
  });

  const handleSubmit = async (formData: any) => {
    try {
      // Clone the form data to avoid modifying the original
      const { logoFile, ...submitData } = formData;
      
      console.log("Updating election:", submitData);

      // Send multipart FormData when a new banner/logo is chosen, else JSON.
      if (logoFile instanceof File) {
        const body = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) body.append(key, String(value));
        });
        body.append('logo', logoFile);
        const res = await fetch(`/api/elections/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body,
        });
        if (!res.ok) throw new Error('Failed to update election');
      } else {
        await fetch(`/api/elections/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(submitData)
        }).then(res => {
          if (!res.ok) {
            throw new Error('Failed to update election');
          }
          return res.json();
        });
      }
      
      // Show success toast
      toast({
        title: "Election updated",
        description: "The election has been successfully updated.",
        variant: "success",
      });
      
      // Navigate to elections list
      navigate("/elections");
    } catch (error) {
      console.error('Error updating election:', error);
      toast({
        title: "Error",
        description: "There was a problem updating the election. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    navigate("/elections");
  };

  useEffect(() => {
    document.title = election 
      ? `Edit ${election.title} | Vote+` 
      : "Edit Election | Vote+";
  }, [election]);

  if (isElectionLoading || isGroupsLoading) {
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  }

  if (!election) {
    return (
      <MainLayout>
        <div>Election not found.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Election</h1>
        <p className="text-sm text-gray-600">{election.title} - {election.organization}</p>
      </div>

      {electionGroups && (
        <ElectionForm
          initialValues={election}
          electionGroups={electionGroups}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MainLayout>
  );
}
