/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { socketService } from "../../config/socket.config";
import UserModel from "../user/user.model";
import { INotification } from "./notification.interface";
import { NotificationModel } from "./notification.model";

class NotificationService {
  // Send notification to all car owners
  async sendToCarOwners(rideId: Types.ObjectId, rideData: any) {
    try {
      // Get all car owners
      const carOwners = await UserModel.find({ isCarOwner: true }).select(
        "_id",
      );

      if (carOwners.length === 0) {
        console.log("⚠️ No car owners found");
        return;
      }

      const message = `New ride request: ${rideData.startLocation} → ${rideData.endLocation}`;

      // Save notifications to database
      const notifications = carOwners.map((owner) => ({
        userId: owner._id,
        rideId,
        message,
        type: "RIDE_REQUEST" as const,
        isRead: false,
      }));

      await NotificationModel.insertMany(notifications);

      // Send real-time notifications via Socket.IO
      const userIds = carOwners.map((owner) => owner._id.toString());

      socketService.sendToCarOwners(userIds, "notification:new", {
        type: "RIDE_REQUEST",
        message,
        rideId: rideId.toString(),
        ride: rideData,
        timestamp: new Date(),
      });

      console.log(
        `✅ Sent ride request notification to ${carOwners.length} car owners`,
      );
    } catch (error) {
      console.error("❌ Error sending notifications to car owners:", error);
    }
  }

  // Send notification to specific user
  async notifyUser(
    userId: Types.ObjectId,
    rideId: Types.ObjectId,
    message: string,
    type: INotification["type"],
    additionalData?: any,
  ) {
    try {
      // Save to database
      const notification = await NotificationModel.create({
        userId,
        rideId,
        message,
        type,
        isRead: false,
      });

      // Send real-time notification via Socket.IO
      socketService.sendToUser(userId.toString(), "notification:new", {
        _id: notification._id,
        type,
        message,
        rideId: rideId.toString(),
        isRead: false,
        timestamp: new Date(),
        ...additionalData,
      });

      console.log(`✅ Sent ${type} notification to user ${userId}`);

      return notification;
    } catch (error) {
      console.error("❌ Error sending notification to user:", error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit = 20) {
    const notifications = await NotificationModel.find({ userId })
      .populate("rideId")
      .sort({ createdAt: -1 })
      .limit(limit);

    return notifications;
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true },
    );

    return notification;
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    const count = await NotificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return count;
  }
}

export const notificationService = new NotificationService();
