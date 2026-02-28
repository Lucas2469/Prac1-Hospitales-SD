import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    ipAddress: { type: String, required: true },
    alias: { type: String, default: "" },
    region: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "NO_REPORTA"], default: "ACTIVE" },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export default mongoose.model("Client", ClientSchema);