import jwt from "jsonwebtoken";
import { Response } from "express";
import mongoose from "mongoose";

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

const ACCESS_TOKEN_EXPIRY =
  (process.env.ACCESS_TOKEN_EXPIRY as string) || "15m";
const REFRESH_TOKEN_EXPIRY =
  (process.env.REFRESH_TOKEN_EXPIRY as string) || "7d";

export const generateTokens = (userId: string | mongoose.Types.ObjectId) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY as any,
  });

  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY as any,
  });

  return { accessToken, refreshToken };
};

export const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie("clara_refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie("clara_refresh", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};
