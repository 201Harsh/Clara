import express from "express";
import { ClaraAgent } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";
import { generateMissionReport } from "../controllers/summary.controller.js";

const aiRouter = express.Router();

aiRouter.post("/clara", AuthMiddleware, ClaraAgent);

aiRouter.get("/report/:googleEventId", AuthMiddleware, generateMissionReport);

export default aiRouter;
