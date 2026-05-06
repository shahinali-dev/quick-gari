// modules/chat/conversation.model.ts
import { model, Schema, Types } from "mongoose";
import { ChatContextType } from "./chat.model";

export interface IConversation {
  _id?: Types.ObjectId;
  contextType: ChatContextType;
  contextId: Types.ObjectId;
  participants: Types.ObjectId[];
  isActive: boolean;
  closedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    contextType: {
      type: String,
      enum: ["ride", "return", "share_vehicle"],
      required: true,
    },
    contextId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

// contextType + contextId দিয়ে conversation lookup — unique
ConversationSchema.index({ contextType: 1, contextId: 1 }, { unique: true });

export const ConversationModel = model<IConversation>(
  "Conversation",
  ConversationSchema,
);
