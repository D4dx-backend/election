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

// Guarantee one ballot per voter per election even under concurrent requests
// (double-click / retry / parallel calls). The check-then-create logic in the
// controller cannot prevent a race on its own; this unique index does.
VoteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", VoteSchema);
