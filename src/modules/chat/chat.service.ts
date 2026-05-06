// modules/chat/chat.service.ts
import httpStatus from "http-status";
import { Types } from "mongoose";
import { socketService } from "../../config/socket.config";
import { AppError } from "../../errors/app_error";
import { ChatContextType, MessageModel } from "./chat.model";
import { ConversationModel } from "./conversation.model";

class ChatService {
  // ─── Conversation helpers ──────────────────────────────────────────────────

  /**
   * Booking confirm হলে conversation তৈরি করো।
   * ride/return/share_vehicle — payment বা accept এর পরে call করো।
   */
  async createConversation(
    contextType: ChatContextType,
    contextId: string,
    participantIds: string[],
  ) {
    // আগে থেকে থাকলে নতুন বানাবে না
    const existing = await ConversationModel.findOne({
      contextType,
      contextId: new Types.ObjectId(contextId),
    });

    if (existing) return existing;

    return ConversationModel.create({
      contextType,
      contextId: new Types.ObjectId(contextId),
      participants: participantIds.map((id) => new Types.ObjectId(id)),
      isActive: true,
    });
  }

  /**
   * OTP verify হলে conversation বন্ধ করো — read-only হয়ে যাবে।
   * ride, return, share_vehicle তিনটার জন্যই এক জায়গা থেকে call করা যাবে।
   */
  async closeConversation(contextType: ChatContextType, contextId: string) {
    const conversation = await ConversationModel.findOneAndUpdate(
      {
        contextType,
        contextId: new Types.ObjectId(contextId),
        isActive: true, // শুধু active টাকেই close করো
      },
      {
        isActive: false,
        closedAt: new Date(),
      },
      { new: true },
    );

    if (!conversation) return null;

    // দুজন participant কেই socket দিয়ে জানাও
    for (const participantId of conversation.participants) {
      socketService.sendToUser(participantId.toString(), "chat:closed", {
        contextType,
        contextId,
        message: "Ride has started. Chat is now read-only.",
      });
    }

    return conversation;
  }

  // ─── Message ───────────────────────────────────────────────────────────────

  async sendMessage(
    contextType: ChatContextType,
    contextId: string,
    senderId: string,
    receiverId: string,
    message: string,
  ) {
    if (!message?.trim()) {
      throw new AppError(httpStatus.BAD_REQUEST, "Message cannot be empty");
    }

    if (senderId === receiverId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot send message to yourself",
      );
    }

    // Conversation active আছে কিনা চেক করো
    const conversation = await ConversationModel.findOne({
      contextType,
      contextId: new Types.ObjectId(contextId),
    });

    if (!conversation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No conversation found for this booking",
      );
    }

    if (!conversation.isActive) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Chat is closed. Ride has already started.",
      );
    }

    try {
      const saved = await MessageModel.create({
        contextType,
        contextId: new Types.ObjectId(contextId),
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(receiverId),
        message: message.trim(),
        isRead: false,
      });

      const payload = {
        _id: saved._id.toString(),
        contextType,
        contextId,
        senderId,
        receiverId,
        message: saved.message,
        isRead: false,
        createdAt: saved.createdAt,
      };

      // Receiver এবং sender দুজনকেই emit (multi-device sync)
      socketService.sendToUser(receiverId, "chat:message", payload);
      socketService.sendToUser(senderId, "chat:message", payload);

      return saved;
    } catch {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send message",
      );
    }
  }

  // ─── Read helpers ──────────────────────────────────────────────────────────

  async getConversation(
    contextType: ChatContextType,
    contextId: string,
    userId: string,
    limit = 50,
  ) {
    // Conversation exist করে কিনা চেক
    const conversation = await ConversationModel.findOne({
      contextType,
      contextId: new Types.ObjectId(contextId),
    });

    if (!conversation) {
      throw new AppError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    const messages = await MessageModel.find({
      contextType,
      contextId: new Types.ObjectId(contextId),
      $or: [
        { senderId: new Types.ObjectId(userId) },
        { receiverId: new Types.ObjectId(userId) },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate("senderId", "name avatar")
      .populate("receiverId", "name avatar");

    return {
      isActive: conversation.isActive, // frontend জানবে chat open না closed
      closedAt: conversation.closedAt,
      messages,
    };
  }

  async markConversationAsRead(
    contextType: ChatContextType,
    contextId: string,
    userId: string,
  ) {
    await MessageModel.updateMany(
      {
        contextType,
        contextId: new Types.ObjectId(contextId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string, contextType?: ChatContextType) {
    const query: Record<string, unknown> = {
      receiverId: new Types.ObjectId(userId),
      isRead: false,
    };
    if (contextType) query.contextType = contextType;
    return MessageModel.countDocuments(query);
  }
}

export const chatService = new ChatService();
