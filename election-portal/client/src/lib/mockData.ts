import { User, Franchise, Election, Nominee, ElectionGroup, VoterGroup, ElectionAnalytic } from "@shared/schema";
import { 
  ElectionWithDetails, 
  NomineeWithVotes, 
  DashboardStats, 
  BulkVoterGenerationOptions 
} from "./types";

export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    password: "$2a$10$XUGZXq5mGLQpPQZ6MVvrqOTeFvg/uOMrCBBuQ0Nw3bsQGVXmj8iEC", // hashed "password"
    email: "admin@electmanager.com",
    fullName: "John Admin",
    role: "franchise_admin",
    franchiseId: 1,
    registrationNumber: null,
    createdBy: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    lastLogin: new Date('2023-10-17'),
    status: "active",
    isVoter: false,
    prefix: null,
    sequenceNumber: null
  },
  {
    id: 2,
    username: "electionadmin",
    password: "$2a$10$XUGZXq5mGLQpPQZ6MVvrqOTeFvg/uOMrCBBuQ0Nw3bsQGVXmj8iEC",
    email: "electionadmin@electmanager.com",
    fullName: "Mary Manager",
    role: "election_admin",
    franchiseId: 1,
    registrationNumber: null,
    createdBy: 1,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-02-15'),
    lastLogin: new Date('2023-10-16'),
    status: "active",
    isVoter: false,
    prefix: null,
    sequenceNumber: null
  }
];

// Voter accounts
export const mockVoters: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: 100 + i,
  username: `VOTE${1001 + i}`,
  password: "$2a$10$XUGZXq5mGLQpPQZ6MVvrqOTeFvg/uOMrCBBuQ0Nw3bsQGVXmj8iEC",
  email: null,
  fullName: null,
  role: "voter",
  franchiseId: 1,
  registrationNumber: `GT-${1234 + i}`,
  createdBy: 1,
  createdAt: new Date('2023-10-01'),
  updatedAt: new Date('2023-10-01'),
  lastLogin: i < 75 ? new Date('2023-10-18') : null,
  status: "active",
  isVoter: true,
  prefix: "VOTE",
  sequenceNumber: 1001 + i
}));

export const mockFranchises: Franchise[] = [
  {
    id: 1,
    name: "Global Technologies Corp",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Global Technologies Logo",
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    status: "active",
    defaultNomineeDisplayOrder: "ALPHA",
    defaultMaxVoters: 500,
    defaultMaxNominees: 20,
    defaultMaleMinimum: 2,
    defaultFemaleMinimum: 2,
    defaultSelfRegOpen: false,
    defaultVotingOpen: false
  },
  {
    id: 2,
    name: "Springfield University",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Springfield University Logo",
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-02-01'),
    status: "active",
    defaultNomineeDisplayOrder: "ALPHA",
    defaultMaxVoters: 5000,
    defaultMaxNominees: 30,
    defaultMaleMinimum: 0,
    defaultFemaleMinimum: 0,
    defaultSelfRegOpen: true,
    defaultVotingOpen: false
  },
  {
    id: 3,
    name: "National Association of Engineers",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "National Association of Engineers Logo",
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2023-03-01'),
    status: "active",
    defaultNomineeDisplayOrder: "VOTE",
    defaultMaxVoters: 2000,
    defaultMaxNominees: 15,
    defaultMaleMinimum: 1,
    defaultFemaleMinimum: 1,
    defaultSelfRegOpen: false,
    defaultVotingOpen: false
  }
];

export const mockElections: Election[] = [
  {
    id: 1,
    franchiseId: 1,
    organization: "Global Technologies Corp",
    title: "Board Member Election",
    electionDate: new Date('2023-10-18'),
    numberToBeElected: 5,
    nomineeDisplayOrder: "ALPHA",
    maxVoters: 432,
    maxNominees: 10,
    maleMinimum: 2,
    femaleMinimum: 2,
    selfRegOpen: false,
    votingOpen: true,
    createdBy: 1,
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2023-10-18'),
    status: "active",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Board Election Logo",
    electionGroupId: null
  },
  {
    id: 2,
    franchiseId: 3,
    organization: "National Association of Engineers",
    title: "Executive Committee",
    electionDate: new Date('2023-10-15'),
    numberToBeElected: 7,
    nomineeDisplayOrder: "VOTE",
    maxVoters: 1500,
    maxNominees: 15,
    maleMinimum: 3,
    femaleMinimum: 3,
    selfRegOpen: false,
    votingOpen: true,
    createdBy: 1,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-10-15'),
    status: "active",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Executive Committee Election Logo",
    electionGroupId: null
  },
  {
    id: 3,
    franchiseId: 2,
    organization: "Springfield University",
    title: "Student Council",
    electionDate: new Date('2023-10-10'),
    numberToBeElected: 12,
    nomineeDisplayOrder: "ALPHA",
    maxVoters: 3650,
    maxNominees: 25,
    maleMinimum: 5,
    femaleMinimum: 5,
    selfRegOpen: true,
    votingOpen: false,
    createdBy: 1,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-10-10'),
    status: "completed",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Student Council Election Logo",
    electionGroupId: 2
  },
  {
    id: 4,
    franchiseId: 2,
    organization: "Springfield University",
    title: "Departmental Chairs",
    electionDate: new Date('2023-11-05'),
    numberToBeElected: 5,
    nomineeDisplayOrder: "ALPHA",
    maxVoters: 245,
    maxNominees: 10,
    maleMinimum: 2,
    femaleMinimum: 2,
    selfRegOpen: false,
    votingOpen: false,
    createdBy: 1,
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-10-01'),
    status: "draft",
    logoUrl: "https://via.placeholder.com/150",
    logoAlt: "Departmental Chairs Election Logo",
    electionGroupId: 2
  }
];

