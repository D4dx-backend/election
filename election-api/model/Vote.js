const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    },
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    nominees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nominee",
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    deviceInfo: String,
    status: {
      type: String,
      enum: ["completed", "partial", "rejected"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vote", VoteSchema);
