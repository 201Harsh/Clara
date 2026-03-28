import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/user-model.js";
import { generateToken, setTokenCookie } from "../utils/user-utils.js";

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

    const token = generateToken(user._id.toString());

    setTokenCookie(res, token);

    return res.redirect(
      `${process.env.CLIENT_URL}/dashboard?SignupSuccess=true`,
    );
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.redirect(
      `${process.env.CLIENT_SIDE_URL}/signup?error=AuthFailed`,
    );
  }
};


export const GetProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;

    const user = await UserModel.findById(userId).select("name email role");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const UpdateRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const userPayload = (req as any).user;
    const userId = userPayload?.userId || userPayload?.id || userPayload?._id;
    const { role } = req.body;

    if (!role) return res.status(400).json({ error: "Role is required" });

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    );
    return res.status(200).json({ message: "Role updated", user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update role" });
  }
};
