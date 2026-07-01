import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { ElectionForm } from "@/components/elections/ElectionForm";
import { useToast } from "@/hooks/use-toast";
import { getElectionLabel, isElectionLocked } from "@/lib/electionHelpers";

export default function EditElection() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: election, isLoading: isElectionLoading } = useQuery({
    queryKey: [`/api/elections/${id}`],
  });

  const handleSubmit = async (formData: Record<string, unknown>) => {
    try {
      const { logoFile, ...submitData } = formData;

      if (logoFile instanceof File) {
        const body = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) body.append(key, String(value));
        });
        body.append("logo", logoFile);
        const res = await fetch(`/api/elections/${id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
          body,
        });
        if (!res.ok) throw new Error("Failed to update election");
      } else {
        const res = await fetch(`/api/elections/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(submitData),
        });
        if (!res.ok) throw new Error("Failed to update election");
      }

      toast({
        title: "Election updated",
        description: "The election has been successfully updated.",
        variant: "success",
      });

      navigate("/elections");
    } catch (error) {
      console.error("Error updating election:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the election. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => navigate("/elections");

  useEffect(() => {
    document.title = election
      ? `Edit ${getElectionLabel(election)} | Vote+`
      : "Edit Election | Vote+";
  }, [election]);

  useEffect(() => {
    if (!election || isElectionLoading) return;
    const status = election.status ?? election.data?.status;
    if (isElectionLocked(status)) {
      toast({
        title: "Election is locked",
        description: "Completed elections cannot be edited. View results instead.",
        variant: "destructive",
      });
      navigate(`/elections/${id}?tab=results`);
    }
  }, [election, id, isElectionLoading, navigate, toast]);

  if (isElectionLoading) {
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

  const electionData = (election as { data?: typeof election }).data ?? election;
  if (isElectionLocked(electionData.status)) {
    return null;
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Election</h1>
        <p className="text-sm text-gray-600">{getElectionLabel(election)}</p>
      </div>

      <ElectionForm initialValues={electionData} onSubmit={handleSubmit} onCancel={handleCancel} />
    </MainLayout>
  );
}
