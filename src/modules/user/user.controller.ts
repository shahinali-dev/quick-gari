import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAdminOrAuthUser } from "../../middleware/is_admin_or_auth_user";
import { isAuth } from "../../middleware/is_auth";
import { upload } from "../../middleware/multer.middleware";
import { registrationLimiter } from "../../middleware/otp_limiter";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { userService } from "./user.service";
import { userValidation } from "./user.validation";

const router = Router();

router.post(
  "/register",
  registrationLimiter,
  upload.single("avatar"),
  validateRequest(userValidation.baseUserValidationSchema),
  catchAsync(async (req, res) => {
    const userData = req.body;
    // Get IP and User-Agent for device fingerprinting
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const file = req.file;
    if (file) {
      userData.avatar = file.path;
    }

    const user = await userService.registerUser(userData, ip, userAgent);

    const clientType = req.headers["x-client-type"];

    if (clientType === "web") {
      // Web flow: cookie-based
      res.cookie("verifyToken", user.verifyToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });
    }
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: user,
    });
  }),
);

router.get(
  "/users",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { data, meta } = await userService.getAllUsers(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All users fetched successfully",
      data,
      meta,
    });
  }),
);

router.get(
  "/settings",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const user = await userService.userSettings(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User settings fetched successfully",
      data: user,
    });
  }),
);

router.get(
  "/:id",
  isAuth,
  isAdminOrAuthUser,
  catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User fetched successfully",
      data: user,
    });
  }),
);

export const userRoute = router;
