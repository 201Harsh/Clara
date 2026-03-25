import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import {
  GetDailyMeetings,
  SyncCalendar,
} from "../controllers/calendar.controller.js";

const calendarRouter = Router();

calendarRouter.get("/today", AuthMiddleware, GetDailyMeetings);

calendarRouter.post("/sync", AuthMiddleware, SyncCalendar);

export default calendarRouter;
