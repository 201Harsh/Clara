import express from "express";
import userRouter from "./routers/user.route.js";
import aiRouter from "./routers/ai.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import calendarRouter from "./routers/calendar.route.js";
import cronRouter from "./routers/cron.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use("/users", userRouter);
app.use("/ai", aiRouter);
app.use("/calendar", calendarRouter);
app.use("/cron", cronRouter);

export default app;
