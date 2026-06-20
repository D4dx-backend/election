import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").notNull(), // franchise_admin, election_admin, voter
  franchiseId: integer("franchise_id"),
  registrationNumber: text("registration_number"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  status: text("status").default("active"), // active, inactive
  isVoter: boolean("is_voter").default(false),
  prefix: text("prefix"),
  sequenceNumber: integer("sequence_number"),
});

// Franchise table
export const franchises = pgTable("franchises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  logoAlt: text("logo_alt"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").default("active"), // active, inactive
  defaultNomineeDisplayOrder: text("default_nominee_display_order").default("ALPHA"),
  defaultMaxVoters: integer("default_max_voters"),
  defaultMaxNominees: integer("default_max_nominees"),
  defaultMaleMinimum: integer("default_male_minimum"),
  defaultFemaleMinimum: integer("default_female_minimum"),
  defaultSelfRegOpen: boolean("default_self_reg_open").default(false),
  defaultVotingOpen: boolean("default_voting_open").default(false),
});

// Election table
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").notNull(),
  organization: text("organization").notNull(),
  title: text("title").notNull(),
  electionDate: timestamp("election_date").notNull(),
  numberToBeElected: integer("number_to_be_elected").notNull(),
  nomineeDisplayOrder: text("nominee_display_order").default("ALPHA"),
  maxVoters: integer("max_voters"),
  maxNominees: integer("max_nominees"),
  maleMinimum: integer("male_minimum"),
  femaleMinimum: integer("female_minimum"),
  selfRegOpen: boolean("self_reg_open").default(false),
  votingOpen: boolean("voting_open").default(false),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").default("draft"), // draft, active, completed, archived
  logoUrl: text("logo_url"),
  logoAlt: text("logo_alt"),
  electionGroupId: integer("election_group_id"),
});

// Nominee table
export const nominees = pgTable("nominees", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(), // male, female, other
  position: integer("position"),
  photoUrl: text("photo_url"),
  photoAlt: text("photo_alt"),
  bio: text("bio"),
  additionalInfo: jsonb("additional_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").default("active"), // active, withdrawn, disqualified
});

// Vote table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull(),
  voterId: integer("voter_id").notNull(),
  nominees: text("nominees").array().notNull(), // array of nominee IDs
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  status: text("status").default("completed"), // completed, partial, rejected
});

// ElectionGroup table
export const electionGroups = pgTable("election_groups", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// VoterGroup table
export const voterGroups = pgTable("voter_groups", {
  id: serial("id").primaryKey(),
  franchiseId: integer("franchise_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  prefix: text("prefix"),
  startingNumber: integer("starting_number"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ElectionAnalytics table
export const electionAnalytics = pgTable("election_analytics", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull(),
  totalVoters: integer("total_voters").default(0),
  totalVotesCast: integer("total_votes_cast").default(0),
  pendingVoters: integer("pending_voters").default(0),
  nomineeResults: jsonb("nominee_results"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isFinalized: boolean("is_finalized").default(false),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

export const insertFranchiseSchema = createInsertSchema(franchises).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertNomineeSchema = createInsertSchema(nominees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  timestamp: true
});

export const insertElectionGroupSchema = createInsertSchema(electionGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVoterGroupSchema = createInsertSchema(voterGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Franchise = typeof franchises.$inferSelect;
export type InsertFranchise = z.infer<typeof insertFranchiseSchema>;

export type Election = typeof elections.$inferSelect;
export type InsertElection = z.infer<typeof insertElectionSchema>;

export type Nominee = typeof nominees.$inferSelect;
export type InsertNominee = z.infer<typeof insertNomineeSchema>;

export type Vote = typeof votes.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;

export type ElectionGroup = typeof electionGroups.$inferSelect;
export type InsertElectionGroup = z.infer<typeof insertElectionGroupSchema>;

export type VoterGroup = typeof voterGroups.$inferSelect;
export type InsertVoterGroup = z.infer<typeof insertVoterGroupSchema>;

export type ElectionAnalytic = typeof electionAnalytics.$inferSelect;
