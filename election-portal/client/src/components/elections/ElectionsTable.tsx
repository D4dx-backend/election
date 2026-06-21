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
import { Link, useLocation } from "wouter";
import { ElectionStatus, ElectionWithDetails } from "@/lib/types";
import { DropdownMenuItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Activity, Trash2, Pencil } from "lucide-react";

interface ElectionsTableProps {
  elections: ElectionWithDetails[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: ElectionStatus) => void;
}

export function ElectionsTable({ elections, onDelete, onStatusChange }: ElectionsTableProps) {
  const [, navigate] = useLocation();

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Elections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 md:hidden">
          {elections.map((election) => {
            const id = election._id?.toString() || election.id?.toString() || "";
            return (
              <div
                key={id}
                className="p-4 space-y-4 cursor-pointer transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
                onClick={() => navigate(`/elections/${id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-1">EL-{id.substring(0, 4)}</p>
                    <h3 className="font-semibold text-gray-900 leading-tight">{election.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{election.organization}</p>
                  </div>
                  <StatusBadge status={election.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-md bg-gray-50 p-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{format(new Date(election.electionDate), 'yyyy-MM-dd')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seats</p>
                    <p className="font-medium text-gray-900">{election.numberToBeElected}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Voters</p>
                    <p className="font-medium text-gray-900">{election.maxVoters}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <Link href={`/elections/${id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-9">
                      <Pencil className="h-4 w-4 mr-1" />
                      {election.status === 'completed' ? 'Results' : 'Edit'}
                    </Button>
                  </Link>
                  {election.status !== 'completed' && election.status !== 'archived' && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-red-600 hover:text-red-900 hover:bg-red-50"
                      onClick={() => onDelete(id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 ml-auto">
                        <MoreHorizontal className="h-4 w-4 mr-1" /> More
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onStatusChange?.(id, 'draft')}>
                        <Activity className="mr-2 h-4 w-4" /> Set as Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange?.(id, 'active')}>
                        <Activity className="mr-2 h-4 w-4" /> Set as Active
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange?.(id, 'completed')}>
                        <Activity className="mr-2 h-4 w-4" /> Set as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange?.(id, 'archived')}>
                        <Activity className="mr-2 h-4 w-4" /> Set as Archived
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
                <TableRow
                  key={election._id || election.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => navigate(`/elections/${election._id?.toString() || election.id?.toString() || ''}`)}
                >
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
                  <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                    <Link href={`/elections/${election._id?.toString() || election.id?.toString()}/edit`}>
                      <Button variant="ghost" size="sm" className="mr-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        {election.status === 'completed' ? 'Results' : 'Edit'}
                      </Button>
                    </Link>
                    {election.status !== 'completed' && election.status !== 'archived' && onDelete && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="mr-1 text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => onDelete(election._id?.toString() || election.id?.toString() || '')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                    {(election.status === 'completed' || election.status === 'archived') && (
                      <span className="text-gray-400 cursor-not-allowed">Delete</span>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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