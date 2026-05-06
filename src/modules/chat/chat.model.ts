// modules/chat/chat.model.ts
import { model, Schema, Types } from "mongoose";

export type ChatContextType = "ride" | "return" | "share_vehicle";

export interface IMessage {
  _id?: Types.ObjectId;
  contextType: ChatContextType;
  contextId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    contextType: {
      type: String,
      enum: ["ride", "return", "share_vehicle"],
      required: true,
    },
    contextId: { type: Schema.Types.ObjectId, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MessageSchema.index({ contextType: 1, contextId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export const MessageModel = model<IMessage>("Message", MessageSchema);
