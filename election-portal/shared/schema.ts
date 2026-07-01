import { z } from "zod";

/** Supabase UUID string (election-api also exposes as `_id` for API compatibility). */
export type EntityId = string;

export interface ApiEntity {
  _id?: EntityId;
  id?: EntityId;
}

export interface User extends ApiEntity {
  username: string;
  email?: string | null;
  fullName?: string | null;
  role: string;
  franchiseId?: EntityId | null;
  registrationNumber?: string | null;
  createdBy?: EntityId | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  lastLogin?: string | Date | null;
  status?: string | null;
  isVoter?: boolean | null;
  prefix?: string | null;
  sequenceNumber?: number | null;
  plainPassword?: string | null;
  electionAccess?: EntityId[];
  onboardingCompleted?: boolean | null;
}

export interface Franchise extends ApiEntity {
  name: string;
  logoUrl?: string | null;
  logoAlt?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  status?: string | null;
  defaultNomineeDisplayOrder?: string | null;
  defaultMaxVoters?: number | null;
  defaultMaxNominees?: number | null;
  defaultMaleMinimum?: number | null;
  defaultFemaleMinimum?: number | null;
  defaultSelfRegOpen?: boolean | null;
  defaultVotingOpen?: boolean | null;
  logo?: { url?: string; alt?: string };
}

export interface Election extends ApiEntity {
  franchiseId: EntityId;
  organization: string;
  title?: string;
  electionDate: string | Date;
  numberToBeElected: number;
  nomineeDisplayOrder?: string | null;
  maxVoters?: number | null;
  maxNominees?: number | null;
  genderBasedSelection?: boolean | null;
  maleMinimum?: number | null;
  femaleMinimum?: number | null;
  selfRegOpen?: boolean | null;
  votingOpen?: boolean | null;
  resultsPublished?: boolean | null;
  resultsPublishedAt?: string | Date | null;
  voterResultDisplay?: string | null;
  adminVotingDetailsEnabled?: boolean | null;
  manualWinnerSelection?: boolean | null;
  manualWinnerIds?: EntityId[] | null;
  createdBy?: EntityId | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  status?: string | null;
  logoUrl?: string | null;
  logoAlt?: string | null;
  logo?: { url?: string; alt?: string };
}

export interface Nominee extends ApiEntity {
  electionId: EntityId;
  name: string;
  gender: string;
  position?: number | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
  bio?: string | null;
  additionalInfo?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  status?: string | null;
}

export interface Vote extends ApiEntity {
  electionId: EntityId;
  voterId: EntityId;
  nominees: EntityId[];
  timestamp?: string | Date | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  status?: string | null;
}

export interface ElectionGroup extends ApiEntity {
  franchiseId: EntityId;
  name: string;
  description?: string | null;
  createdBy?: EntityId | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  elections?: EntityId[] | Election[];
}

export interface VoterGroup extends ApiEntity {
  franchiseId: EntityId;
  name: string;
  description?: string | null;
  prefix?: string | null;
  startingNumber?: number | null;
  createdBy?: EntityId | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  voters?: EntityId[];
}

export interface ElectionAnalytic extends ApiEntity {
  electionId: EntityId;
  totalVoters?: number | null;
  totalVotesCast?: number | null;
  pendingVoters?: number | null;
  nomineeResults?: Record<string, unknown> | null;
  lastUpdated?: string | Date | null;
  isFinalized?: boolean | null;
}

export const insertElectionSchema = z.object({
  franchiseId: z.string().uuid().optional(),
  organization: z.string().min(1, "Organization is required"),
  electionDate: z.union([z.string(), z.date()]),
  numberToBeElected: z.number().int().min(1),
  nomineeDisplayOrder: z.string().optional(),
  maxVoters: z.number().int().optional(),
  maxNominees: z.number().int().optional(),
  genderBasedSelection: z.boolean().optional(),
  maleMinimum: z.number().int().optional(),
  femaleMinimum: z.number().int().optional(),
  selfRegOpen: z.boolean().optional(),
  votingOpen: z.boolean().optional(),
  resultsPublished: z.boolean().optional(),
  adminVotingDetailsEnabled: z.boolean().optional(),
  manualWinnerSelection: z.boolean().optional(),
  voterResultDisplay: z.string().optional(),
  status: z.string().optional(),
  logoUrl: z.string().optional(),
  logoAlt: z.string().optional(),
});

export type InsertElection = z.infer<typeof insertElectionSchema>;
