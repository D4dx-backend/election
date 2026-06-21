import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultsTable } from "@/components/analytics/ResultsTable";
import { VotingStats } from "@/components/analytics/VotingStats";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateElectionResultPdf } from "@/lib/resultPdf";
import { Download, Printer } from "lucide-react";

export default function Analytics({ embedded = false, electionId }: { embedded?: boolean; electionId?: string } = {}) {
  const [selectedElectionId, setSelectedElectionId] = useState<string>(electionId || "");
  const [resultAction, setResultAction] = useState<"print" | "export" | null>(null);
  const [preparedBy, setPreparedBy] = useState("");
  const { toast } = useToast();

  // Fetch elections for the selector (real data)
  const { data: electionsResponse } = useQuery({
    queryKey: ['/api/elections'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/elections');
      return res.json();
    },
  });
  const elections = Array.isArray(electionsResponse?.data) ? electionsResponse.data : [];

  // Fetch real election results (vote tally per nominee)
  const { data: resultsResponse, isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/vote/results', selectedElectionId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/vote/results/${selectedElectionId}`);
      return res.json();
    },
    enabled: !!selectedElectionId,
  });

  const results = resultsResponse?.data || null;
  const nomineesWithVotes = results?.nominees || [];
  const selectedElection = results?.election || elections.find((e: any) => e._id === selectedElectionId);
  const analytics = results
    ? { totalVoters: results.eligibleVoters || 0, totalVotesCast: results.totalBallots || 0 }
    : null;
  const analyticsLoading = resultsLoading;
  const nomineesLoading = resultsLoading;

  const handleLoadResults = () => {
    if (selectedElectionId) {
      toast({
        title: "Results loaded",
        description: `Loaded results for the selected election`,
      });
    } else {
      toast({
        title: "No election selected",
        description: "Please select an election to load results",
        variant: "destructive",
      });
    }
  };

  const openResultAction = (action: "print" | "export") => {
    if (!results || !selectedElection) {
      toast({
        title: "No results loaded",
        description: "Please load an election result first.",
        variant: "destructive",
      });
      return;
    }
    setResultAction(action);
  };

  const handleGenerateResultDocument = async () => {
    if (!resultAction || !results || !selectedElection) return;
    try {
      await generateElectionResultPdf({
        electionTitle: selectedElection.title,
        organization: selectedElection.organization,
        electionDate: selectedElection.electionDate,
        results,
        numberToBeElected: selectedElection.numberToBeElected || 1,
        genderBasedSelection: !!selectedElection.genderBasedSelection,
        preparedBy,
        mode: resultAction === "print" ? "print" : "download",
      });
      toast({
        title: resultAction === "print" ? "Result ready to print" : "Result PDF exported",
        description: resultAction === "print" ? "The printable result opened in a new tab." : "The election result has been downloaded.",
        variant: "success",
      });
      setResultAction(null);
    } catch (err: any) {
      toast({
        title: "Failed to generate result",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = () => {
    toast({
      title: "Feature not implemented",
      description: "Send reminder functionality would be implemented here",
    });
  };

  useEffect(() => {
    if (!embedded) document.title = "Analytics | Vote+";
  }, [embedded]);

  const Wrapper = embedded ? Fragment : MainLayout;

  return (
    <Wrapper>
      {!embedded && (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Election Analytics</h1>
        <p className="text-sm text-gray-600">Detailed results and voting statistics</p>
      </div>
      )}

      {!embedded && (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="election-select">Select Election</Label>
              <Select 
                value={selectedElectionId} 
                onValueChange={setSelectedElectionId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections?.map((election: any) => (
                    <SelectItem key={election._id} value={election._id}>
                      {election.title} - {election.organization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full" 
                onClick={handleLoadResults}
                disabled={!selectedElectionId}
              >
                Load Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {selectedElectionId && analytics && !analyticsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {nomineesWithVotes && selectedElection && !nomineesLoading && (
              <ResultsTable
                nominees={nomineesWithVotes}
                numberToBeElected={selectedElection.numberToBeElected}
                onPrint={() => openResultAction("print")}
                onExport={() => openResultAction("export")}
              />
            )}
          </div>
          <div>
            <VotingStats
              analytics={analytics as any}
              electionsStartDate={selectedElection?.createdAt ? new Date(selectedElection.createdAt) : undefined}
              electionsEndDate={new Date(selectedElection?.electionDate || new Date())}
              onSendReminder={handleSendReminder}
            />
          </div>
        </div>
      )}

      {selectedElectionId && (!analytics || analyticsLoading) && (
        <div className="text-center py-8">
          <p>Loading analytics data...</p>
        </div>
      )}

      {!selectedElectionId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Election Selected</h3>
          <p className="text-gray-500 mb-4">Please select an election to view analytics</p>
        </div>
      )}

      <Dialog open={!!resultAction} onOpenChange={(open) => !open && setResultAction(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultAction === "print" ? (
                <Printer className="h-5 w-5 text-primary" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
              {resultAction === "print" ? "Print Election Result" : "Export Election Result"}
            </DialogTitle>
            <DialogDescription>
              Generates the same standard A4 result sheet with election details and the Vote+ logo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="analyticsPreparedBy">Prepared by / Returning Officer (optional)</Label>
              <Input
                id="analyticsPreparedBy"
                placeholder="e.g. John Mathew"
                value={preparedBy}
                onChange={(event) => setPreparedBy(event.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This name appears above the signature line on the printed/exported sheet.
              </p>
            </div>
            <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
              {results?.nominees?.length || 0} nominees · {results?.totalBallots ?? 0} votes · {results?.turnout ?? 0}% turnout
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultAction(null)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateResultDocument}>
              {resultAction === "print" ? (
                <Printer className="h-4 w-4 mr-1.5" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              {resultAction === "print" ? "Print" : "Export PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
