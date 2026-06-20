import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ElectionAnalytic } from "@shared/schema";

interface VotingStatsProps {
  analytics: ElectionAnalytic;
  electionsStartDate?: Date;
  electionsEndDate?: Date;
  onSendReminder?: () => void;
}

export function VotingStats({
  analytics,
  electionsStartDate,
  electionsEndDate,
  onSendReminder
}: VotingStatsProps) {
  // Calculate participation percentage
  const participationPercentage = analytics.totalVoters > 0
    ? Math.round((analytics.totalVotesCast / analytics.totalVoters) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-900">Voting Statistics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Voter Participation</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-primary">
                    {participationPercentage}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-primary">
                    {analytics.totalVotesCast}/{analytics.totalVoters}
                  </span>
                </div>
              </div>
              <Progress value={participationPercentage} className="h-2.5 mb-4" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Total Votes Cast</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalVotesCast}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Gender Distribution</h3>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="text-sm">Male (53%)</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <div className="text-sm">Female (47%)</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Voting Timeline</h3>
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Voters</h3>
            <p className="text-3xl font-bold text-gray-900">{analytics.pendingVoters}</p>
            <div className="mt-2">
              {onSendReminder && (
                <Button 
                  variant="outline" 
                  className="w-full text-sm" 
                  onClick={onSendReminder}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Election Status</h3>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {analytics.isFinalized ? 'Completed' : 'Active'}
            </div>
            {electionsStartDate && electionsEndDate && (
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <div>Started: {formatDate(electionsStartDate)}</div>
                <div>Ends: {formatDate(electionsEndDate)}</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(date).toLocaleString('en-US', options);
}
