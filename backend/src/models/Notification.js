import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
    {
        clientId: { type: String, required: true, index: true },
        message: { type: String, required: true },
        type: { type: String, default: "NOTIFICATION" },
        read: { type: Boolean, default: false },
        sentAt: { type: Date, default: () => new Date() },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
