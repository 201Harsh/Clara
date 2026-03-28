import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { GetAllMeetings } from "../controllers/calendar.controller.js";

const calendarRouter = <Router>Router();

calendarRouter.get("/all/meetings", AuthMiddleware , GetAllMeetings);


export default calendarRouter;