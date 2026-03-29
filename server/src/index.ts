import "../src/config/dotenv.js";
import connectDB from "./database/mongodb.js";
import app from "./app.js";
import http from "http";
import { startMeetingCronJob } from "./cron/meeting-bot.cron.js";

const server = http.createServer(app);

const port = process.env.PORT || 5000;

// Call it right before or after your app.listen block
startMeetingCronJob();

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectDB();
});
