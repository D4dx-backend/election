const mongoose = require("mongoose");

const VoterGroupSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
    },
    name: String,
    description: String,
    voters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Elections this voter group is linked to. Linking grants every voter in
    // the group access to those elections (see voterGroup controller sync).
    elections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    }],
    prefix: String,
    startingNumber: Number,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("VoterGroup", VoterGroupSchema);
