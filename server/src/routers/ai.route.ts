import express from "express";
import { ClaraAgent } from "../controllers/ai.controller.js";

const aiRouter = express.Router();

aiRouter.post("/clara", ClaraAgent);


export default aiRouter;
