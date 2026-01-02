/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status";
import { Types } from "mongoose";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import createToken from "../../utils/create_token";
import { OTPUtils } from "../../utils/otp_utils";
import passwordUtils from "../../utils/password_utils";
import { EmailService } from "../email/email.service";
import { OTP_CONFIG } from "../user/user.enum";
import { ISignIn } from "../user/user.interface";
import UserModel from "../user/user.model";
import { userService } from "../user/user.service";

export class AuthService {
  async signIn(payload: ISignIn) {
    const existingUser = await userService.isExist(payload.email);
    if (!existingUser) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email");
    }

    const isMatch = await passwordUtils.compare(
      payload.password as string,
      existingUser.password as string
    );

    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
    }

    const { password, ...rest } = existingUser.toJSON();

    const jwtPayload = {
      _id: rest._id,
      email: rest.email,
      role: rest.role,
    };

    const accessToken = createToken(
      jwtPayload,
      config.JWT_ACCESS_SECRET as string,
      config.JWT_ACCESS_EXPIRE_IN as string
    );

    const refreshToken = createToken(
      jwtPayload,
      config.JWT_REFRESH_SECRET as string,
      config.JWT_REFRESH_EXPIRE_IN as string
    );

    return { user: rest, accessToken, refreshToken };
  }

  async getAuthUser(id: string | Types.ObjectId) {
    const user = await UserModel.findById(id).select("-password");
    return user;
  }

  async verifyOTP(
    userId: string,
    email: string,
    inputOtp: string,
    ip: string,
    userAgent: string
  ) {
    const user = await userService.getUserForOtpVerification(userId);

    if (!user) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid verification request"
      );
    }

    // Verify email matches
    if (user.email !== email) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid verification request"
      );
    }

    // FIX: Don't leak verification status
    if (user.isVerified) {
      // Return generic success to prevent status leak
      return {
        message: "Verification successful",
        data: {
          email: user.email,
          isVerified: true,
        },
      };
    }

    // Check if user is blocked
    if (OTPUtils.isUserBlocked(user.otpBlockedUntil)) {
      const blockedUntil = user.otpBlockedUntil!;
      const remainingTime = Math.ceil(
        (blockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Too many failed attempts. Try again after ${remainingTime} minutes`
      );
    }

    // Check if OTP exists
    if (!user.otp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP found. Please request a new one"
      );
    }

    // Check OTP expiry
    if (OTPUtils.isOTPExpired(user.otpExpiry)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please request a new one"
      );
    }

    // FIX: Verify device fingerprint (context binding)
    if (user.otpDeviceFingerprint) {
      const isValidDevice = OTPUtils.verifyDeviceFingerprint(
        user.otpDeviceFingerprint,
        ip,
        userAgent
      );

      if (!isValidDevice) {
        // Increment attempts for device mismatch too
        user.otpAttempts = (user.otpAttempts || 0) + 1;

        if ((user.otpAttempts || 0) >= OTP_CONFIG.MAX_ATTEMPTS) {
          user.otpBlockedUntil = new Date(
            Date.now() + OTP_CONFIG.BLOCK_DURATION
          );
          user.otp = undefined;
          user.otpExpiry = undefined;
          user.otpDeviceFingerprint = undefined;
          await user.save();

          throw new AppError(
            httpStatus.FORBIDDEN,
            "Security violation detected. Account blocked for 30 minutes"
          );
        }

        await user.save();
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "OTP must be verified from the same device"
        );
      }
    }

    // Verify OTP using timing-safe comparison (now with hashing)
    const isValid = OTPUtils.verifyOTPSafely(user.otp, inputOtp);

    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      // Check if max attempts reached
      if ((user.otpAttempts || 0) >= OTP_CONFIG.MAX_ATTEMPTS) {
        user.otpBlockedUntil = new Date(Date.now() + OTP_CONFIG.BLOCK_DURATION);
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpDeviceFingerprint = undefined;
        await user.save();

        throw new AppError(
          httpStatus.FORBIDDEN,
          "Too many failed attempts. Account blocked for 30 minutes"
        );
      }

      await user.save();

      const remainingAttempts = OTPUtils.getRemainingAttempts(
        user.otpAttempts || 0
      );
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid OTP. ${remainingAttempts} attempt${
          remainingAttempts !== 1 ? "s" : ""
        } remaining`
      );
    }

    // OTP verified successfully - clear all OTP data
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    user.otpDeviceFingerprint = undefined;
    await user.save();

    return {
      message: "Email verified successfully",
      data: {
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  }

  async resendOTP(
    userId: string,
    email: string,
    ip: string,
    userAgent: string
  ) {
    const user = await userService.getUserForOtpVerification(userId);

    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid request");
    }

    // Verify email matches
    if (user.email !== email) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid request");
    }

    // Don't leak verification status
    if (user.isVerified) {
      return {
        message: "OTP sent successfully",
        data: { email: user.email },
      };
    }

    // Check if user is blocked
    if (OTPUtils.isUserBlocked(user.otpBlockedUntil)) {
      const blockedUntil = user.otpBlockedUntil!;
      const remainingTime = Math.ceil(
        (blockedUntil.getTime() - Date.now()) / 60000
      );
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Account temporarily blocked. Try again after ${remainingTime} minutes`
      );
    }

    // Check cooldown period BEFORE anything else
    const { canResend, waitTime } = OTPUtils.canResendOTP(user.lastOtpSentAt);
    if (!canResend) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        `Please wait ${waitTime} seconds before requesting another OTP`
      );
    }

    // Generate and hash new OTP
    const otp = OTPUtils.generateSecureOTP();
    const hashedOTP = OTPUtils.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);
    const deviceFingerprint = OTPUtils.generateDeviceFingerprint(ip, userAgent);

    user.otp = hashedOTP;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    user.lastOtpSentAt = new Date();
    user.otpDeviceFingerprint = deviceFingerprint;
    await user.save();

    // Send plain OTP to email
    await EmailService.sendOTPEmail(user.email, user.name, otp, true);

    return {
      message: "OTP sent successfully",
      data: { email: user.email },
    };
  }
}

export const authService = new AuthService();
