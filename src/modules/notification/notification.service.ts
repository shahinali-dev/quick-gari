// modules/notification/notification.service.ts
import { Types } from "mongoose";
import { NotificationPayload, socketService } from "../../config/socket.config";
import { sendPushNotification } from "../../utils/fcm.utils";
import { Role } from "../user/user.enum";
import UserModel from "../user/user.model";
import { NotificationModel } from "./notification.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationRefs {
  rideId?: string;
  carId?: string;
  paymentId?: string;
  proposalId?: string;
  returnRideId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRefFields(refs?: NotificationRefs) {
  return {
    ...(refs?.rideId && { rideId: new Types.ObjectId(refs.rideId) }),
    ...(refs?.returnRideId && {
      returnRideId: new Types.ObjectId(refs.returnRideId),
    }),
    ...(refs?.carId && { carId: new Types.ObjectId(refs.carId) }),
    ...(refs?.paymentId && { paymentId: new Types.ObjectId(refs.paymentId) }),
    ...(refs?.proposalId && {
      proposalId: new Types.ObjectId(refs.proposalId),
    }),
  };
}

function buildFcmData(
  type: string,
  notificationId: string,
  refs?: NotificationRefs,
): Record<string, string> {
  return {
    type,
    notificationId,
    ...(refs?.rideId && { rideId: refs.rideId }),
    ...(refs?.returnRideId && { returnRideId: refs.returnRideId }),
    ...(refs?.carId && { carId: refs.carId }),
    ...(refs?.paymentId && { paymentId: refs.paymentId }),
    ...(refs?.proposalId && { proposalId: refs.proposalId }),
  };
}

function formatTitle(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

      // DB doc theke e flat socket payload — REST response er shape er sathe match korbe
      const socketPayload: NotificationPayload = {
        _id: notification._id.toString(),
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        rideId: notification.rideId?.toString(),
        carId: notification.carId?.toString(),
        paymentId: notification.paymentId?.toString(),
        proposalId: notification.proposalId?.toString(),
        metadata: notification.metadata,
        timestamp: notification.createdAt as Date,
      };

      socketService.sendToUser(
        userObjId.toString(),
        "notification:new",
        socketPayload,
      );

      const user = await UserModel.findById(userObjId).select("fcmTokens");
      if (user?.fcmTokens?.length) {
        await sendPushNotification(
          user.fcmTokens,
          formatTitle(type),
          message,
          buildFcmData(type, notification._id.toString(), refs),
        );
      }

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
    const admins = await UserModel.find({ role: "admin" }).select(
      "_id fcmTokens",
    );

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
        ordered: false,
      });

      const first = inserted[0];

      const socketPayload: NotificationPayload = {
        _id: first?._id?.toString(),
        type: first?.type ?? type,
        message: first?.message ?? message,
        isRead: first?.isRead ?? false,
        rideId: first?.rideId?.toString(),
        carId: first?.carId?.toString(),
        paymentId: first?.paymentId?.toString(),
        proposalId: first?.proposalId?.toString(),
        metadata: first?.metadata,
        timestamp: (first?.createdAt as Date) ?? new Date(),
      };

      socketService.sendToAllAdmins("notification:new", socketPayload);

      const allAdminTokens = admins
        .flatMap((a) => a.fcmTokens ?? [])
        .filter(Boolean);

      if (allAdminTokens.length) {
        await sendPushNotification(
          allAdminTokens,
          formatTitle(type),
          message,
          buildFcmData(type, first?._id?.toString() ?? "", refs),
        );
      }

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
    const carOwners = await UserModel.find({ isCarOwner: true }).select(
      "_id fcmTokens",
    );

    if (carOwners.length === 0) {
      console.warn("⚠️ No car owners found");
      return;
    }

    const message = `New ride request: ${rideData.startLocation} → ${rideData.endLocation}`;

    const notifications = carOwners.map((owner) => ({
      userId: owner._id,
      audience: Role.CAR_OWNER,
      rideId,
      message,
      type: "RIDE_REQUEST",
      isRead: false,
    }));

    try {
      await NotificationModel.insertMany(notifications, { ordered: false });

      const socketPayload: NotificationPayload = {
        type: "RIDE_REQUEST",
        message,
        rideId: rideId.toString(),
        ride: rideData,
        timestamp: new Date(),
      };

      socketService.sendToCarOwners("notification:new", socketPayload);

      const allCarOwnerTokens = carOwners
        .flatMap((o) => o.fcmTokens ?? [])
        .filter(Boolean);

      if (allCarOwnerTokens.length) {
        await sendPushNotification(
          allCarOwnerTokens,
          "New Ride Request",
          message,
          { type: "RIDE_REQUEST", rideId: rideId.toString() },
        );
      }

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
