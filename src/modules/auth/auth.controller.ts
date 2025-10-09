import { Router } from "express";
import httpStatus from "http-status";
import config from "../../config";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { userValidation } from "../user/user.validation";
import { authService } from "./auth.service";

const router = Router();

router.post(
  "/signup",
  validateRequest(userValidation.baseUserValidationSchema),
  catchAsync(async (req, res) => {
    const userData = req.body;
    const user = await authService.signUp(userData);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: user,
    });
  })
);

router.post(
  "/signin",
  catchAsync(async (req, res) => {
    const userData = req.body;
    const user = await authService.signIn(userData);

    res.cookie("token", user.refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: user.user,
      token: user.accessToken,
    });
  })
);

export const authRoute = router;
