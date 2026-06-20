import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import VoterLayout from '@/components/layouts/VoterLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Users, 
  ArrowLeft,
  Info,
  FileCheck
} from 'lucide-react';

export default function VotingResults() {
  const { electionId } = useParams();
  const [, navigate] = useLocation();

  // Get election details
  const { 
    data: electionData, 
    isLoading: isLoadingElection,
    isError: isElectionError 
  } = useQuery({
    queryKey: ['/api/elections', electionId],
    enabled: !!electionId,
  });

  // Get user's vote for this election
  const { 
    data: voteData, 
    isLoading: isLoadingVote,
    isError: isVoteError 
  } = useQuery({
    queryKey: ['/api/vote/my-vote', electionId],
    enabled: !!electionId,
  });

  // Redirect if user hasn't voted yet
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    if (voteData && !voteData.success && voteData.message === 'No vote found for this election') {
      navigate(`/election/${electionId}`);
    }
  }, [voteData, electionId, navigate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format timestamp for display
  const formatTimestamp = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
  if (isLoadingElection || isLoadingVote) {
    return (
      <VoterLayout title="Loading Results...">
        <div className="container mx-auto p-6">
          <div className="flex items-center mb-6">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Elections
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-full mb-3" />
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-5 w-1/2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-full mb-3" />
              <Skeleton className="h-5 w-full mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </VoterLayout>
    );
  }

  // Error handling
  if (isElectionError || isVoteError) {
    return (
      <VoterLayout title="Error">
        <div className="container mx-auto p-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/voting')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your vote information. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </VoterLayout>
    );
  }

  // If user hasn't voted
  if (!voteData?.success) {
    return (
      <VoterLayout title="No Vote Found">
        <div className="container mx-auto p-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/voting')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Vote Found</AlertTitle>
            <AlertDescription>
              You haven't voted in this election yet. Please go to the voting page to cast your vote.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Button onClick={() => navigate(`/election/${electionId}`)}>
              Go to Voting Page
            </Button>
          </div>
        </div>
      </VoterLayout>
    );
  }

  const election = electionData?.data;
  const vote = voteData?.data;
  const nominees = vote?.nominees || [];

  return (
    <VoterLayout title="Vote Results">
      <div className="container mx-auto p-4">
        {/* Back button */}
        <Button variant="outline" size="sm" onClick={() => navigate('/voting')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {/* Election Info */}
        <Card className="w-full mb-4 border-l-4 border-l-blue-500">
          <div className="p-4">
            <h1 className="text-xl font-bold mb-1">{election?.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{election?.organization}</p>
            
            <div className="flex flex-wrap gap-y-2 text-sm">
              <div className="flex items-center mr-4">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatDate(election?.electionDate)}
                </span>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Vote Confirmation */}
        <Card className="w-full mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
          <div className="p-4">
            <div className="flex items-center mb-2">
              <FileCheck className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-bold text-green-600">Vote Confirmed</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Submitted on {formatTimestamp(vote?.timestamp)}
            </p>
            
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Vote Privacy</AlertTitle>
              <AlertDescription className="text-sm">
                Your vote is confidential. Only you can see the nominees you selected.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
        
        {/* Nominees Selected */}
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-3">You voted for:</h3>
          <div className="space-y-3">
            {nominees.map((nominee: any) => (
              <Card key={nominee._id} className="w-full border-l-4 border-l-green-500">
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <h4 className="font-bold">{nominee.name}</h4>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      nominee.gender === 'male' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                        : nominee.gender === 'female' 
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    }`}>
                      {nominee.gender}
                    </span>
                  </div>
                  
                  {nominee.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {nominee.bio}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Thank You Message */}
        <Card className="w-full mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Thank You For Voting</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your participation in this election is important and valued.
            </p>
          </div>
        </Card>
        
        {/* Return to Elections */}
        <Button 
          onClick={() => navigate('/')} 
          className="w-full h-12"
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to All Elections
        </Button>
      </div>
    </VoterLayout>
  );
}