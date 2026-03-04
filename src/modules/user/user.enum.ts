/* eslint-disable no-unused-vars */
export enum Role {
  ADMIN = "admin",
  USER = "user",
  CAR_OWNER = "car_owner",
}

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export enum OTP_CONFIG {
  MAX_ATTEMPTS = 5,
  BLOCK_DURATION = 30 * 60 * 1000,
  EXPIRY_DURATION = 15 * 60 * 1000,
  RESEND_COOLDOWN = 60 * 1000,
  OTP_LENGTH = 6,
}
