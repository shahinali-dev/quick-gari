/* eslint-disable no-console */
// config/socket.config.ts
import { Server as HTTPServer } from "http";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import config from ".";
import { ChatContextType, MessageModel } from "../modules/chat/chat.model";
import { ConversationModel } from "../modules/chat/conversation.model";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationPayload {
  _id?: string;
  type: string;
  message: string;
  refs?: { rideId?: string; carId?: string; paymentId?: string };
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ride?: Record<string, unknown>;
}

export interface ChatPayload {
  _id?: string;
  contextType: ChatContextType;
  contextId: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

export interface ChatClosedPayload {
  contextType: ChatContextType;
  contextId: string;
  message: string;
}

interface UserConnectData {
  userId: string;
  role: string;
  isCarOwner?: boolean;
}

interface TypingData {
  contextType: ChatContextType;
  contextId: string;
  senderId: string;
  receiverId: string;
}

interface ChatReadData {
  contextType: ChatContextType;
  contextId: string;
  userId: string;
}

// ─── SocketService ────────────────────────────────────────────────────────────

class SocketService {
  private io: Server | null = null;
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

      // ─── User join ───────────────────────────────────────────────────────────
      // Client: socket.emit("user:connect", { userId, role, isCarOwner })
      socket.on("user:connect", (data: UserConnectData) => {
        const { userId, role, isCarOwner } = data;

        this.connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);

        if (role === "admin") {
          socket.join("room:admin");
          console.log(`🛡️ Admin ${userId} joined room:admin`);
        }

        if (isCarOwner) {
          socket.join("room:car-owners");
          console.log(`🚗 Car owner ${userId} joined room:car-owners`);
        }

        console.log(`✅ User ${userId} (${role}) connected: ${socket.id}`);
      });

      // ─── Chat: typing indicator ──────────────────────────────────────────────
      // Client: socket.emit("chat:typing", { contextType, contextId, senderId, receiverId })
      socket.on("chat:typing", (data: TypingData) => {
        this.io?.to(`user:${data.receiverId}`).emit("chat:typing", {
          contextType: data.contextType,
          contextId: data.contextId,
          senderId: data.senderId,
        });
      });

      // Client: socket.emit("chat:stop_typing", { contextType, contextId, senderId, receiverId })
      socket.on("chat:stop_typing", (data: TypingData) => {
        this.io?.to(`user:${data.receiverId}`).emit("chat:stop_typing", {
          contextType: data.contextType,
          contextId: data.contextId,
          senderId: data.senderId,
        });
      });

      // ─── Chat: mark read via socket ──────────────────────────────────────────
      // Client: socket.emit("chat:read", { contextType, contextId, userId })
      // REST API তেও আছে — যেটা সুবিধা সেটা use করো
      socket.on("chat:read", async (data: ChatReadData) => {
        try {
          const conversation = await ConversationModel.findOne({
            contextType: data.contextType,
            contextId: new Types.ObjectId(data.contextId),
          });

          if (!conversation) return;

          await MessageModel.updateMany(
            {
              contextType: data.contextType,
              contextId: new Types.ObjectId(data.contextId),
              receiverId: new Types.ObjectId(data.userId),
              isRead: false,
            },
            { isRead: true },
          );

          console.log(
            `✅ chat:read — ${data.contextType}/${data.contextId} by ${data.userId}`,
          );
        } catch (err) {
          console.error("chat:read error:", err);
        }
      });

      // ─── Disconnect ──────────────────────────────────────────────────────────
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

  // ─── Notification emitters ────────────────────────────────────────────────

  /** একজন specific user কে পাঠাও — notification বা chat দুটোর জন্যই */
  sendToUser(
    userId: string,
    event: string,
    data: NotificationPayload | ChatPayload | ChatClosedPayload,
  ) {
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
    console.log(`📢 Sent '${event}' to room:admin`);
  }

  /** room:car-owners এ single emit — N+1 loop এর বদলে */
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

  /** User এখন online আছে কিনা */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

export const socketService = new SocketService();
