import mongoose from "mongoose";

const meetingRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  googleEventId: {
    type: String,
    required: true,
  },
  botId: {
    type: String,
    required: true,
  },
  meetingTitle: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
  transcriptUrl: {
    type: String,
  },
  status: {
    type: String,
    default: "completed",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("MeetingRecord", meetingRecordSchema);
