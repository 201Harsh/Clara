import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import {
  GetDailyMeetings,
  SyncCalendar,
} from "../controllers/calendar.controller.js";

const calendarRouter = Router();

// Used by the Dashboard to instantly load the UI
calendarRouter.get("/today", AuthMiddleware, GetDailyMeetings);

// Used by the "Refresh/Scan" button on the Dashboard, or the 8 AM Cron Job
calendarRouter.post("/sync", AuthMiddleware, SyncCalendar);

export default calendarRouter;
