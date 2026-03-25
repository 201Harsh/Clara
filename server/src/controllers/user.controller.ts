import { Request, Response } from "express";
import { generateTokens, setRefreshCookie } from "../utils/user-utils.js";

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
    console.log(tokens)

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
