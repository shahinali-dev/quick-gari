import { Types } from "mongoose";
import { NotificationType } from "./notification.enum";

export interface INotification {
  userId: Types.ObjectId;
  rideId: Types.ObjectId;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}
