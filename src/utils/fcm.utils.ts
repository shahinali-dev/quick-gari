// src/utils/fcm.utils.ts
import * as admin from "firebase-admin";
import config from "../config";

// Initialize Firebase Admin (একবারই initialize হবে)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FCM_PROJECT_ID,
      clientEmail: config.FCM_CLIENT_EMAIL,
      privateKey: config.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const sendPushNotification = async (
  fcmTokens: string[],
  title: string,
  message: string,
  data?: Record<string, string>,
): Promise<void> => {
  if (!fcmTokens || fcmTokens.length === 0) return;

  const validTokens = fcmTokens.filter(Boolean);
  if (validTokens.length === 0) return;

  const payload: admin.messaging.MulticastMessage = {
    tokens: validTokens,
    notification: {
      title,
      body: message,
    },
    data: data || {},
    android: {
      priority: "high",
      notification: {
        sound: "default",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);

    // Invalid token গুলো remove করো (expired/uninstalled app)
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/invalid-registration-token" ||
            resp.error?.code === "messaging/registration-token-not-registered")
        ) {
          invalidTokens.push(validTokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        // Background এ invalid token cleanup
        setImmediate(() => cleanupInvalidTokens(invalidTokens));
      }
    }
  } catch (error) {
    console.error("FCM send error:", error);
  }
};

// Invalid FCM token গুলো DB থেকে remove করা
const cleanupInvalidTokens = async (invalidTokens: string[]): Promise<void> => {
  try {
    const UserModel = (await import("../modules/user/user.model")).default;
    await UserModel.updateMany(
      { fcmTokens: { $in: invalidTokens } },
      { $pull: { fcmTokens: { $in: invalidTokens } } },
    );
  } catch (error) {
    console.error("FCM token cleanup error:", error);
  }
};
