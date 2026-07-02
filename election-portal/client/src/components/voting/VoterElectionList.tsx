import { format } from "date-fns";
import { Calendar, ChevronRight, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getElectionLabel } from "@/lib/electionHelpers";
import { cn } from "@/lib/utils";

export type VoterElectionItem = {
  _id?: string;
  id?: string;
  organization?: string;
  title?: string;
  electionDate?: string;
  numberToBeElected?: number;
  logo?: { url?: string; alt?: string };
};

function getElectionId(election: VoterElectionItem) {
  return election._id?.toString() || election.id?.toString() || "";
}

function formatElectionDate(dateString?: string) {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

interface VoterElectionListProps {
  elections: VoterElectionItem[];
  votingStatus: Record<string, string>;
  onElectionClick: (electionId: string) => void;
}

export function VoterElectionList({
  elections,
  votingStatus,
  onElectionClick,
}: VoterElectionListProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="px-4 py-3 border-b border-gray-200 md:px-6">
        <CardTitle className="text-base font-medium text-gray-900">Your elections</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {elections.map((election) => {
            const id = getElectionId(election);
            const voted = votingStatus[id] === "voted";
            const label = getElectionLabel(election);
            const positions = election.numberToBeElected ?? 1;
            const meta = `${formatElectionDate(election.electionDate)} · Select ${positions} position${positions !== 1 ? "s" : ""}`;

            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onElectionClick(id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors",
                    "hover:bg-primary/5 active:bg-primary/10",
                    voted ? "bg-blue-50/40" : ""
                  )}
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {election.logo?.url ? (
                      <img
                        src={election.logo.url}
                        alt={election.logo.alt || label}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Vote className="h-5 w-5 text-primary/70" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 leading-tight truncate">{label}</h3>
                      {voted ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-[10px] px-1.5 py-0"
                        >
                          Voted
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-[10px] px-1.5 py-0"
                        >
                          Open
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      {meta}
                    </p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-primary">
                    <span className="hidden sm:inline">{voted ? "View vote" : "Vote"}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
