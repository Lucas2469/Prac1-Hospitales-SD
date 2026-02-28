import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: () => new Date(), index: true },
    level: { type: String, enum: ["INFO", "WARN", "ERROR"], default: "INFO" },
    message: { type: String, required: true },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

LogSchema.index({ clientId: 1, timestamp: -1 });

export default mongoose.model("Log", LogSchema);