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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Link } from "wouter";
import { ElectionWithDetails } from "@/lib/types";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Activity, Trash2 } from "lucide-react";

interface ElectionsTableProps {
  elections: ElectionWithDetails[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function ElectionsTable({ elections, onDelete, onStatusChange }: ElectionsTableProps) {
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Elections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-50">ID</TableHead>
                <TableHead className="bg-gray-50">Election</TableHead>
                <TableHead className="bg-gray-50">Organization</TableHead>
                <TableHead className="bg-gray-50">Date</TableHead>
                <TableHead className="bg-gray-50">Positions</TableHead>
                <TableHead className="bg-gray-50">Voters</TableHead>
                <TableHead className="bg-gray-50">Status</TableHead>
                <TableHead className="bg-gray-50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => (
                <TableRow key={election._id || election.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-500">
                    EL-{(election._id?.toString() || election.id?.toString() || '').substring(0, 4)}
                  </TableCell>
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
                    {election.numberToBeElected}
                  </TableCell>
                  <TableCell>
                    {election.maxVoters}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={election.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/elections/${election._id?.toString() || election.id?.toString()}`}>
                      <Button variant="link" className="text-primary hover:text-primary-dark mr-2">
                        View
                      </Button>
                    </Link>
                    <Link href={`/elections/${election._id?.toString() || election.id?.toString()}/edit`}>
                      <Button variant="link" className="text-gray-600 hover:text-gray-900 mr-2">
                        {election.status === 'completed' ? 'Results' : 'Edit'}
                      </Button>
                    </Link>
                    {election.status !== 'completed' && election.status !== 'archived' && onDelete && (
                      <Button 
                        variant="link" 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => onDelete(election._id?.toString() || election.id?.toString() || '')}
                      >
                        Delete
                      </Button>
                    )}
                    {(election.status === 'completed' || election.status === 'archived') && (
                      <span className="text-gray-400 cursor-not-allowed">Delete</span>
                    )}
                    <Button 
                      variant="outline" 
                      className="ml-2 h-8 px-2 text-xs"
                      onClick={() => {
                        const electionId = election._id?.toString() || election.id?.toString() || '';
                        onStatusChange?.(electionId, 'active');
                      }}
                    >
                      <Activity className="mr-1 h-4 w-4" /> Set Active
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-2 h-8 px-2 text-xs">
                          <MoreHorizontal className="mr-1 h-4 w-4" /> More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onStatusChange?.(election._id || election.id?.toString() || '', 'draft')}>
                          <Activity className="mr-2 h-4 w-4" /> Set as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(election._id || election.id?.toString() || '', 'active')}>
                          <Activity className="mr-2 h-4 w-4" /> Set as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(election._id || election.id?.toString() || '', 'completed')}>
                          <Activity className="mr-2 h-4 w-4" /> Set as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange?.(election._id || election.id?.toString() || '', 'archived')}>
                          <Activity className="mr-2 h-4 w-4" /> Set as Archived
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete?.(election._id?.toString() || election.id?.toString() || '')}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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