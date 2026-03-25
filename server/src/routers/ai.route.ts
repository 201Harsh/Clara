import express from "express";
import { ClaraAI } from "../controllers/ai.controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

const aiRouter = express.Router();

aiRouter.post("/clara", AuthMiddleware, ClaraAI);

export default aiRouter;
