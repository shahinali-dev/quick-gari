import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../mdataiddleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { rideService } from "./ride.service";

const router = Router();

router.post(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const data = req.body;
    const user = req.user as string;
    const ride = await rideService.requestForARide({
      ...data,
      user,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Ride requested successfully",
      data: ride,
    });
  })
);
