import express from 'express';
import { ClaraChatbotTriage } from '../controllers/ai.controller.js';
import { AuthMiddleware } from '../middlewares/auth-middleware.js';

const aiRouter = express.Router();

aiRouter.post('/clara/triage', AuthMiddleware, ClaraChatbotTriage);

export default aiRouter;