import "../src/config/dotenv.js";
import connectDB from "./database/mongodb.js";
import app from "./app.js";
import http from "http";

const server = http.createServer(app);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectDB();
});
