/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { socketService } from "../../config/socket.config";
import UserModel from "../user/user.model";
import { NotificationModel } from "./notification.model";

// notification.service.ts

class NotificationService {
  // ─── USER notifications ───────────────────────────────

  async notifyUser(
    userId: Types.ObjectId | string,
    message: string,
    type: string,
    refs?: { rideId?: string; carId?: string; paymentId?: string },
    metadata?: any,
  ) {
    const userObjId = new Types.ObjectId(userId.toString());

    const notification = await NotificationModel.create({
      userId: userObjId,
      audience: "user",
      message,
      type,
      isRead: false,
      ...(refs?.rideId && { rideId: new Types.ObjectId(refs.rideId) }),
      ...(refs?.carId && { carId: new Types.ObjectId(refs.carId) }),
      ...(refs?.paymentId && { paymentId: new Types.ObjectId(refs.paymentId) }),
      metadata,
    });

    socketService.sendToUser(userObjId.toString(), "notification:new", {
      _id: notification._id,
      type,
      message,
      isRead: false,
      refs,
      metadata,
      timestamp: new Date(),
    });

    return notification;
  }

  // ─── ADMIN notifications ──────────────────────────────

  async notifyAdmins(
    message: string,
    type: string,
    refs?: { rideId?: string; carId?: string; paymentId?: string },
    metadata?: any,
  ) {
    // সব admin fetch করো DB save এর জন্য
    const admins = await UserModel.find({ role: "admin" }).select("_id");

    if (admins.length === 0) {
      console.log("⚠️ No admins found");
      return;
    }

    // প্রতিটা admin এর জন্য DB তে save
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      audience: "admin",
      message,
      type,
      isRead: false,
      ...(refs?.rideId && { rideId: new Types.ObjectId(refs.rideId) }),
      ...(refs?.carId && { carId: new Types.ObjectId(refs.carId) }),
      ...(refs?.paymentId && { paymentId: new Types.ObjectId(refs.paymentId) }),
      metadata,
    }));

    await NotificationModel.insertMany(notifications);

    // Socket দিয়ে room:admin এ একবারেই পাঠাও
    socketService.sendToAllAdmins("notification:new", {
      type,
      message,
      refs,
      metadata,
      timestamp: new Date(),
    });

    console.log(`✅ Notified ${admins.length} admins for ${type}`);
  }

  // ─── Ride notification ────────────────────────────────

  async sendRideNotificationToAllCarOwners(
    rideId: Types.ObjectId,
    rideData: any,
  ) {
    const carOwners = await UserModel.find({ isCarOwner: true }).select("_id");
    if (carOwners.length === 0) return;

    const message = `New ride request: ${rideData.startLocation} → ${rideData.endLocation}`;

    const notifications = carOwners.map((owner) => ({
      userId: owner._id,
      audience: "user",
      rideId,
      message,
      type: "RIDE_REQUEST",
      isRead: false,
    }));

    await NotificationModel.insertMany(notifications);

    const userIds = carOwners.map((o) => o._id.toString());
    socketService.sendToCarOwners(userIds, "notification:new", {
      type: "RIDE_REQUEST",
      message,
      refs: { rideId: rideId.toString() },
      ride: rideData,
      timestamp: new Date(),
    });
  }

  // ─── Read / Fetch helpers ─────────────────────────────

  async getUserNotifications(userId: string, limit = 20) {
    return NotificationModel.find({ userId, audience: "user" })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getAdminNotifications(adminId: string, limit = 20) {
    return NotificationModel.find({ userId: adminId, audience: "admin" })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async markAsRead(notificationId: string, userId: string) {
    return NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string) {
    return NotificationModel.countDocuments({ userId, isRead: false });
  }
}

export const notificationService = new NotificationService();
