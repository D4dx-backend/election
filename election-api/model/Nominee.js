const mongoose = require("mongoose");

const NomineeSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    },
    name: String,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    position: Number,
    photo: {
      url: String,
      alt: String,
    },
    bio: String,
    additionalInfo: Object,
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
      enum: ["active", "withdrawn", "disqualified"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Nominee", NomineeSchema);
