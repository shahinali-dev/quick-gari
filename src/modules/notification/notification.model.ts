import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

export type NotificationType =
  | "RIDE_REQUEST"
  | "PAYMENT_SUBMITTED"
  | "CAR_REGISTRATION"
  | "CAR_REGISTRATION_APPROVED"
  | "RIDE_ACCEPTED"
  | "PAYMENT_VERIFIED"
  | "NEW_PROPOSAL"
  | "PROPOSAL_ACCEPTED"
  | "GOT_RETURN_TRIP_BOOKING"
  | "RIDE_TAKEN";

export type NotificationAudience = "user" | "admin" | "car_owner";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    audience: {
      type: String,
      enum: ["user", "admin", "car_owner"],
      required: true,
    },
    type: { type: String, required: true },
    message: { type: String, required: true },

    rideId: { type: Schema.Types.ObjectId, ref: "Ride" },
    returnRideId: { type: Schema.Types.ObjectId, ref: "Return" },

    carId: { type: Schema.Types.ObjectId, ref: "Car" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    proposalId: { type: Schema.Types.ObjectId },

    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema,
);
