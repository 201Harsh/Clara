import mongoose, { Document, Schema } from "mongoose";

export interface IMeeting {
  googleEventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  meetLink: string;
  decision: "human" | "bot" | "skipped";
  reason: string;
  status: "scheduled" | "infiltrated" | "completed" | "failed";
}

export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date; 
  meetings: IMeeting[];
}

const MeetingSchema: Schema = new Schema({
  googleEventId: { type: String, required: true },
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetLink: { type: String },
  decision: { type: String, enum: ["human", "bot", "skipped"], required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["scheduled", "infiltrated", "completed", "failed"],
    default: "scheduled",
  },
});

const CalendarEventSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    meetings: [MeetingSchema],
  },
  { timestamps: true },
);

CalendarEventSchema.index({ userId: 1, date: 1 }, { unique: true });

const CalendarEventModel = mongoose.model<ICalendarEvent>(
  "CalendarEvent",
  CalendarEventSchema,
);
export default CalendarEventModel;
