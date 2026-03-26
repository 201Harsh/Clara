import { Router } from "express";
import passport from "../lib/passport.js";
import { GetProfile, RefreshAccessToken, RegisterAndLoginUsingGoogle, UpdateRole } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middlewares/auth-middleware.js";

const userRouter = <Router>Router();

userRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    accessType: "offline",
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  }),
);

userRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/signin",
  }),
  RegisterAndLoginUsingGoogle,
);

userRouter.get("/refresh", RefreshAccessToken);

userRouter.get("/profile", AuthMiddleware, GetProfile);
userRouter.put("/role", AuthMiddleware, UpdateRole);

export default userRouter;
