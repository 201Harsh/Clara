import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import UserModel from "../models/user-model.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientID || !clientSecret) {
  throw new Error(
    "Google OAuth credentials are missing in environment variables",
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: "/users/google/callback",
      proxy: true,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        let user = await UserModel.findOne({ email });

        if (user) {
          // 1. Update the access token every time they log in so Clara has fresh API access
          user.googleAccessToken = accessToken;

          // 2. Google ONLY sends a refresh token on the first login.
          // We must check if it exists before saving, otherwise we overwrite the good one with undefined.
          if (refreshToken) {
            user.googleRefreshToken = refreshToken;
          }

          if (!user.googleId) {
            user.googleId = googleId;
          }

          await user.save();
          return done(null, user);
        }

        // 3. For new users, save everything immediately
        const newUser = await UserModel.create({
          name: profile.displayName,
          email,
          googleId,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
        });

        return done(null, newUser);
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(
          error instanceof Error ? error : new Error("Google Auth Failed"),
          undefined,
        );
      }
    },
  ),
);

export default passport;
