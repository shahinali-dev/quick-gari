/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// config/socket.config.ts
import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import config from ".";

class SocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, string> = new Map();

  initialize(httpServer: HTTPServer) {
    const isDevelopment = config.NODE_ENV === "development";

    this.io = new Server(httpServer, {
      cors: {
        origin: isDevelopment ? "*" : process.env.CLIENT_URL?.split(",") || "*",
        credentials: true,
        methods: ["GET", "POST"],
        pingTimeout: 60000,
        pingInterval: 25000,
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      // User connects with their userId
      socket.on("user:connect", (userId: string) => {
        this.connectedUsers.set(userId, socket.id);
        console.log(`✅ User ${userId} connected with socket ${socket.id}`);

        // Join user to their personal room
        socket.join(`user:${userId}`);
      });

      // User disconnects
      socket.on("disconnect", () => {
        // Remove user from connected users
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`❌ User ${userId} disconnected`);
            break;
          }
        }
      });
    });

    return this.io;
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`📤 Sent ${event} to user ${userId}`);
  }

  // Send notification to all car owners
  sendToCarOwners(userIds: string[], event: string, data: any) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    userIds.forEach((userId) => {
      this.io!.to(`user:${userId}`).emit(event, data);
    });

    console.log(`📤 Sent ${event} to ${userIds.length} car owners`);
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }

    this.io.emit(event, data);
    console.log(`📢 Broadcasted ${event}`);
  }

  getIO() {
    if (!this.io) {
      throw new Error("Socket.IO not initialized. Call initialize() first.");
    }
    return this.io;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export const socketService = new SocketService();
