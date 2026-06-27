import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { driverPayoutService } from "./driver_payout.service";

const router = Router();

router.get(
  "/pending",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const result = await driverPayoutService.getPendingDriverPayouts(req.query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pending driver payouts fetched successfully",
      data: result,
    });
  }),
);

router.patch(
  "/:id/complete",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type } = req.query as {
      type: "ride" | "return" | "shareVehicleBooking";
    };

    if (!type) {
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: "Query param 'type' is required",
        data: null,
      });
      return;
    }

    const result = await driverPayoutService.completeDriverPayout(id, type);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Driver payout completed successfully",
      data: result,
    });
  }),
);

router.get(
  "/history",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const result = await driverPayoutService.getCompletedDriverPayouts(
      req.query,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Driver payout history fetched successfully",
      data: result,
    });
  }),
);
const driverPayoutRoutes = router;
export default driverPayoutRoutes;
