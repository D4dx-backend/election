const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
    },
    organization: String,
    title: String,
    electionDate: Date,
    numberToBeElected: Number,
    nomineeDisplayOrder: String,
    maxVoters: Number,
    maxNominees: Number,
    maleMinimum: Number,
    femaleMinimum: Number,
    selfRegOpen: Boolean,
    votingOpen: Boolean,
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
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
    },
    logo: {
      url: String,
      alt: String,
    },
    electionGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElectionGroup",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Election", ElectionSchema);
