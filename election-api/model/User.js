const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: String, // hashed
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    fullName: String,
    role: {
      type: String,
      enum: ["super_admin", "franchise_admin", "election_admin", "voter"],
    },
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
    },
    registrationNumber: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: Date,
    status: {
      type: String,
      enum: ["active", "inactive"],
    },
    electionAccess: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    }],
    isVoter: Boolean,
    onboardingCompleted: { type: Boolean, default: false },
    voterMetadata: {
      prefix: String,
      sequenceNumber: Number,
      electionGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ElectionGroup",
      }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
