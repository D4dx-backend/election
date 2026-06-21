import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import VoterLayout from '@/components/layouts/VoterLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CheckCircle, 
  Vote as VoteIcon, 
  ArrowLeft, 
  Calendar,
  Info,
  User,
  Shield,
  ThumbsUp,
  ChevronRight,
  Users
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Step enum for voting process
enum VotingStep {
  SELECT = 'select',
  REVIEW = 'review',
  CONFIRMED = 'confirmed'
}

export default function VotingBallot() {
  const { electionId } = useParams();
  const [, navigate] = useLocation();
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
  const [votingStep, setVotingStep] = useState<VotingStep>(VotingStep.SELECT);
  const [selectedMaleCount, setSelectedMaleCount] = useState(0);
  const [selectedFemaleCount, setSelectedFemaleCount] = useState(0);

  // Get election details
  const { 
    data: electionData, 
    isLoading: isLoadingElection,
    isError: isElectionError 
  } = useQuery({
    queryKey: [`/api/elections/${electionId}`],
    enabled: !!electionId,
  });

  // Get nominees for this election
  const { 
    data: nomineesData, 
    isLoading: isLoadingNominees,
    isError: isNomineesError 
  } = useQuery({
    queryKey: [`/api/nominees/election/${electionId}`],
    enabled: !!electionId,
  });

  // Check if user has already voted in this election
  const { 
    data: voterStatusData
  } = useQuery({
    queryKey: ['/api/vote/voter-status'],
    enabled: !!electionId,
  });

  // Extract and process election data.
  // The default query function unwraps `responseData.data`, so `electionData`
  // is usually already the election object. Handle the unwrapped object, an
  // array, and the full { data } object shapes defensively.
  const election: any = Array.isArray(electionData)
    ? (electionData.length > 0 ? electionData[0] : null)
    : (electionData && typeof electionData === 'object' && 'data' in electionData
        ? (electionData as any).data
        : (electionData || null));

  // Extract nominees from API response
  // The default query function unwraps `responseData.data`, so `nomineesData`
  // is usually already the array. Handle both the unwrapped array and the
  // full { success, data } object shapes defensively.
  let nominees: any[] = [];

  if (Array.isArray(nomineesData)) {
    nominees = nomineesData;
  } else if (nomineesData && typeof nomineesData === 'object' && Array.isArray((nomineesData as any).data)) {
    nominees = (nomineesData as any).data;
  }

  if (nominees.length) {
    console.log('Nominees loaded from API:', nominees.length);
  }
  
  // Log election settings for validation
  console.log('Election settings:', election);
  console.log('Gender requirements:', election?.femaleMinimum, 'female minimum,', election?.maleMinimum, 'male minimum');

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Cast vote mutation
  const castVoteMutation = useMutation({
    mutationFn: async (nomineeIds: string[]) => {
      const response = await fetch(`/api/vote/cast/${electionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ nomineeIds })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cast vote');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate voter status query
      queryClient.invalidateQueries({ queryKey: ['/api/vote/voter-status'] });
      
      // Move to confirmed step
      setVotingStep(VotingStep.CONFIRMED);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your vote. Please try again.",
        variant: "destructive"
      });
      // Go back to selection step
      setVotingStep(VotingStep.SELECT);
    }
  });

  // Check if user has already voted
  useEffect(() => {
    if (voterStatusData && 
        typeof voterStatusData === 'object' && 
        'data' in voterStatusData && 
        voterStatusData.data && 
        electionId && 
        Object.keys(voterStatusData.data).includes(electionId)) {
      // User has already voted, redirect to voting page
      navigate('/');
    }
  }, [voterStatusData, electionId, navigate]);

  // Update gender counts when selections change
  useEffect(() => {
    let maleCount = 0;
    let femaleCount = 0;
    
    selectedNominees.forEach(id => {
      const nominee = nominees.find((n: any) => n._id === id);
      if (nominee) {
        if (nominee.gender === 'female') {
          femaleCount++;
        } else {
          maleCount++;
        }
      }
    });
    
    setSelectedMaleCount(maleCount);
    setSelectedFemaleCount(femaleCount);
  }, [selectedNominees, nominees]);

  // Handle checkbox change
  const handleNomineeSelection = (nomineeId: string, gender: string) => {
    if (selectedNominees.includes(nomineeId)) {
      // If already selected, remove from selection
      setSelectedNominees(selectedNominees.filter(id => id !== nomineeId));
    } else {
      // If not selected, check if we've reached the maximum allowed
      if (election && selectedNominees.length < election.numberToBeElected) {
        setSelectedNominees([...selectedNominees, nomineeId]);
      } else {
        // Maximum selection reached
        toast({
          title: "Maximum Selections Reached",
          description: `You can only select ${election?.numberToBeElected} nominee(s)`,
          variant: "default"
        });
      }
    }
  };

  // Validate selections before submitting
  const validateSelections = () => {
    if (!election) return false;
    
    // Check if the correct number of nominees are selected
    if (selectedNominees.length !== election.numberToBeElected) {
      toast({
        title: "Selection Required",
        description: `Please select exactly ${election.numberToBeElected} nominee(s)`,
        variant: "destructive"
      });
      return false;
    }

    // Enforce gender minimums only when the election uses gender-based selection.
    if (election.genderBasedSelection) {
      if ((election.maleMinimum || 0) > 0 && selectedMaleCount < election.maleMinimum) {
        toast({
          title: "Gender Requirement",
          description: `Please select at least ${election.maleMinimum} male nominee(s)`,
          variant: "destructive"
        });
        return false;
      }
      if ((election.femaleMinimum || 0) > 0 && selectedFemaleCount < election.femaleMinimum) {
        toast({
          title: "Gender Requirement",
          description: `Please select at least ${election.femaleMinimum} female nominee(s)`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  // Move to review step
  const handleReviewVote = () => {
    if (!election) return;
    
    // Validate selections before proceeding
    if (!validateSelections()) {
      return;
    }
    
    // Move to review step
    setVotingStep(VotingStep.REVIEW);
  };

  // Submit vote after review
  const handleSubmitVote = () => {
    castVoteMutation.mutate(selectedNominees);
  };

  // Calculate progress percentage based on selected nominees
  const calculateProgress = () => {
    if (!election) return 0;
    return (selectedNominees.length / election.numberToBeElected) * 100;
  };

  // Get selected nominees details
  const getSelectedNominees = () => {
    return selectedNominees.map(id => {
      return nominees.find((n: any) => n._id === id);
    }).filter(Boolean);
  };

  // Loading state
  if (isLoadingElection || isLoadingNominees) {
    return (
      <VoterLayout title="Loading Ballot...">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
          <Skeleton className="h-10 w-24 mb-4" />
          <Skeleton className="h-20 w-full mb-4 rounded-md" />
          <Skeleton className="h-16 w-full mb-4 rounded-md" />
          
          <div className="space-y-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full p-4 border rounded-md">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
          
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </VoterLayout>
    );
  }

  // Error handling
  if (isElectionError || isNomineesError) {
    return (
      <VoterLayout title="Error">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
          <Button variant="outline" size="sm" onClick={() => navigate('/voting')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
          
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem loading the election data. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </VoterLayout>
    );
  }

  // Render success state when vote is confirmed
  if (votingStep === VotingStep.CONFIRMED && election) {
    return (
      <VoterLayout title="Vote Submitted">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
          <Button variant="outline" size="sm" onClick={() => navigate('/voting')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
          
          <Card className="w-full mb-6 border-l-4 border-l-green-500">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-1">{election.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{election.organization}</p>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatDate(election.electionDate)}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vote Submitted</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Thank you for participating in this election. Your vote has been successfully recorded.
            </p>
            
            <div className="flex flex-col gap-4 max-w-md mx-auto mb-8">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex items-start">
                <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-medium text-green-800 dark:text-green-300">Voting Complete</h3>
                  <p className="text-sm text-green-700 dark:text-green-400">Your vote has been securely recorded in the system.</p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                <div className="text-left">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300">Election Privacy Notice</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">To maintain the integrity of the election, individual vote details are kept confidential.</p>
                </div>
              </div>
            </div>
            
            <Button onClick={() => navigate('/')} size="lg" className="w-full sm:w-auto">
              Return to Elections
            </Button>
          </div>
        </div>
      </VoterLayout>
    );
  }

  // Render selection review step
  if (votingStep === VotingStep.REVIEW && election) {
    const selectedNomineesList = getSelectedNominees();
    
    return (
      <VoterLayout title="Review Your Vote">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setVotingStep(VotingStep.SELECT)} 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Selection
          </Button>
          
          <Card className="w-full mb-4 border-l-4 border-l-blue-500">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-1">{election.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{election.organization}</p>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatDate(election.electionDate)}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              <h2 className="font-medium text-blue-800 dark:text-blue-300">Review Your Selections</h2>
            </div>
            <p className="text-sm mt-1 text-blue-700 dark:text-blue-400 ml-7">
              Please review your selections carefully. Once submitted, your vote cannot be changed.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-3">Your Selected Nominees</h3>
            <div className="space-y-3">
              {selectedNomineesList.map((nominee: any) => (
                <Card key={nominee._id} className="w-full">
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="font-medium">{nominee.name}</h3>
                        </div>
                        {nominee.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{nominee.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => setVotingStep(VotingStep.SELECT)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Selections
            </Button>
            <Button 
              onClick={handleSubmitVote} 
              disabled={castVoteMutation.isPending}
              className="flex-1"
            >
              {castVoteMutation.isPending ? 'Submitting...' : 'Submit Your Vote'}
              {!castVoteMutation.isPending && <CheckCircle className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </VoterLayout>
    );
  }

  // Render selection step (default)
  return (
    <VoterLayout title="Cast Your Vote">
      <div className="container mx-auto px-4 sm:px-6 py-4 max-w-3xl">
        <Button variant="outline" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
        
        {election && (
          <>
            <Card className="w-full mb-4 border-l-4 border-l-blue-500">
              {election.logo?.url && (
                <img
                  src={election.logo.url}
                  alt={election.logo.alt || election.title}
                  className="w-full max-h-48 object-contain bg-gray-50 rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h1 className="text-xl font-bold mb-1">{election.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{election.organization}</p>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {formatDate(election.electionDate)}
                  </span>
                </div>
              </div>
            </Card>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-muted">
              <div className="flex items-start">
                <VoteIcon className="h-5 w-5 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="font-medium">Voting Instructions</h2>
                  <p className="text-sm text-muted-foreground">
                    Select exactly {election.numberToBeElected} nominee{election.numberToBeElected !== 1 ? 's' : ''} by tapping the checkbox next to their name.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="mb-2">
                <h2 className="text-lg font-semibold">Your Selections</h2>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-1">
                  <div className="flex items-center font-medium text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    Total: {selectedNominees.length}/{election.numberToBeElected}
                  </div>
                  {election.genderBasedSelection && ((election.maleMinimum || 0) > 0 || (election.femaleMinimum || 0) > 0) && (
                    <div className="flex items-center gap-3 text-sm">
                      {(election.maleMinimum || 0) > 0 && (
                        <span className={selectedMaleCount >= election.maleMinimum ? 'text-green-600' : 'text-muted-foreground'}>
                          Male: {selectedMaleCount}/{election.maleMinimum} min
                        </span>
                      )}
                      {(election.femaleMinimum || 0) > 0 && (
                        <span className={selectedFemaleCount >= election.femaleMinimum ? 'text-green-600' : 'text-muted-foreground'}>
                          Female: {selectedFemaleCount}/{election.femaleMinimum} min
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </div>
          </>
        )}
        
        {nominees.length > 0 ? (
          <div className="space-y-3 mb-6">
            {nominees.map((nominee: any) => (
              <Card 
                key={nominee._id} 
                className={`w-full border-2 transition-all ${
                  selectedNominees.includes(nominee._id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent hover:border-muted'
                }`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handleNomineeSelection(nominee._id, nominee.gender)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{nominee.name}</h3>
                          {election?.genderBasedSelection && nominee.gender && (
                            <Badge variant="outline" className="capitalize text-xs">
                              {nominee.gender}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {nominee.description || nominee.bio || 'No description provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Checkbox
                        id={`nominee-${nominee._id}`}
                        checked={selectedNominees.includes(nominee._id)}
                        className="h-5 w-5"
                        aria-label={`Select ${nominee.name}`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full p-8 text-center">
            <div className="mb-4">
              <AlertCircle className="h-10 w-10 text-orange-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Nominees Available</h3>
            <p className="text-muted-foreground mb-4">
              There are currently no nominees available for this election. Please check back later or contact the administrator.
            </p>
            <Button variant="outline" onClick={() => navigate('/voting')}>
              Return to Elections
            </Button>
          </Card>
        )}
        
        {nominees.length > 0 && (
          <Button 
            onClick={handleReviewVote} 
            className="w-full py-6 sticky bottom-4 shadow-lg"
            size="lg"
            disabled={!election || selectedNominees.length !== election.numberToBeElected}
          >
            Review Your Selections
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </VoterLayout>
  );
}