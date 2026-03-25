import express from "express";
import userRouter from "./routers/user.route.js";
import aiRouter from "./routers/ai.route.js";
import calendarRouter from "./routers/calendar.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);
app.use("/ai", aiRouter);
app.use("/calendat", calendarRouter);

export default app;
