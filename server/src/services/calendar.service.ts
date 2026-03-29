import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import UserModel from "../models/user-model.js"; 

export const getTodaysMeetings = async (
  userId: string, 
  googleAccessToken: string,
  googleRefreshToken: string,
) => {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: googleAccessToken,
    refresh_token: googleRefreshToken,
  });

  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      const updateData: any = { googleAccessToken: tokens.access_token };
      if (tokens.refresh_token) {
        updateData.googleRefreshToken = tokens.refresh_token;
      }

      await UserModel.findByIdAndUpdate(userId, { $set: updateData });
      console.log(
        `[Auth] Google tokens auto-refreshed and saved for ${userId}`,
      );
    }
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const meetings = response.data.items?.filter(
    (event) =>
      event.hangoutLink ||
      (event.location && event.location.includes("zoom.us")),
  );

  return (
    meetings?.map((m) => ({
      id: m.id,
      title: m.summary,
      startTime: m.start?.dateTime,
      endTime: m.end?.dateTime,
      link: m.hangoutLink || m.location,
      creator: m.creator?.email,
    })) || []
  );
};
