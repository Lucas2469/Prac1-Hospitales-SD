import mongoose from "mongoose";

const DiskSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },     // C: , /dev/sda1, etc.
    type: { type: String, default: "" },     // SSD/HDD (si lo mandan)
    total: { type: Number, required: true }, // en GB (o MB, pero consistente)
    used: { type: Number, required: true },
    free: { type: Number, required: true },
    percent: { type: Number, required: true } // 0-100
  },
  { _id: false }
);

const MetricSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: () => new Date(), index: true }, // UTC
    statusSnapshot: { type: String, enum: ["ACTIVE", "NO_REPORTA"], default: "ACTIVE" },
    disks: { type: [DiskSchema], default: [] }, // puedes mandar 1 disco (primer disco)
    note: { type: String, default: "" } // opcional
  },
  { timestamps: true }
);

// Índice útil para consultas por cliente y tiempo
MetricSchema.index({ clientId: 1, timestamp: -1 });

export default mongoose.model("Metric", MetricSchema);