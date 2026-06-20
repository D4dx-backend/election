import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Pagination, User, Election } from "@/lib/types"; 
import { Download, Pencil, Trash2 } from "lucide-react";
import { VoterSlipPrinter } from "./VoterSlipPrinter";

interface VotersTableProps {
  voters: User[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPrint?: () => void;
  onExport?: () => void;
  elections?: Election[];
}

export function VotersTable({
  voters,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onPrint,
  onExport,
  elections = []
}: VotersTableProps) {
  // Function to get election names for a voter
  const getElectionNamesForVoter = (voter: User) => {
    if (!voter.electionAccess || !elections || elections.length === 0) {
      return [];
    }

    // Convert electionAccess from array of ObjectIds to array of strings
    const voterElectionIds = Array.isArray(voter.electionAccess) 
      ? voter.electionAccess.map(id => id.toString())
      : [];

    // Find matching elections and extract names
    return elections
      .filter(election => {
        const electionId = election._id?.toString() || election.id?.toString();
        return electionId && voterElectionIds.includes(electionId);
      })
      .map(election => `${election.title} - ${election.organization}`);
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium text-gray-900">Voter Accounts</CardTitle>
        <div className="flex space-x-2">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-50">Username</TableHead>
                <TableHead className="bg-gray-50">Name</TableHead>
                <TableHead className="bg-gray-50">Registration #</TableHead>
                <TableHead className="bg-gray-50">Role</TableHead>
                <TableHead className="bg-gray-50">Status</TableHead>
                <TableHead className="bg-gray-50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters.length > 0 ? (
                voters.map((voter) => {
                  // Get election names for this voter
                  const electionNames = getElectionNamesForVoter(voter);
                  
                  return (
                    <TableRow key={voter._id || voter.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {voter.username}
                      </TableCell>
                      <TableCell>
                        {voter.fullName || "-"}
                      </TableCell>
                      <TableCell>
                        {voter.registrationNumber || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {voter.role?.replace('_', ' ') || 'voter'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {voter.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {/* Print Voter Slip */}
                        <VoterSlipPrinter 
                          voter={voter} 
                          electionNames={electionNames}
                        />
                        
                        {/* Edit Button */}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(voter._id?.toString() || voter.id?.toString())}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {/* Delete Button */}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            onClick={() => onDelete(voter._id?.toString() || voter.id?.toString())}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No voters found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{voters.length > 0 ? pagination.page * pagination.pageSize - pagination.pageSize + 1 : 0}</span> to{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> voters
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page * pagination.pageSize >= pagination.total}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
