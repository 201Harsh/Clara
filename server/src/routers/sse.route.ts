import { Router } from "express";
import { establishSseStream } from "../controllers/sse.controller.js";

const sseRouter = Router();

sseRouter.get("/stream", establishSseStream);

export default sseRouter;
