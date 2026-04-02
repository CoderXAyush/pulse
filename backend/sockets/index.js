const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

let ioInstance;

function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.organizationId) {
        socket.join(`org:${decoded.organizationId}`);
      }
    } catch {
      // Invalid or expired token: connect without org room; client should refresh auth for live progress.
    }
    return next();
  });

  ioInstance.on("connection", (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO,
};
