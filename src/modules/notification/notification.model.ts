import { model, Schema } from "mongoose";
import { NotificationType } from "./notification.enum";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rideId: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);
