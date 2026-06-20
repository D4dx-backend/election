// model/Franchise.js
const mongoose = require("mongoose");

const FranchiseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    logo: {
      url: String,
      alt: String,
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
      enum: ["active", "inactive"],
      default: "active",
    },
    settings: {
      defaultElectionSettings: {
        nomineeDisplayOrder: String,
        maxVoters: Number,
        maxNominees: Number,
        maleMinimum: Number,
        femaleMinimum: Number,
        selfRegOpen: Boolean,
        votingOpen: Boolean,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Franchise", FranchiseSchema);