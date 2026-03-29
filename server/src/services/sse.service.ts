import { Response } from "express";

const clients = new Map<string, Response>();

export const addSseClient = (userId: string, res: Response) => {
  clients.set(userId, res);
  console.log(`[SSE] Clara Uplink established for user: ${userId}`);
};

export const removeSseClient = (userId: string) => {
  clients.delete(userId);
  console.log(`[SSE] Clara Uplink disconnected for user: ${userId}`);
};

export const broadcastToUser = (
  userId: string,
  eventType: string,
  data: any,
) => {
  const res = clients.get(userId);
  if (res) {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};
