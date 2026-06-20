
# MongoDB Data Models for Election Management System

## 1. Franchise Collection

```javascript
{
  _id: ObjectId,
  name: String,
  logo: {
    url: String,
    alt: String
  },
  createdAt: Date,
  updatedAt: Date,
  status: String, // active, inactive
  settings: {
    defaultElectionSettings: {
      nomineeDisplayOrder: String,
      maxVoters: Number,
      maxNominees: Number,
      maleMinimum: Number,
      femaleMinimum: Number,
      selfRegOpen: Boolean,
      votingOpen: Boolean
    }
  }
}
```

## 2. User Collection

```javascript
{
  _id: ObjectId,
  username: String,
  password: String, // hashed
  email: String,
  fullName: String,
  role: String, // franchise_admin, election_admin, voter
  franchiseId: ObjectId, // reference to franchise
  registrationNumber: String, // for voters
  createdBy: ObjectId, // reference to admin user
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  status: String, // active, inactive
  electionAccess: [ObjectId], // references to elections this user can access/vote in
  isVoter: Boolean,
  voterMetadata: {
    prefix: String,
    sequenceNumber: Number,
    electionGroups: [ObjectId] // references to election groups
  }
}
```

## 3. Election Collection

```javascript
{
  _id: ObjectId,
  franchiseId: ObjectId, // reference to franchise
  organization: String,
  title: String,
  electionDate: Date,
  numberToBeElected: Number,
  nomineeDisplayOrder: String, // e.g., "VOTE", "ALPHA"
  maxVoters: Number,
  maxNominees: Number,
  maleMinimum: Number,
  femaleMinimum: Number,
  selfRegOpen: Boolean,
  votingOpen: Boolean,
  createdBy: ObjectId, // reference to admin user
  createdAt: Date,
  updatedAt: Date,
  status: String, // draft, active, completed, archived
  logo: {
    url: String,
    alt: String
  },
  electionGroupId: ObjectId // reference to election group if part of one
}
```

## 4. Nominee Collection

```javascript
{
  _id: ObjectId,
  electionId: ObjectId, // reference to election
  name: String,
  gender: String, // male, female, other
  position: Number, // display order position
  photo: {
    url: String,
    alt: String
  },
  bio: String,
  additionalInfo: Object, // flexible field for custom nominee attributes
  createdAt: Date,
  updatedAt: Date,
  status: String // active, withdrawn, disqualified
}
```

## 5. Vote Collection

```javascript
{
  _id: ObjectId,
  electionId: ObjectId, // reference to election
  voterId: ObjectId, // reference to voter user
  nominees: [ObjectId], // references to selected nominees
  timestamp: Date,
  ipAddress: String,
  deviceInfo: String,
  status: String // completed, partial, rejected
}
```

## 6. ElectionGroup Collection

```javascript
{
  _id: ObjectId,
  franchiseId: ObjectId, // reference to franchise
  name: String,
  description: String,
  elections: [ObjectId], // references to elections in this group
  createdBy: ObjectId, // reference to admin user
  createdAt: Date,
  updatedAt: Date
}
```

## 7. VoterGroup Collection

```javascript
{
  _id: ObjectId,
  franchiseId: ObjectId, // reference to franchise
  name: String,
  description: String,
  voters: [ObjectId], // references to voters in this group
  prefix: String, // for bulk generation
  startingNumber: Number, // for bulk generation
  createdBy: ObjectId, // reference to admin user
  createdAt: Date,
  updatedAt: Date
}
```

## 8. AuditLog Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // user who performed the action
  action: String, // create, update, delete, login, vote, etc.
  entityType: String, // election, nominee, voter, etc.
  entityId: ObjectId, // id of the affected entity
  timestamp: Date,
  ipAddress: String,
  details: Object // additional details about the action
}
```

## 9. ElectionAnalytics Collection

```javascript
{
  _id: ObjectId,
  electionId: ObjectId, // reference to election
  totalVoters: Number,
  totalVotesCast: Number,
  pendingVoters: Number,
  nomineeResults: [
    {
      nomineeId: ObjectId,
      nomineeName: String,
      voteCount: Number,
      percentage: Number
    }
  ],
  lastUpdated: Date,
  isFinalized: Boolean
}
```

## Data Relationships:

1. **One-to-Many**:
   - Franchise to Elections
   - Franchise to Users
   - Election to Nominees
   - Election to Votes

2. **Many-to-Many**:
   - Users to Elections (through electionAccess array)
   - Voters to Election Groups
   - Elections to Election Groups

## Indexes:

```javascript
// User Collection
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "franchiseId": 1 })
db.users.createIndex({ "registrationNumber": 1 })
db.users.createIndex({ "role": 1 })

// Election Collection
db.elections.createIndex({ "franchiseId": 1 })
db.elections.createIndex({ "electionDate": 1 })
db.elections.createIndex({ "status": 1 })
db.elections.createIndex({ "electionGroupId": 1 })

// Nominee Collection
db.nominees.createIndex({ "electionId": 1 })

// Vote Collection
db.votes.createIndex({ "electionId": 1 })
db.votes.createIndex({ "voterId": 1, "electionId": 1 }, { unique: true })

// ElectionGroup Collection
db.electionGroups.createIndex({ "franchiseId": 1 })

// VoterGroup Collection
db.voterGroups.createIndex({ "franchiseId": 1 })

// AuditLog Collection
db.auditLogs.createIndex({ "timestamp": 1 })
db.auditLogs.createIndex({ "userId": 1 })
db.auditLogs.createIndex({ "entityId": 1 })
```
