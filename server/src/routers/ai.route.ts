import express from "express";
import { ClaraAgent } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

const aiRouter = express.Router();

aiRouter.post("/clara", AuthMiddleware, ClaraAgent);

export default aiRouter;
