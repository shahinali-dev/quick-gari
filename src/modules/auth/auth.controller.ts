/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { isAuth } from "../../middleware/is_auth";
import { isVerify } from "../../middleware/is_verify";
import {
  otpResendLimiter,
  otpVerifyLimiter,
} from "../../middleware/otp_limiter";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { authService } from "./auth.service";

const router = Router();

router.post(
  "/signin",
  catchAsync(async (req, res) => {
    const userData = req.body;
    const user = await authService.signIn(userData);

    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: user.user,
      token: {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      },
    });
  }),
);

router.get(
  "/user-info",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const user = await authService.getAuthUser(userId);
    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "User info fetched successfully",
      data: user,
    });
  }),
);

router.post(
  "/verify-otp",
  isVerify,
  otpVerifyLimiter,
  catchAsync(async (req: any, res: any) => {
    const { otp } = req.body;
    const { email, _id } = req.user;
    const userId = _id as string;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";

    if (!otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP is required");
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP format. Must be 6 digits",
      );
    }

    const result = await authService.verifyOTP(
      userId,
      email,
      otp,
      ip,
      userAgent,
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/resend-otp",
  isVerify,
  otpResendLimiter,
  catchAsync(async (req: any, res: any) => {
    const { email, _id: userId } = req.user;
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";

    const result = await authService.resendOTP(userId, email, ip, userAgent);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/refresh",
  catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(httpStatus.BAD_REQUEST, "Refresh token is required");
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Access token refreshed successfully",
      data: result,
    });
  }),
);

export const authRoute = router;
