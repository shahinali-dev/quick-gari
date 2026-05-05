/* eslint-disable no-console */
// config/socket.config.ts
import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import config from ".";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  _id?: string;
  type: string;
  message: string;
  refs?: {
    rideId?: string;
    carId?: string;
    paymentId?: string;
  };
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ride?: Record<string, unknown>;
}

interface UserConnectData {
  userId: string;
  role: string;
  isCarOwner?: boolean;
}

// ─── SocketService ────────────────────────────────────────────────────────────

class SocketService {
  private io: Server | null = null;

  // userId → socketId mapping (online check এর জন্য রাখা হয়েছে)
  private connectedUsers: Map<string, string> = new Map();

  // ─── Initialize ─────────────────────────────────────────────────────────────

  initialize(httpServer: HTTPServer) {
    const isDevelopment = config.NODE_ENV === "development";

    this.io = new Server(httpServer, {
      cors: {
        origin: isDevelopment ? "*" : process.env.CLIENT_URL?.split(",") || "*",
        credentials: true,
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`⚡ New client connected: ${socket.id}`);

      socket.on("user:connect", (data: UserConnectData) => {
        const { userId, role, isCarOwner } = data;

        // পুরনো socket থাকলে replace করো
        this.connectedUsers.set(userId, socket.id);

        // প্রতিটা user তার নিজের room এ থাকবে
        socket.join(`user:${userId}`);

        // Admin room
        if (role === "admin") {
          socket.join("room:admin");
          console.log(`🛡️ Admin ${userId} joined room:admin`);
        }

        // Car owner room — N+1 emit এড়াতে dedicated room
        if (isCarOwner) {
          socket.join("room:car-owners");
          console.log(`🚗 Car owner ${userId} joined room:car-owners`);
        }

        console.log(
          `✅ User ${userId} (${role}) connected with socket ${socket.id}`,
        );
      });

      socket.on("disconnect", () => {
        for (const [userId, socketId] of this.connectedUsers.entries()) {
          if (socketId === socket.id) {
            this.connectedUsers.delete(userId);
            console.log(`❌ User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  // ─── Emit helpers ────────────────────────────────────────────────────────────

  /** একজন specific user কে notification পাঠাও */
  sendToUser(userId: string, event: string, data: NotificationPayload) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }
    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`📤 Sent '${event}' to user ${userId}`);
  }

  /** room:admin এ সব admin কে একসাথে পাঠাও */
  sendToAllAdmins(event: string, data: NotificationPayload) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }
    this.io.to("room:admin").emit(event, data);
    console.log(`📢 Sent '${event}' to all admins in room:admin`);
  }

  /**
   * room:car-owners এ single emit — আগের N+1 loop replace করা হয়েছে।
   * Client connect এ isCarOwner: true পাঠালে এই room এ join হবে।
   */
  sendToCarOwners(event: string, data: NotificationPayload) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }
    this.io.to("room:car-owners").emit(event, data);
    console.log(`📤 Sent '${event}' to room:car-owners`);
  }

  /** সব connected user কে broadcast */
  broadcast(event: string, data: NotificationPayload) {
    if (!this.io) {
      console.error("Socket.IO not initialized");
      return;
    }
    this.io.emit(event, data);
    console.log(`📢 Broadcasted '${event}'`);
  }

  // ─── Utils ───────────────────────────────────────────────────────────────────

  getIO() {
    if (!this.io) {
      throw new Error("Socket.IO not initialized. Call initialize() first.");
    }
    return this.io;
  }

  /** User এখন online আছে কিনা চেক করো */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export const socketService = new SocketService();
