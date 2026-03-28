import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export const AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      req.cookies?.clara_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "Unauthorized Access!",
      });
      return;
    }

    const decodedToken = jwt.verify(token, process.env.CLARA_TOKEN_SECRET!);

    if (!decodedToken) {
      res.status(401).json({
        message: "Invalid/Expired Token!",
      });
      return;
    }

    req.user = decodedToken;

    next();
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
    return;
  }
};
