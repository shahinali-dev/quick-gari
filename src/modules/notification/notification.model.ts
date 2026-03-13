import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

export type NotificationType =
  | "RIDE_REQUEST"
  | "PAYMENT_SUBMITTED"
  | "CAR_REGISTRATION"
  | "RIDE_ACCEPTED"
  | "PAYMENT_VERIFIED";

export type NotificationAudience = "user" | "admin";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    audience: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    type: { type: String, required: true },
    message: { type: String, required: true },

    rideId: { type: Schema.Types.ObjectId, ref: "Ride" },
    carId: { type: Schema.Types.ObjectId, ref: "Car" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);
