import { Request, Response } from "express";
import { addSseClient, removeSseClient } from "../services/sse.service.js";

// NOTE: Make sure your route looks like this:
// router.get("/stream", AuthMiddleware, establishSseStream);

export const establishSseStream = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    // The AuthMiddleware already decoded the token and attached the user!
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized Stream Access." });
    }

    // 1. Set the mandatory headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 2. Register the client in our Switchboard
    addSseClient(userId, res);

    // 3. Send an initial handshake event
    res.write(`event: connected\n`);
    res.write(`data: {"message": "Clara Secure Uplink Active"}\n\n`);

    // 4. Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`:\n\n`);
    }, 30000);

    // 5. Cleanup when user closes tab
    req.on("close", () => {
      clearInterval(heartbeat);
      removeSseClient(userId);
      res.end();
    });
  } catch (error) {
    console.error("SSE Connection Error:", error);
    return res.status(500).end();
  }
};
