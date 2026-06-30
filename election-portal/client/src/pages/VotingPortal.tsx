import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  ChevronRight,
  Info,
  Vote,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import VoterLayout from '@/components/layouts/VoterLayout';
import { useToast } from '@/hooks/use-toast';

export default function VotingPortal() {
  const [, setLocation] = useLocation();
  const [votingStatus, setVotingStatus] = useState<Record<string, string>>({});
  const [availableElections, setAvailableElections] = useState<any[]>([]);
  const { toast } = useToast();

  const {
    data: electionsData,
    isLoading: isLoadingElections,
    isError: isElectionsError,
  } = useQuery({ queryKey: ['/api/vote/available-elections'] });

  const {
    data: voterStatusData,
    isLoading: isLoadingStatus,
    isError: isStatusError,
  } = useQuery({ queryKey: ['/api/vote/voter-status'] });

  useEffect(() => {
    if (Array.isArray(electionsData)) {
      setAvailableElections(electionsData);
    } else if (electionsData && typeof electionsData === 'object' && 'data' in electionsData) {
      if (Array.isArray((electionsData as any).data)) {
        setAvailableElections((electionsData as any).data);
      }
    }
  }, [electionsData]);

  useEffect(() => {
    if (voterStatusData && typeof voterStatusData === 'object') {
      if ('data' in voterStatusData && (voterStatusData as any).data) {
        setVotingStatus((voterStatusData as any).data);
      } else if (!('success' in voterStatusData)) {
        setVotingStatus(voterStatusData as Record<string, string>);
      }
    }
  }, [voterStatusData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleElectionClick = (electionId: string) => {
    if (votingStatus[electionId] === 'voted') {
      setLocation(`/results/${electionId}`);
    } else {
      setLocation(`/election/${electionId}`);
    }
  };

  const userFullName =
    (() => {
      try {
        const u = localStorage.getItem('user');
        if (u) {
          const p = JSON.parse(u);
          return p.fullName || p.username || '';
        }
      } catch { /* ignore */ }
      return localStorage.getItem('userFullName') || '';
    })();

  // ── Loading ──
  if (isLoadingElections || isLoadingStatus) {
    return (
      <VoterLayout title="My Elections">
        <div className="px-4 pt-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <Skeleton className="h-32 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </VoterLayout>
    );
  }

  // ── Error ──
  if (isElectionsError || isStatusError) {
    return (
      <VoterLayout title="My Elections">
        <div className="px-4 pt-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Failed to load elections</p>
              <p className="text-xs mt-0.5 text-red-600">Please check your connection and try again.</p>
            </div>
          </div>
        </div>
      </VoterLayout>
    );
  }

  const votedCount = availableElections.filter(
    (e) => votingStatus[e._id] === 'voted',
  ).length;

  return (
    <VoterLayout title="My Elections">
      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto">
        {/* ── Welcome strip ── */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Hi, {userFullName || 'Voter'} 👋
          </h1>
          {availableElections.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {votedCount}/{availableElections.length} election{availableElections.length !== 1 ? 's' : ''} completed
            </p>
          )}
        </div>

        {/* ── Election cards ── */}
        {availableElections.length > 0 ? (
          <div className="space-y-4">
            {availableElections.map((election: any) => {
              const voted = votingStatus[election._id] === 'voted';
              return (
                <button
                  key={election._id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleElectionClick(election._id)}
                >
                  <div
                    className={`
                      rounded-2xl overflow-hidden border-2 bg-white dark:bg-gray-800
                      active:scale-[0.98] transition-transform duration-100
                      ${voted
                        ? 'border-blue-200 dark:border-blue-700'
                        : 'border-green-300 dark:border-green-700 shadow-sm shadow-green-100'
                      }
                    `}
                  >
                    {/* Election banner image */}
                    {election.logo?.url && (
                      <div className="w-full h-36 bg-gray-100 dark:bg-gray-700">
                        <img
                          src={election.logo.url}
                          alt={election.logo.alt || election.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Card body */}
                    <div className="p-4">
                      {/* Status pill */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-base leading-snug text-gray-900 dark:text-white">
                            {election.title}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {election.organization}
                          </p>
                        </div>
                        {voted ? (
                          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Voted
                          </span>
                        ) : (
                          <span className="flex-shrink-0 text-xs font-bold text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1 rounded-full">
                            Open
                          </span>
                        )}
                      </div>

                      {/* Meta info row */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(election.electionDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Select {election.numberToBeElected} position{election.numberToBeElected !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* CTA */}
                      <div
                        className={`
                          w-full h-11 rounded-xl flex items-center justify-center gap-2
                          text-sm font-semibold transition-colors
                          ${voted
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-primary text-white'
                          }
                        `}
                      >
                        <Vote className="h-4 w-4" />
                        {voted ? 'View My Vote' : 'Cast Vote'}
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Info className="h-9 w-9 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              No Elections Yet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              You have no elections available for voting right now. Check back soon.
            </p>
          </div>
        )}
      </div>
    </VoterLayout>
  );
}