export const mockNominees: Nominee[] = [
  {
    id: 1,
    electionId: 1,
    name: "Sarah Johnson",
    gender: "female",
    position: 1,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "Sarah Johnson Photo",
    bio: "Marketing Director with 15 years of experience",
    additionalInfo: { department: "Marketing", age: 42 },
    createdAt: new Date('2023-09-20'),
    updatedAt: new Date('2023-09-20'),
    status: "active"
  },
  {
    id: 2,
    electionId: 1,
    name: "Michael Chang",
    gender: "male",
    position: 2,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "Michael Chang Photo",
    bio: "Finance VP with extensive banking background",
    additionalInfo: { department: "Finance", age: 45 },
    createdAt: new Date('2023-09-20'),
    updatedAt: new Date('2023-09-20'),
    status: "active"
  },
  {
    id: 3,
    electionId: 1,
    name: "Jessica Williams",
    gender: "female",
    position: 3,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "Jessica Williams Photo",
    bio: "Operations Director with 10 years experience",
    additionalInfo: { department: "Operations", age: 38 },
    createdAt: new Date('2023-09-21'),
    updatedAt: new Date('2023-09-21'),
    status: "active"
  },
  {
    id: 4,
    electionId: 1,
    name: "David Rodriguez",
    gender: "male",
    position: 4,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "David Rodriguez Photo",
    bio: "Technology Director and former CTO",
    additionalInfo: { department: "Technology", age: 41 },
    createdAt: new Date('2023-09-21'),
    updatedAt: new Date('2023-09-21'),
    status: "active"
  },
  {
    id: 5,
    electionId: 1,
    name: "Emily Chen",
    gender: "female",
    position: 5,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "Emily Chen Photo",
    bio: "HR Manager with passion for employee development",
    additionalInfo: { department: "Human Resources", age: 36 },
    createdAt: new Date('2023-09-22'),
    updatedAt: new Date('2023-09-22'),
    status: "active"
  },
  {
    id: 6,
    electionId: 1,
    name: "Robert Wilson",
    gender: "male",
    position: 6,
    photoUrl: "https://via.placeholder.com/150",
    photoAlt: "Robert Wilson Photo",
    bio: "Legal Counsel with expertise in corporate law",
    additionalInfo: { department: "Legal", age: 48 },
    createdAt: new Date('2023-09-22'),
    updatedAt: new Date('2023-09-22'),
    status: "active"
  }
];

export const mockElectionGroups: ElectionGroup[] = [
  {
    id: 1,
    franchiseId: 1,
    name: "Board Elections 2023",
    description: "All board level elections for 2023",
    createdBy: 1,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: 2,
    franchiseId: 2,
    name: "Student Council Elections",
    description: "All student council related elections",
    createdBy: 1,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20')
  },
  {
    id: 3,
    franchiseId: 1,
    name: "Department Elections",
    description: "Elections for department leadership",
    createdBy: 1,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10')
  }
];

export const mockVoterGroups: VoterGroup[] = [
  {
    id: 1,
    franchiseId: 1,
    name: "Global Tech Employees",
    description: "All employees of Global Tech",
    prefix: "GTECH",
    startingNumber: 1001,
    createdBy: 1,
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20')
  },
  {
    id: 2,
    franchiseId: 2,
    name: "University Students",
    description: "All registered students",
    prefix: "STUD",
    startingNumber: 2001,
    createdBy: 1,
    createdAt: new Date('2023-02-25'),
    updatedAt: new Date('2023-02-25')
  },
  {
    id: 3,
    franchiseId: 3,
    name: "Engineering Association Members",
    description: "All members of engineering association",
    prefix: "ENG",
    startingNumber: 3001,
    createdBy: 1,
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-03-15')
  }
];

