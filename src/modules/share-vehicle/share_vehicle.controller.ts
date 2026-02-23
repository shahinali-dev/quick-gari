import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { shareVehicleService } from "./share_vehicle.service";

const router = Router();

router.post(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const payload = req.body;
    const userId = req.user!._id.toString();

    const shareVehicle = await shareVehicleService.createShareVehicle(
      userId,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Share vehicle created successfully",
      data: shareVehicle,
    });
  }),
);

router.get(
  "/driver",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const shareVehicles =
      await shareVehicleService.getShareVehiclesByUserId(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Share vehicles fetched successfully",
      data: shareVehicles,
    });
  }),
);

router.get(
  "/available",
  catchAsync(async (req, res) => {
    const { date } = req.query;
    const shareVehicles = await shareVehicleService.getAvailableShareVehicles(
      date ? new Date(date as string) : undefined,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Share vehicles fetched successfully",
      data: shareVehicles,
    });
  }),
);

router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const shareVehicle = await shareVehicleService.getShareVehicleById(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Share vehicle fetched successfully",
      data: shareVehicle,
    });
  }),
);

const shareVehicleRouter = router;
export default shareVehicleRouter;
