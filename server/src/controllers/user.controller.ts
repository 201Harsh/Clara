import { Request, Response } from "express";

interface GoogleUser {
  _id: string;
  email: string;
  JwtGenToken: () => string;
}

export const RegisterAndLoginUsingGoogle = async (
  req: Request,
  res: Response,
) => {
  try {
    const user = req.user as GoogleUser;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_SIDE_URL}/signup?error=NoUser`);
    }

    
  } catch (error) {
    console.log(error);
    return res.redirect(
      `${process.env.CLIENT_SIDE_URL}/signup?error=AuthFailed`,
    );
  }
};