export const mockAnalytics: ElectionAnalytic[] = [
  {
    id: 1,
    electionId: 1,
    totalVoters: 432,
    totalVotesCast: 324,
    pendingVoters: 108,
    nomineeResults: [
      { nomineeId: 1, nomineeName: "Sarah Johnson", voteCount: 328, percentage: 75.9 },
      { nomineeId: 2, nomineeName: "Michael Chang", voteCount: 301, percentage: 69.7 },
      { nomineeId: 3, nomineeName: "Jessica Williams", voteCount: 285, percentage: 66.0 },
      { nomineeId: 4, nomineeName: "David Rodriguez", voteCount: 270, percentage: 62.5 },
      { nomineeId: 5, nomineeName: "Emily Chen", voteCount: 254, percentage: 58.8 },
      { nomineeId: 6, nomineeName: "Robert Wilson", voteCount: 228, percentage: 52.8 }
    ],
    lastUpdated: new Date('2023-10-18'),
    isFinalized: false
  },
  {
    id: 2,
    electionId: 2,
    totalVoters: 1500,
    totalVotesCast: 781,
    pendingVoters: 719,
    nomineeResults: [
      // Analytics for Election 2 would go here
    ],
    lastUpdated: new Date('2023-10-15'),
    isFinalized: false
  },
  {
    id: 3,
    electionId: 3,
    totalVoters: 3650,
    totalVotesCast: 3245,
    pendingVoters: 405,
    nomineeResults: [
      // Analytics for Election 3 would go here
    ],
    lastUpdated: new Date('2023-10-10'),
    isFinalized: true
  }
];

// Helper functions to work with the mock data
export function getElectionWithDetails(electionId: number): ElectionWithDetails | undefined {
  const election = mockElections.find(e => e.id === electionId);
  if (!election) return undefined;

  const franchise = mockFranchises.find(f => f.id === election.franchiseId);
  const nominees = mockNominees.filter(n => n.electionId === electionId);
  const voters = mockVoters.filter(v => v.franchiseId === election.franchiseId);
  const analytics = mockAnalytics.find(a => a.electionId === electionId);

  return {
    ...election,
    franchise,
    nominees,
    voters,
    analytics
  };
}

export function getRecentElections(limit: number = 3): ElectionWithDetails[] {
  return mockElections
    .sort((a, b) => b.electionDate.getTime() - a.electionDate.getTime())
    .slice(0, limit)
    .map(election => {
      const franchise = mockFranchises.find(f => f.id === election.franchiseId);
      const analytics = mockAnalytics.find(a => a.electionId === election.id);
      
      return {
        ...election,
        franchise,
        analytics
      };
    });
}

export function getNomineesWithVotes(electionId: number): NomineeWithVotes[] {
  const nominees = mockNominees.filter(n => n.electionId === electionId);
  const analytics = mockAnalytics.find(a => a.electionId === electionId);
  
  if (!analytics || !analytics.nomineeResults) return nominees;
  
  return nominees.map(nominee => {
    const result = analytics.nomineeResults.find(r => r.nomineeId === nominee.id);
    if (!result) return nominee;
    
    return {
      ...nominee,
      voteCount: result.voteCount,
      percentage: result.percentage
    };
  });
}

// Simulated dashboard stats
export const mockDashboardStats: DashboardStats = {
  activeElections: 8,
  totalVoters: 12457,
  votesCast: 7842,
  totalFranchises: 5,
  totalElections: 32,
  franchiseDistribution: [
    { name: "Global Technologies", percentage: 42 },
    { name: "Springfield University", percentage: 28 },
    { name: "National Association", percentage: 15 },
    { name: "Others", percentage: 15 }
  ],
  recentActivity: [
    { action: "Election \"Board Member\" started", timestamp: "Today, 10:35 AM", type: "success" },
    { action: "Added 150 new voters", timestamp: "Yesterday, 2:20 PM", type: "info" },
    { action: "Updated election settings", timestamp: "Yesterday, 11:45 AM", type: "warning" }
  ]
};

// Helper function for generating bulk voters
export function generateVoters(options: BulkVoterGenerationOptions): User[] {
  const { prefix, startingNumber, count, electionIds } = options;
  
  return Array.from({ length: count }, (_, i) => ({
    id: 1000 + i, // These are mock IDs
    username: `${prefix}${startingNumber + i}`,
    password: "$2a$10$XUGZXq5mGLQpPQZ6MVvrqOTeFvg/uOMrCBBuQ0Nw3bsQGVXmj8iEC", // hashed "password"
    email: null,
    fullName: null,
    role: "voter",
    franchiseId: 1, // Default franchise
    registrationNumber: `${prefix}-${startingNumber + i}`,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    status: "active",
    isVoter: true,
    prefix,
    sequenceNumber: startingNumber + i
  }));
}
