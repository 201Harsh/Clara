import express from 'express';
import { TriageMeetings } from '../controllers/ai.controller.js';
import { AuthMiddleware } from '../middlewares/auth-middleware.js';

const aiRouter = express.Router();

// Triggers the autonomous calendar sweep and AI decision matrix
aiRouter.post('/clara/triage', AuthMiddleware, TriageMeetings);

export default aiRouter;