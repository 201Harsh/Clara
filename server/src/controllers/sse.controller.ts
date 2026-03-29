import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { addSseClient, removeSseClient } from "../services/sse.service.js";

export const establishSseStream = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const token = req.query.clara_token as string;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const userId = decoded.userId || decoded.id || decoded._id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish the connection immediately

    addSseClient(userId, res);

    res.write(`event: connected\n`);
    res.write(`data: {"message": "Clara Secure Uplink Active"}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(`:\n\n`);
    }, 30000);

    req.on("close", () => {
      clearInterval(heartbeat);
      removeSseClient(userId);
      res.end();
    });
  } catch (error) {
    console.error("SSE Auth Error:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
