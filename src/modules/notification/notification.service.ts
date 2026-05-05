// notification.service.ts
import { Types } from "mongoose";
import { NotificationPayload, socketService } from "../../config/socket.config";
import UserModel from "../user/user.model";
import { NotificationModel } from "./notification.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationRefs {
  rideId?: string;
  carId?: string;
  paymentId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRefFields(refs?: NotificationRefs) {
  return {
    ...(refs?.rideId && { rideId: new Types.ObjectId(refs.rideId) }),
    ...(refs?.carId && { carId: new Types.ObjectId(refs.carId) }),
    ...(refs?.paymentId && { paymentId: new Types.ObjectId(refs.paymentId) }),
  };
}

// ─── NotificationService ──────────────────────────────────────────────────────

class NotificationService {
  // ─── USER notification ────────────────────────────────────────────────────

  async notifyUser(
    userId: Types.ObjectId | string,
    message: string,
    type: string,
    refs?: NotificationRefs,
    metadata?: Record<string, unknown>,
  ) {
    const userObjId = new Types.ObjectId(userId.toString());

    try {
      const notification = await NotificationModel.create({
        userId: userObjId,
        audience: "user",
        message,
        type,
        isRead: false,
        ...buildRefFields(refs),
        metadata,
      });

      // DB save সফল হলেই socket emit করো
      const payload: NotificationPayload = {
        _id: notification._id.toString(),
        type,
        message,
        isRead: false,
        refs,
        metadata,
        timestamp: new Date(),
      } as NotificationPayload & { isRead: boolean };

      socketService.sendToUser(
        userObjId.toString(),
        "notification:new",
        payload,
      );

      return notification;
    } catch (err) {
      console.error(`❌ notifyUser failed for ${userId}:`, err);
      throw err;
    }
  }

  // ─── ADMIN notification ───────────────────────────────────────────────────

  async notifyAdmins(
    message: string,
    type: string,
    refs?: NotificationRefs,
    metadata?: Record<string, unknown>,
  ) {
    const admins = await UserModel.find({ role: "admin" }).select("_id");

    if (admins.length === 0) {
      console.warn("⚠️ No admins found, skipping notification");
      return;
    }

    const notifications = admins.map((admin) => ({
      userId: admin._id,
      audience: "admin",
      message,
      type,
      isRead: false,
      ...buildRefFields(refs),
      metadata,
    }));

    try {
      const inserted = await NotificationModel.insertMany(notifications, {
        ordered: false, // একটা fail করলে বাকিগুলো চলবে
      });

      // DB save সফল হলেই socket emit — room:admin এ একটাই emit
      // Frontend এ mark-as-read এর জন্য প্রতিটা admin তার নিজের
      // getAdminNotifications() call করে _id পাবে।
      // তবে প্রথম inserted _id পাঠানো হচ্ছে reference হিসেবে।
      const payload: NotificationPayload = {
        _id: inserted[0]?._id?.toString(),
        type,
        message,
        refs,
        metadata,
        timestamp: new Date(),
      };

      socketService.sendToAllAdmins("notification:new", payload);

      console.log(`✅ Notified ${admins.length} admins for '${type}'`);
      return inserted;
    } catch (err) {
      console.error(`❌ notifyAdmins failed for type '${type}':`, err);
      throw err;
    }
  }

  // ─── Ride notification to all car owners ─────────────────────────────────

  async sendRideNotificationToAllCarOwners(
    rideId: Types.ObjectId,
    rideData: Record<string, unknown>,
  ) {
    const carOwners = await UserModel.find({ isCarOwner: true }).select("_id");

    if (carOwners.length === 0) {
      console.warn("⚠️ No car owners found");
      return;
    }

    const message = `New ride request: ${rideData.startLocation} → ${rideData.endLocation}`;

    const notifications = carOwners.map((owner) => ({
      userId: owner._id,
      audience: "user",
      rideId,
      message,
      type: "RIDE_REQUEST",
      isRead: false,
    }));

    try {
      await NotificationModel.insertMany(notifications, { ordered: false });

      // N+1 loop এর বদলে room:car-owners এ single emit
      const payload: NotificationPayload = {
        type: "RIDE_REQUEST",
        message,
        refs: { rideId: rideId.toString() },
        ride: rideData,
        timestamp: new Date(),
      };

      socketService.sendToCarOwners("notification:new", payload);

      console.log(
        `✅ Ride notification sent to ${carOwners.length} car owners`,
      );
    } catch (err) {
      console.error(`❌ sendRideNotificationToAllCarOwners failed:`, err);
      throw err;
    }
  }

  // ─── Read / Fetch helpers ─────────────────────────────────────────────────

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
