import { Router } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { userService } from "../user/user.service";
import { notificationService } from "./notification.service";

const router = Router();

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const getUserNotifications =
      await notificationService.getUserNotifications(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User notifications fetched successfully",
      data: getUserNotifications,
    });
  }),
);

router.get(
  "/unread-count",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const getUnreadCount = await notificationService.getUnreadCount(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Unread count fetched successfully",
      data: getUnreadCount,
    });
  }),
);

router.patch(
  "/mark-as-read/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;
    const markAsRead = await notificationService.markAsRead(id, userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification marked as read successfully",
      data: markAsRead,
    });
  }),
);

router.patch(
  "/mark-all-as-read",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const markAllAsRead = await notificationService.markAllAsRead(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All notifications marked as read successfully",
      data: markAllAsRead,
    });
  }),
);

router.patch(
  "/settings/update/fcm-token",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user?._id as string;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
    }

    const result = await userService.saveFcmToken(userId, fcmToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "FCM token updated successfully",
      data: result,
    });
  }),
);

router.delete(
  "/settings/delete/fcm-token",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user?._id as string;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
    }

    const result = await userService.removeFcmToken(userId, fcmToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "FCM token removed successfully",
      data: result,
    });
  }),
);

export const notificationRouter = router;
