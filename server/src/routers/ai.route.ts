import express from "express";
import { ClaraAgent, TriageMeetings } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

const aiRouter = express.Router();

aiRouter.post("/clara", ClaraAgent);

aiRouter.post("/clara/triage", AuthMiddleware, TriageMeetings);

export default aiRouter;
