import jwt from "jsonwebtoken";
import { Response } from "express";
import mongoose from "mongoose";

const CLARA_TOKEN_SECRET = process.env.CLARA_TOKEN_SECRET as string;

export const generateToken = (userId: string | mongoose.Types.ObjectId) => {
  const refreshToken = jwt.sign({ userId }, CLARA_TOKEN_SECRET);

  return refreshToken;
};

export const setTokenCookie = (res: Response, Token: string) => {
  res.cookie("clara_token", Token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie("clara_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};
