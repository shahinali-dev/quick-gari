/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import config from "../config";
import { userService } from "../modules/user/user.service";

export const createDefaultAdmin = async () => {
  try {
    const ADMIN_NAME = config.ADMIN_NAME;
    const ADMIN_EMAIL = config.ADMIN_EMAIL;
    const ADMIN_PASSWORD = config.ADMIN_PASSWORD;
    const ADMIN_PHONE_NUMBER = config.ADMIN_PHONE_NUMBER;
    const ADMIN_GENDER = config.ADMIN_GENDER;

    if (
      !ADMIN_NAME ||
      !ADMIN_EMAIL ||
      !ADMIN_PASSWORD ||
      !ADMIN_PHONE_NUMBER ||
      !ADMIN_GENDER
    ) {
      console.warn(
        "Admin credentials are not fully set in environment variables.",
      );
      return;
    }

    const admin = await userService.createDefaultAdminUser({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phoneNumber: ADMIN_PHONE_NUMBER,
      gender: ADMIN_GENDER as any,
    });

    if (admin) {
      console.log("Default admin user created or already exists.");
    } else {
      console.log("Failed to create default admin user.");
    }
  } catch (error) {
    console.error("Error creating default admin user:", error);
  }
};
