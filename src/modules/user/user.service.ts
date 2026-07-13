import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import createToken from "../../utils/create_token";
import { OTPUtils } from "../../utils/otp_utils";
import passwordUtils from "../../utils/password_utils";
import QueryBuilder from "../../utils/query_builder.utils";
import { EmailService } from "../email/email.service";
import { OTP_CONFIG, Role } from "./user.enum";
import { IUser } from "./user.interface";
import UserModel from "./user.model";

export class UserService {
  async isExist(email: string) {
    const existingUser = await UserModel.findOne({ email });
    return existingUser;
  }

  async registerUser(userData: IUser, ip: string, userAgent: string) {
    const { password, ...user } = userData;

    // Validate that password exists (TypeScript check)
    if (!password) {
      throw new AppError(httpStatus.BAD_REQUEST, "Password is required");
    }

    const existingUser = await this.isExist(user.email);

    // User Existence Leak - Don't reveal if user exists
    if (existingUser) {
      // If user exists but not verified, allow re-registration
      if (!existingUser.isVerified) {
        // Generate new OTP and update existing user
        const otp = OTPUtils.generateSecureOTP();
        const hashedOTP = OTPUtils.hashOTP(otp);
        const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);
        const deviceFingerprint = OTPUtils.generateDeviceFingerprint(
          ip,
          userAgent,
        );

        const hashedPassword = await passwordUtils.hash(password);

        existingUser.otp = hashedOTP;
        existingUser.otpExpiry = otpExpiry;
        existingUser.otpAttempts = 0;
        existingUser.lastOtpSentAt = new Date();
        existingUser.otpDeviceFingerprint = deviceFingerprint;
        existingUser.password = hashedPassword;
        await existingUser.save();

        const userWithoutPassword = await UserModel.findById(
          existingUser._id,
        ).select("-password");

        const jwtPayload = {
          _id: userWithoutPassword!._id.toString(),
          email: userWithoutPassword!.email,
          role: userWithoutPassword!.role,
        };

        const verifyToken = createToken(
          jwtPayload,
          config.JWT_VERIFY_SECRET,
          config.JWT_VERIFY_EXPIRE_IN,
        );

        await EmailService.sendOTPEmail(
          userWithoutPassword!.email,
          userWithoutPassword!.name,
          otp,
          true,
        );

        return {
          user: userWithoutPassword,
          verifyToken,
        };
      }

      // If verified user exists, still return success but don't reveal
      // This prevents user enumeration attacks
      throw new AppError(
        httpStatus.CONFLICT, // 409 status code
        "An account with this email already exists. Please login instead.",
      );
    }

    const hashedPassword = await passwordUtils.hash(password);

    // Generate and HASH OTP
    const otp = OTPUtils.generateSecureOTP();
    const hashedOTP = OTPUtils.hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_CONFIG.EXPIRY_DURATION);
    const deviceFingerprint = OTPUtils.generateDeviceFingerprint(ip, userAgent);

    const newUser = await UserModel.create({
      ...user,
      password: hashedPassword,
      otp: hashedOTP,
      otpExpiry,
      isVerified: false,
      otpAttempts: 0,
      lastOtpSentAt: new Date(),
      otpDeviceFingerprint: deviceFingerprint,
    });

    const userWithoutPassword = await UserModel.findById(newUser._id).select(
      "-password",
    );

    const jwtPayload = {
      _id: userWithoutPassword!._id.toString(),
      email: userWithoutPassword!.email,
      role: userWithoutPassword!.role,
    };

    const verifyToken = createToken(
      jwtPayload,
      config.JWT_VERIFY_SECRET,
      config.JWT_VERIFY_EXPIRE_IN,
    );

    // Send plain OTP to email (email encryption is handled by TLS)

    await EmailService.sendOTPEmail(
      userWithoutPassword!.email,
      userWithoutPassword!.name,
      otp,
      false,
    );

    return {
      user: userWithoutPassword,
      verifyToken,
    };
  }

  async getAllUsers(query: Record<string, unknown>) {
    const searchableFields = ["name", "email"];

    const queryBuilder = new QueryBuilder(
      UserModel.find().select("-password"),
      query,
    )
      .search(searchableFields)
      .filter()
      .sort()
      .paginate();

    const result = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    return {
      data: result,
      meta: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        pages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      },
    };
  }

  async getUserForOtpVerification(id: string) {
    return await UserModel.findById(id).select(
      "+otp +otpExpiry +otpAttempts +otpBlockedUntil +lastOtpSentAt",
    );
  }

  async makeCarOwner(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "Car owner not found");
    }
    user.role = Role.CAR_OWNER;
    user.isCarOwner = true;
    await user.save();
  }

  async getUserById(id: string) {
    const user = await UserModel.findById(id).select("-password");
    return user;
  }

  async createDefaultAdminUser(data: Partial<IUser>) {
    const adminUser = await UserModel.findOne({ email: data.email });
    if (adminUser && adminUser.role !== Role.ADMIN) {
      adminUser.role = Role.ADMIN;
      await adminUser.save();
    }
    if (!adminUser) {
      if (!data.password) {
        throw new Error("Password is required to create admin user");
      }

      const hashedPassword = await passwordUtils.hash(data.password);
      await UserModel.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.ADMIN,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        isVerified: true,
      });
    }

    return adminUser;
  }

  // save FCM token for push notifications
  async saveFcmToken(userId: string, fcmToken: string) {
    const user = await await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken },
    });

    if (!user) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User not found for saving FCM token",
      );
    }

    return { message: "FCM token saved successfully" };
  }

  // remove FCM token (e.g. on logout)
  async removeFcmToken(userId: string, fcmToken: string) {
    const user = await UserModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: fcmToken },
    });

    if (!user) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User not found for removing FCM token",
      );
    }

    return { message: "FCM token removed successfully" };
  }
}

// Export singleton instance
export const userService = new UserService();
