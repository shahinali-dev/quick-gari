/* eslint-disable no-unused-vars */

import { Types } from "mongoose";
import { Gender, Role } from "./user.enum";

export interface IUser {
  name: string;
  email: string;
  role: Role;
  password: string;
  avatar?: string;
  phoneNumber: string;
  gender: Gender;
  isCarOwner: boolean;
  isVerified?: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpAttempts?: number;
  otpBlockedUntil?: Date;
  lastOtpSentAt?: Date;
  otpDeviceFingerprint?: string;
  // Password Reset OTP fields
  passwordResetOtp?: string;
  passwordResetOtpExpiry?: Date;
  passwordResetAttempts?: number;
  passwordResetBlockedUntil?: Date;
  lastPasswordResetOtpSentAt?: Date;
  passwordResetDeviceFingerprint?: string;
  fcmTokens?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface IAuthUser {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phoneNumber: string;
  provider: string;
  gender: Gender;
  isCarOwner: boolean;
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpAttempts?: number;
  otpBlockedUntil?: Date;
  lastOtpSentAt?: Date;
  otpDeviceFingerprint?: string;
  // Password Reset OTP fields
  passwordResetOtp?: string;
  passwordResetOtpExpiry?: Date;
  passwordResetAttempts?: number;
  passwordResetBlockedUntil?: Date;
  lastPasswordResetOtpSentAt?: Date;
  passwordResetDeviceFingerprint?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  iat: number;
  exp: number;
}
