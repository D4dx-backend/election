import { Vote, Users, Calendar } from "lucide-react";
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
import { format } from "date-fns";
import { Link } from "wouter";
import { ElectionWithDetails } from "@/lib/types";

interface RecentElectionsTableProps {
  elections: ElectionWithDetails[];
}

export function RecentElectionsTable({ elections }: RecentElectionsTableProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-gray-900">Recent Elections</CardTitle>
        <Link href="/elections">
          <Button variant="link" className="text-sm font-medium text-primary hover:text-primary-dark">
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-50">Election</TableHead>
                <TableHead className="bg-gray-50">Organization</TableHead>
                <TableHead className="bg-gray-50">Date</TableHead>
                <TableHead className="bg-gray-50">Status</TableHead>
                <TableHead className="bg-gray-50">Participation</TableHead>
                <TableHead className="bg-gray-50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => {
                const totalVoters = election.analytics?.totalVoters || 0;
                const totalVotesCast = election.analytics?.totalVotesCast || 0;
                const participationPercentage = totalVoters > 0 
                  ? Math.round((totalVotesCast / totalVoters) * 100) 
                  : 0;

                return (
                  <TableRow key={election.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {election.title}
                    </TableCell>
                    <TableCell>
                      {election.organization}
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
                      <Link href={`/elections/${election.id}`}>
                        <Button variant="link" className="text-primary hover:text-primary-dark mr-3">
                          View
                        </Button>
                      </Link>
                      <Link href={`/elections/${election.id}/edit`}>
                        <Button variant="link" className="text-gray-600 hover:text-gray-900">
                          {election.status === 'completed' ? 'Results' : 'Edit'}
                        </Button>
                      </Link>
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
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
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
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status}
        </Badge>
      );
  }
}
