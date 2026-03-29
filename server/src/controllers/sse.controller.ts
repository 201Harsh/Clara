import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { addSseClient, removeSseClient } from "../services/sse.service.js";

export const establishSseStream = async (
  req: Request,
  res: Response,
): Promise<any> => {
  // Native EventSource requires the token in the query string
  const token = req.query.clara_token as string;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  try {
    // Manually verify the JWT since we bypassed the standard header auth middleware
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const userId = decoded.userId || decoded.id || decoded._id;

    // 1. Set the mandatory headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish the connection immediately

    // 2. Register the client in our Switchboard
    addSseClient(userId, res);

    // 3. Send an initial handshake event
    res.write(`event: connected\n`);
    res.write(`data: {"message": "Clara Secure Uplink Active"}\n\n`);

    // 4. Heartbeat: Send an empty comment every 30 seconds to keep the connection alive
    const heartbeat = setInterval(() => {
      res.write(`:\n\n`);
    }, 30000);

    // 5. Cleanup when the user closes the dashboard tab
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
