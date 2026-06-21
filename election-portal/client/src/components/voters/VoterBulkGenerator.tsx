import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { BulkVoterGenerationOptions } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VoterBulkGeneratorProps {
  elections: Array<{
    _id: string;
    title: string;
    organization: string;
  }>;
  electionGroups: Array<{
    _id: string;
    name: string;
  }>;
  onGenerate: (options: BulkVoterGenerationOptions) => void;
  isGenerating?: boolean;
  fixedElectionId?: string;
}

export function VoterBulkGenerator({ 
  elections, 
  electionGroups = [],
  onGenerate,
  isGenerating = false,
  fixedElectionId,
}: VoterBulkGeneratorProps) {
  const [prefix, setPrefix] = useState<string>("VOTE");
  const [startingNumber, setStartingNumber] = useState<number>(1001);
  const [count, setCount] = useState<number>(10); // Reduced default to avoid overloading system
  const [selectedElections, setSelectedElections] = useState<string[]>(fixedElectionId ? [fixedElectionId] : []);
  const [selectedElectionGroupId, setSelectedElectionGroupId] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"election" | "electionGroup">("election");

  useEffect(() => {
    if (fixedElectionId) {
      setAssignmentType("election");
      setSelectedElections([fixedElectionId]);
    }
  }, [fixedElectionId]);

  const handleElectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const electionId = e.target.value;
    setSelectedElections((prevSelected) => {
      if (e.target.checked) {
        return [...prevSelected, electionId];
      } else {
        return prevSelected.filter((id) => id !== electionId);
      }
    });
  };

  // Safely get election title
  const getElectionTitle = (electionId: string) => {
    const election = elections?.find(e => {
      const id = e?._id?.toString() || (e?.id ? String(e.id) : '');
      return id === electionId;
    });
    return election ? `${election.title || 'Untitled'} - ${election.organization || 'Organization'}` : 'Select an election';
  };

  // Handle election group selection
  const handleElectionGroupChange = (selectedValue: string) => {
    setSelectedElectionGroupId(selectedValue);
  };

  const handleSubmit = () => {
    if (count > 100) {
      // Show warning for large number of voters
      if (!confirm(`Are you sure you want to generate ${count} voters? This may take some time.`)) {
        return;
      }
    }

    // Prepare generation options
    const options: BulkVoterGenerationOptions = {
      prefix,
      startingNumber,
      count,
      assignmentType: assignmentType
    };

    // Add election-specific options
    if (assignmentType === 'election' && selectedElections.length > 0) {
      options.electionIds = selectedElections;
    } else if (assignmentType === 'electionGroup' && selectedElectionGroupId) {
      options.electionGroupId = selectedElectionGroupId;
    }

    onGenerate(options);
  };

  // Form validation
  const isValid = 
    prefix.trim().length > 0 && 
    startingNumber > 0 && 
    count > 0 && 
    count <= 1000 && // Reasonable limit
    (
      (assignmentType === 'election' && selectedElections.length > 0) || 
      (assignmentType === 'electionGroup' && selectedElectionGroupId !== "")
    );

  return (
    <Card className="mb-0">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Create Bulk Voters</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <Label htmlFor="prefix">Prefix</Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. VOTE"
              className="mt-1"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Will be used as username prefix
            </p>
          </div>
          <div>
            <Label htmlFor="startingNumber">Starting Number</Label>
            <Input
              id="startingNumber"
              type="number"
              value={startingNumber}
              onChange={(e) => setStartingNumber(parseInt(e.target.value) || 0)}
              min={1}
              placeholder="e.g. 1001"
              className="mt-1"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              First sequential number to use
            </p>
          </div>
          <div>
            <Label htmlFor="userCount">Number of Voters</Label>
            <Input
              id="userCount"
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
              min={1}
              max={1000}
              placeholder="e.g. 10"
              className="mt-1"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum 1000 voters at once
            </p>
          </div>
        </div>

        {!fixedElectionId && (
          <div className="mb-6">
            <Label>Assignment Type</Label>
            <Tabs 
              defaultValue="election" 
              className="mt-2" 
              onValueChange={(value) => setAssignmentType(value as 'election' | 'electionGroup')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="election">Single Election</TabsTrigger>
                <TabsTrigger value="electionGroup">Election Group</TabsTrigger>
              </TabsList>

              <TabsContent value="election" className="mt-4">
                <Label htmlFor="electionAccess">Assign to Election</Label>
                <div className="space-y-2 mt-2">
                  {elections && elections.map((election) => {
                    const id = election?._id?.toString() || 
                              (typeof election?.id === 'object' ? election.id?.toString() : 
                              (election?.id ? String(election.id) : ''));

                    if (!id) return null;
                    return (
                      <div key={id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`election-${id}`}
                          value={id}
                          checked={selectedElections.includes(id)}
                          onChange={handleElectionChange}
                          disabled={isGenerating}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`election-${id}`} className="text-sm">
                          {election?.title || 'Untitled'} - {election?.organization || 'Organization'}
                        </label>
                      </div>
                    );
                  })}
                </div>

                {selectedElections.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Voters will be assigned to {selectedElections.length} election(s)
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="electionGroup" className="mt-4">
                <Label htmlFor="electionGroupAccess">Assign to Election Group</Label>
                <Select onValueChange={handleElectionGroupChange} disabled={isGenerating}>
                  <SelectTrigger id="electionGroupAccess" className="mt-1">
                    <SelectValue placeholder="Select an election group" />
                  </SelectTrigger>
                  <SelectContent>
                    {electionGroups && electionGroups.length > 0 ? (
                      electionGroups.map((group) => {
                        // Handle both MongoDB and regular ID formats safely
                        const id = group?._id?.toString() || 
                                  (typeof group?.id === 'object' ? group.id?.toString() : 
                                  (group?.id ? String(group.id) : ''));

                        if (!id) return null;
                        return (
                          <SelectItem key={id} value={id}>
                            {group?.name || 'Untitled Group'}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="none" disabled>No election groups available</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {selectedElectionGroupId && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Voters will be assigned to all elections in this group
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}



        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Generated voter accounts will have usernames in the format 
            <code className="mx-1 px-1 bg-blue-100 rounded">{prefix}XXXX</code> 
            and passwords in the format 
            <code className="mx-1 px-1 bg-blue-100 rounded">{prefix.toLowerCase()}XXXX</code>
            where XXXX is the sequential number.
          </p>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={!isValid || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Voters'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}