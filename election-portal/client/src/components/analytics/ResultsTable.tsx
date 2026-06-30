import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Printer, Download, Award } from "lucide-react";
import { NomineeWithVotes } from "@/lib/types";

interface ResultsTableProps {
  nominees: NomineeWithVotes[];
  numberToBeElected: number;
  onPrint?: () => void;
  onExport?: () => void;
}

export function ResultsTable({
  nominees,
  numberToBeElected,
  onPrint,
  onExport
}: ResultsTableProps) {
  // Sort nominees by vote count (descending)
  const sortedNominees = [...nominees].sort((a, b) => {
    if (a.voteCount === undefined || b.voteCount === undefined) return 0;
    return b.voteCount - a.voteCount;
  });

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Election Results</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6 w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg 
            className="w-16 h-16 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {sortedNominees.map((nominee, index) => {
            const isElected = index < numberToBeElected;
            const nomineeId = (nominee as NomineeWithVotes & { _id?: string })._id || nominee.id;
            return (
              <div key={nomineeId} className={`p-4 space-y-3 ${isElected ? "bg-green-50/60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                    <h3 className="font-semibold text-gray-900 truncate">{nominee.name}</h3>
                  </div>
                  {isElected && <Award className="h-5 w-5 text-yellow-500 shrink-0" />}
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md bg-white/70 p-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Votes</p>
                    <p className="font-semibold text-gray-900">{nominee.voteCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Percentage</p>
                    <p className="font-semibold text-gray-900">{(nominee.percentage || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-50">Rank</TableHead>
                <TableHead className="bg-gray-50">Nominee</TableHead>
                <TableHead className="bg-gray-50 text-right">Votes</TableHead>
                <TableHead className="bg-gray-50 text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNominees.map((nominee, index) => (
                <TableRow 
                  key={nominee.id} 
                  className={`transition-colors hover:bg-gray-50 ${index < numberToBeElected ? 'bg-green-50' : ''}`}
                >
                  <TableCell className="text-sm text-gray-500">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {nominee.name}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {nominee.voteCount !== undefined ? nominee.voteCount : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {nominee.percentage !== undefined ? `${nominee.percentage.toFixed(1)}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div>
          <Badge>
            <Award className="mr-1 h-4 w-4" />
            Elected
          </Badge>
        </div>
        <div className="flex space-x-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {children}
    </span>
  );
}
