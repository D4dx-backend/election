import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { 
  mockAnalytics, 
  mockElections, 
  getNomineesWithVotes 
} from "@/lib/mockData";

export default function Analytics() {
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");
  const { toast } = useToast();
  
  // Fetch elections for the selector
  const { data: elections } = useQuery({
    queryKey: ['/api/elections'],
    queryFn: () => Promise.resolve(mockElections)
  });
  
  // Fetch analytics for the selected election
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics', selectedElectionId],
    queryFn: () => {
      if (!selectedElectionId) return null;
      const id = parseInt(selectedElectionId);
      return mockAnalytics.find(a => a.electionId === id) || null;
    },
    enabled: !!selectedElectionId
  });
  
  // Fetch nominees with vote counts for the selected election
  const { data: nomineesWithVotes, isLoading: nomineesLoading } = useQuery({
    queryKey: ['/api/nominees/votes', selectedElectionId],
    queryFn: () => {
      if (!selectedElectionId) return [];
      return getNomineesWithVotes(parseInt(selectedElectionId));
    },
    enabled: !!selectedElectionId
  });

  const selectedElection = elections?.find(
    e => e.id === (selectedElectionId ? parseInt(selectedElectionId) : 0)
  );

  const handleLoadResults = () => {
    // This is just for UX feedback - the actual loading happens via useQuery
    if (selectedElectionId) {
      toast({
        title: "Results loaded",
        description: `Loaded results for election ID: ${selectedElectionId}`,
      });
    } else {
      toast({
        title: "No election selected",
        description: "Please select an election to load results",
        variant: "destructive",
      });
    }
  };

  const handlePrintResults = () => {
    toast({
      title: "Feature not implemented",
      description: "Print results functionality would be implemented here",
    });
  };

  const handleExportResults = () => {
    toast({
      title: "Feature not implemented",
      description: "Export results functionality would be implemented here",
    });
  };

  const handleSendReminder = () => {
    toast({
      title: "Feature not implemented",
      description: "Send reminder functionality would be implemented here",
    });
  };

  useEffect(() => {
    document.title = "Analytics | ElectManager";
  }, []);

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Election Analytics</h1>
        <p className="text-sm text-gray-600">Detailed results and voting statistics</p>
      </div>

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
                  {elections?.map((election) => (
                    <SelectItem key={election.id} value={election.id.toString()}>
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

      {selectedElectionId && analytics && !analyticsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {nomineesWithVotes && selectedElection && !nomineesLoading && (
              <ResultsTable
                nominees={nomineesWithVotes}
                numberToBeElected={selectedElection.numberToBeElected}
                onPrint={handlePrintResults}
                onExport={handleExportResults}
              />
            )}
          </div>
          <div>
            <VotingStats
              analytics={analytics}
              electionsStartDate={selectedElection?.createdAt}
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
    </MainLayout>
  );
}
