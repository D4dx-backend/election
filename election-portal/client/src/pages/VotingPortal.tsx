import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Calendar, Users, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import VoterLayout from '@/components/layouts/VoterLayout';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function VotingPortal() {
  const [, setLocation] = useLocation();
  const [votingStatus, setVotingStatus] = useState<Record<string, string>>({});
  const [availableElections, setAvailableElections] = useState<any[]>([]);
  const { toast } = useToast();

  // Get elections for this voter
  const { 
    data: electionsData, 
    isLoading: isLoadingElections,
    isError: isElectionsError 
  } = useQuery({
    queryKey: ['/api/vote/available-elections']
  });

  // Get voter status (which elections they have already voted in)
  const { 
    data: voterStatusData, 
    isLoading: isLoadingStatus,
    isError: isStatusError 
  } = useQuery({
    queryKey: ['/api/vote/voter-status']
  });

  // Process elections data when it changes
  useEffect(() => {
    console.log("Raw elections data:", electionsData);
    
    // Handle the case where we receive an array directly
    if (Array.isArray(electionsData)) {
      setAvailableElections(electionsData);
    } 
    // Handle the case where we receive an object with data property
    else if (electionsData && typeof electionsData === 'object' && 'data' in electionsData) {
      if (Array.isArray(electionsData.data)) {
        setAvailableElections(electionsData.data);
      }
    }
  }, [electionsData]);

  // Update voting status when data changes
  useEffect(() => {
    if (voterStatusData && typeof voterStatusData === 'object') {
      // Handle case where data is nested in a data property
      if ('data' in voterStatusData && voterStatusData.data) {
        setVotingStatus(voterStatusData.data);
      }
      // Handle case where data is directly in the response
      else if (!('success' in voterStatusData)) {
        setVotingStatus(voterStatusData);
      }
    }
  }, [voterStatusData]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle click on election card
  const handleElectionClick = (electionId: string) => {
    // If user has already voted, show results
    if (votingStatus[electionId] === 'voted') {
      setLocation(`/results/${electionId}`);
      return;
    }
    // Otherwise, go to the voting ballot with the new URL structure
    setLocation(`/election/${electionId}`);
  };

  // Loading state
  if (isLoadingElections || isLoadingStatus) {
    return (
      <VoterLayout title="My Elections">
        <div className="container mx-auto p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Loading elections...</h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full">
                <div className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </VoterLayout>
    );
  }

  // Error handling
  if (isElectionsError || isStatusError) {
    return (
      <VoterLayout title="My Elections">
        <div className="container mx-auto p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Elections</AlertTitle>
            <AlertDescription>
              There was a problem loading your elections. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </VoterLayout>
    );
  }

  // Get logged in user info
  const userFullName = localStorage.getItem('userFullName') || '';
  const username = localStorage.getItem('username') || '';

  console.log("Available elections to display:", availableElections);

  return (
    <VoterLayout title="Available Elections">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Welcome, {userFullName || username}</h2>
        </div>

        {availableElections && availableElections.length > 0 ? (
          <div className="space-y-4">
            {availableElections.map((election: any) => (
              <Card 
                key={election._id} 
                className={`w-full transition-all cursor-pointer hover:shadow-md ${
                  votingStatus[election._id] === 'voted' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-green-500'
                }`}
                onClick={() => handleElectionClick(election._id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold">{election.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{election.organization}</p>
                    </div>

                    {votingStatus[election._id] === 'voted' ? (
                      <Badge className="bg-blue-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Voted
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500">Open for Voting</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-y-2 text-sm mt-4">
                    <div className="flex items-center mr-4">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(election.electionDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Select {election.numberToBeElected} position{election.numberToBeElected > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    variant={votingStatus[election._id] === 'voted' ? 'outline' : 'default'}
                  >
                    {votingStatus[election._id] === 'voted' ? 'View Results' : 'Cast Vote'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Elections Available</AlertTitle>
            <AlertDescription>
              You currently have no elections available for voting.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </VoterLayout>
  );
}