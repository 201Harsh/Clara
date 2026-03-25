import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const getTodaysMeetings = async (
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

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Get start and end of today
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

  // Filter out events that don't have a Google Meet/Zoom link
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
