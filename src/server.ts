import http from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { socketService } from "./config/socket.config";
import { createDefaultAdmin } from "./utils/admin_bootstrap";

async function main() {
  try {
    await mongoose.connect(config.DB as string);
    await createDefaultAdmin();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    socketService.initialize(httpServer);

    httpServer.listen(config.PORT, () => {
      console.log(`Express app is listening on port ${config.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
