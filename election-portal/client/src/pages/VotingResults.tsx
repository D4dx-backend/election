import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
    queryKey: ['/api/elections', electionId, 'single'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/elections/${electionId}`);
      return await res.json();
    },
    enabled: !!electionId,
    retry: false,
  });

  // Get user's vote for this election (404 = not voted yet, handled gracefully)
  const { 
    data: voteData, 
    isLoading: isLoadingVote,
  } = useQuery({
    queryKey: ['/api/vote/my-vote', electionId, 'single'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/vote/my-vote/${electionId}`);
        return await res.json();
      } catch {
        return { success: false };
      }
    },
    enabled: !!electionId,
    retry: false,
  });

  // Published results tally (returns 403 until an admin publishes — handled gracefully).
  const { data: publishedResp } = useQuery({
    queryKey: ['/api/vote/results', electionId, 'published'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/vote/results/${electionId}`);
        return await res.json();
      } catch {
        return null;
      }
    },
    enabled: !!electionId,
    retry: false,
  });
  const publishedResults = publishedResp?.data || null;

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
  if (isElectionError) {
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
        
        {/* Published Results */}
        {publishedResults && Array.isArray(publishedResults.nominees) && (() => {
          const mode = publishedResults.election?.voterResultDisplay || 'full';
          const showScore = mode === 'score' || mode === 'full';
          const showPercentage = mode === 'percentage' || mode === 'full';
          return (
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-bold">Election Result</h3>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            </div>

            <div className={`grid ${showScore ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-3`}>
              {showScore && (
                <Card className="text-center">
                  <div className="p-3">
                    <p className="text-lg font-bold">{publishedResults.totalBallots ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Votes Cast</p>
                  </div>
                </Card>
              )}
              <Card className="text-center">
                <div className="p-3">
                  <p className="text-lg font-bold">{publishedResults.eligibleVoters ?? 0}</p>
                  <p className="text-[11px] text-muted-foreground">Eligible</p>
                </div>
              </Card>
              <Card className="text-center">
                <div className="p-3">
                  <p className="text-lg font-bold">{publishedResults.turnout ?? 0}%</p>
                  <p className="text-[11px] text-muted-foreground">Turnout</p>
                </div>
              </Card>
            </div>

            <Card className="w-full">
              <div className="p-2">
                {[...publishedResults.nominees]
                  .sort((a: any, b: any) => ((b.voteCount ?? b.percentage ?? 0) - (a.voteCount ?? a.percentage ?? 0)))
                  .map((n: any, idx: number) => {
                    // Prefer the server-computed winner flag (honours gender
                    // quota); fall back to rank only if it's absent.
                    const elected = typeof n.isElected === 'boolean'
                      ? n.isElected
                      : idx < (publishedResults.election?.numberToBeElected || 1);
                    return (
                      <div
                        key={n._id || n.id || idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-md ${
                          elected ? 'bg-green-50 dark:bg-green-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-muted-foreground w-5 text-center">{idx + 1}</span>
                          <span className="font-medium truncate">{n.name}</span>
                          {elected && (
                            <span className="inline-flex items-center text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                              Elected
                            </span>
                          )}
                        </div>
                        {(showScore || showPercentage) && (
                          <div className="text-right shrink-0">
                            {showScore && <span className="font-bold">{n.voteCount ?? 0}</span>}
                            {showPercentage && (
                              <span className={`text-xs text-muted-foreground ${showScore ? 'ml-1' : ''}`}>
                                {showScore ? '(' : ''}{(n.percentage ?? 0).toFixed(1)}%{showScore ? ')' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Card>
          </div>
          );
        })()}
        
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