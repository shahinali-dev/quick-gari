import { model, Schema } from "mongoose";
import { Role } from "./user.enum";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    password: {
      type: String,
      required: true,
    },

    avatar: { type: String, default: null },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    isCarOwner: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    otpBlockedUntil: {
      type: Date,
      select: false,
    },
    lastOtpSentAt: {
      type: Date,
      select: false,
    },
    otpDeviceFingerprint: {
      type: String,
      select: false,
    },
    fcmTokens: { type: [String], default: [], select: false },
  },
  {
    timestamps: true,
  },
);

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
