import { User, Franchise, Election, Nominee, Vote, ElectionGroup, VoterGroup, ElectionAnalytic } from "@shared/schema";

// Re-export the types from shared schema to avoid errors
export type { Election, Nominee, ElectionGroup, Franchise, User, Vote, VoterGroup, ElectionAnalytic };

// Extended MongoDB type to support both MongoDB and schema formats
export interface MongoDBFormat {
  _id?: string;
  id?: number | string;
  electionAccess?: (string | any)[];
}

// Extended types with additional frontend-specific properties
export interface UserWithElections extends User {
  elections?: Election[];
}

export interface ElectionWithDetails extends MongoDBFormat {
  franchiseId?: string | number;
  franchise?: Franchise;
  nominees?: Nominee[];
  voters?: User[];
  analytics?: ElectionAnalytic;
  title: string;
  organization: string;
  electionDate: string | Date;
  numberToBeElected: number;
  status: string;
  maxVoters?: number;
  maxNominees?: number;
  voterCount?: number;
  nomineeCount?: number;
  genderBasedSelection?: boolean;
  maleMinimum?: number;
  femaleMinimum?: number;
  selfRegOpen?: boolean;
  votingOpen?: boolean;
  resultsPublished?: boolean;
  resultsPublishedAt?: string | Date | null;
  voterResultDisplay?: 'result_only' | 'percentage' | 'score' | 'full';
  nomineeDisplayOrder?: string;
  electionGroupId?: string | number;
  createdBy?: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  logo?: {
    url?: string;
    alt?: string;
  };
}

export interface NomineeWithVotes extends Nominee {
  voteCount?: number;
  percentage?: number;
}

export interface DashboardStats {
  activeElections: number;
  totalVoters: number;
  votesCast: number;
  totalFranchises: number;
  totalElections: number;
  franchiseDistribution: {
    name: string;
    percentage: number;
  }[];
  recentActivity: {
    action: string;
    timestamp: string;
    type: 'success' | 'info' | 'warning';
  }[];
}

export interface VoteValidationError {
  message: string;
  type: 'male' | 'female' | 'max' | 'min';
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface ElectionFilter {
  franchiseId?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface VoterFilter {
  electionId?: number;
  status?: string;
  search?: string;
}

export interface BulkVoterGenerationOptions {
  prefix: string;
  startingNumber: number;
  count: number;
  electionIds?: string[];
  electionGroupId?: string;
  voterGroupId?: string;
  assignmentType: 'election' | 'electionGroup' | 'voterGroup';
}

export type ElectionStatus = 'draft' | 'active' | 'completed' | 'archived';
export type VoteStatus = 'voted' | 'pending';
export type NomineeStatus = 'active' | 'withdrawn' | 'disqualified';
