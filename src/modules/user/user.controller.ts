import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync.utils";
import sendResponse from "../../utils/sendResponse.utils";
import { userService } from "./user.service";
import { Router } from "express";

const router = Router();

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
