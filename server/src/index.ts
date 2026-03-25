import app from "./app.js";
import http from "http";
import "../src/config/dotenv.js";

const server = http.createServer(app);

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
