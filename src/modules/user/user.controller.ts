import { Router } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { userService } from "./user.service";

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
