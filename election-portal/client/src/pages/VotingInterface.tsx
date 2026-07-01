import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { BallotForm } from "@/components/voting/BallotForm";
import { VoteConfirmation } from "@/components/voting/VoteConfirmation";
import { Card, CardContent } from "@/components/ui/card";
import { getElectionWithDetails } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function VotingInterface() {
  const { electionId } = useParams<{ electionId: string }>();
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const { toast } = useToast();
  
  // Fetch election data
  const { data: electionWithDetails, isLoading, error } = useQuery({
    queryKey: [`/api/elections/${electionId}/details`],
    queryFn: () => {
      if (!electionId) throw new Error("Election ID is required");
      const data = getElectionWithDetails(parseInt(electionId));
      if (!data) throw new Error("Election not found");
      return data;
    }
  });

  const handleSubmitVote = (selectedNomineeIds: number[]) => {
    // In a real app, we would submit the vote to the server
    console.log("Submitting vote:", selectedNomineeIds);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully!",
      });
      setVoteSubmitted(true);
    }, 1000);
  };

  const handleReturnToDashboard = () => {
    // In a real app, this would navigate to the voter dashboard
    window.location.href = "/";
  };

  useEffect(() => {
    document.title = electionWithDetails
      ? `Vote: ${electionWithDetails.title} | Vote+`
      : "Voting | Vote+";
  }, [electionWithDetails]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <p>Loading election details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !electionWithDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p>
              {error instanceof Error 
                ? error.message 
                : "Unable to load election details. Please try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {voteSubmitted ? (
          <VoteConfirmation onReturn={handleReturnToDashboard} />
        ) : (
          <BallotForm
            election={electionWithDetails}
            nominees={electionWithDetails.nominees || []}
            onSubmit={handleSubmitVote}
          />
        )}
      </div>
    </div>
  );
}
