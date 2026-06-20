const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: String,
    entityType: String,
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    details: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
