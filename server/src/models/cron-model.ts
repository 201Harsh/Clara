import mongoose from "mongoose";

const cronJobSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    googleEventId: { type: String, required: true },
    meetingTitle: { type: String, required: true },
    meetLink: { type: String, required: true },
    status: {
      type: String,
      enum: ["triggered", "in-meeting", "completed", "failed"],
      default: "triggered",
    },
    triggeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("CronJob", cronJobSchema);
