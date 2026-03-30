import { Router } from "express";
import { handleBaasCallback } from "../controllers/webhook.controller.js";

const WebhookRouter = Router();

WebhookRouter.post("/baas", handleBaasCallback);

export default WebhookRouter;
