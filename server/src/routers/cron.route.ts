import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { getCronLogs } from "../controllers/cron.controller.js";

const cronRouter = Router();

cronRouter.get("/get", AuthMiddleware, getCronLogs);

export default cronRouter;
