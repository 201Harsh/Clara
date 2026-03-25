import { Request, Response } from "express";
import { generateTokens, setRefreshCookie } from "../utils/user-utils.js";
import jwt from "jsonwebtoken";
import UserModel from "../models/user-model.js";

interface GoogleUser {
  _id: string;
  email: string;
}

export const RegisterAndLoginUsingGoogle = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user as GoogleUser;

    if (!user || !user._id) {
      return res.redirect(`${process.env.CLIENT_SIDE_URL}/signup?error=NoUser`);
    }

    const tokens = generateTokens(user._id.toString());

    setRefreshCookie(res, tokens.refreshToken);

    return res.redirect(
      `${process.env.CLIENT_SIDE_URL}/dashboard?token=${tokens.accessToken}`,
    );
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.redirect(
      `${process.env.CLIENT_SIDE_URL}/signup?error=AuthFailed`,
    );
  }
};

export const RefreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.clara_refresh;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Unauthorized. No Refresh Token found." });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as { userId: string };

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ error: "Forbidden. User not found." });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "15m") as any },
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error: any) {
    console.error("Refresh Token Error:", error.message);
    return res
      .status(403)
      .json({ error: "Forbidden. Token expired or invalid." });
  }
};
