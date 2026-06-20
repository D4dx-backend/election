const mongoose = require("mongoose");

const ElectionAnalyticsSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    },
    totalVoters: Number,
    totalVotesCast: Number,
    pendingVoters: Number,
    nomineeResults: [{
      nomineeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Nominee",
      },
      nomineeName: String,
      voteCount: Number,
      percentage: Number,
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isFinalized: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ElectionAnalytics", ElectionAnalyticsSchema);
