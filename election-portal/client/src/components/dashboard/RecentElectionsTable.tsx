import { Vote, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getElectionLabel, getElectionSubtitle, isElectionEditable } from "@/lib/electionHelpers";
import { Link } from "wouter";
import { ElectionWithDetails } from "@/lib/types";

interface RecentElectionsTableProps {
  elections: ElectionWithDetails[];
}

export function RecentElectionsTable({ elections }: RecentElectionsTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="px-4 py-3 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-gray-900">Recent Elections</CardTitle>
        <Link href="/elections">
          <Button variant="link" className="text-sm font-medium text-primary hover:text-primary-dark">
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 md:hidden">
          {elections.map((election) => {
            const electionId = (election as any)._id?.toString() || (election as any).id?.toString();
            const totalVoters = election.analytics?.totalVoters || 0;
            const totalVotesCast = election.analytics?.totalVotesCast || 0;
            const participationPercentage = totalVoters > 0 
              ? Math.round((totalVotesCast / totalVoters) * 100) 
              : 0;

            return (
              <div key={electionId} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{getElectionLabel(election)}</h3>
                    {getElectionSubtitle(election) && (
                      <p className="text-sm text-gray-500 truncate">{getElectionSubtitle(election)}</p>
                    )}
                  </div>
                  <StatusBadge status={election.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-white p-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{format(new Date(election.electionDate), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participation</p>
                    <p className="font-medium text-gray-900">{participationPercentage}% ({totalVotesCast}/{totalVoters})</p>
                  </div>
                </div>
                <Progress value={participationPercentage} className="h-2.5" />
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/elections/${electionId}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {isElectionEditable(election.status) ? (
                    <Link href={`/elections/${electionId}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  ) : (
                    <Link href={`/elections/${electionId}?tab=results`}>
                      <Button variant="ghost" size="sm">Results</Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white">Election</TableHead>
                <TableHead className="bg-white">Date</TableHead>
                <TableHead className="bg-white">Status</TableHead>
                <TableHead className="bg-white">Participation</TableHead>
                <TableHead className="bg-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => {
                const electionId = (election as any)._id?.toString() || (election as any).id?.toString();
                const totalVoters = election.analytics?.totalVoters || 0;
                const totalVotesCast = election.analytics?.totalVotesCast || 0;
                const participationPercentage = totalVoters > 0 
                  ? Math.round((totalVotesCast / totalVoters) * 100) 
                  : 0;

                return (
                  <TableRow key={electionId} className="transition-colors hover:bg-primary/5">
                    <TableCell className="font-medium">
                      {getElectionLabel(election)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(election.electionDate), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={election.status} />
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress value={participationPercentage} className="h-2.5 mb-1" />
                        <div className="text-xs text-gray-600">
                          {participationPercentage}% ({totalVotesCast}/{totalVoters})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/elections/${electionId}`}>
                        <Button variant="link" className="text-primary hover:text-primary-dark mr-3">
                          View
                        </Button>
                      </Link>
                      {isElectionEditable(election.status) ? (
                        <Link href={`/elections/${electionId}/edit`}>
                          <Button variant="link" className="text-gray-600 hover:text-gray-900">
                            Edit
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/elections/${electionId}?tab=results`}>
                          <Button variant="link" className="text-gray-600 hover:text-gray-900">
                            Results
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Completed
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-primary/10">
          Draft
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-primary/10">
          {status}
        </Badge>
      );
  }
}
