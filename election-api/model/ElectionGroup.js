const mongoose = require("mongoose");

const ElectionGroupSchema = new mongoose.Schema(
  {
    franchiseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Franchise",
    },
    name: String,
    description: String,
    elections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    }],
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

module.exports = mongoose.model("ElectionGroup", ElectionGroupSchema);
