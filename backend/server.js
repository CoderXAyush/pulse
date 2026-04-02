const app = require("./app");
const http = require("http");
const connectDB = require("./config/db");
const { port } = require("./config/env");
const { initSocket } = require("./sockets");
const { migrateTenantData } = require("./services/migrateTenantData");

async function startServer() {
  await connectDB();
  await migrateTenantData();
  const server = http.createServer(app);
  initSocket(server);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Another Pulse backend (or other app) may be running — stop it or set PORT in backend/.env to a free port.`
      );
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
