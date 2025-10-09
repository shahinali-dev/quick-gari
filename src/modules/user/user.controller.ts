import { Router } from "express";
import httpStatus from "http-status";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { userService } from "./user.service";
import { userValidation } from "./user.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(userValidation.baseUserValidationSchema),
  catchAsync(async (req, res) => {
    const userData = req.body;
    const user = await userService.registerUser(userData);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User registered successfully",
      data: user,
    });
  })
);

router.get(
  "/users",
  catchAsync(async (req, res) => {
    const users = await userService.getAllUsers();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All users fetched successfully",
      data: users,
    });
  })
);

export const userRoute = router;
