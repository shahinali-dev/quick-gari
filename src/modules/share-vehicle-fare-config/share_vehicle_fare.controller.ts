import { Router } from "express";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { shareVehicleFareConfigService } from "./share_vehicle_fare.service";

const router = Router();

router.get(
  "/",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const fares = await shareVehicleFareConfigService.getAllFares();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fare configurations retrieved successfully",
      data: fares,
    });
  }),
);

router.post(
  "/",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { fromLocation, toLocation, perSeatFare } = req.body;
    const fare = await shareVehicleFareConfigService.setFare(
      fromLocation,
      toLocation,
      perSeatFare,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fare configuration set successfully",
      data: fare,
    });
  }),
);

router.get(
  "/:fromLocation/:toLocation",
  isAuth,
  catchAsync(async (req, res) => {
    const { fromLocation, toLocation } = req.params;
    const fare = await shareVehicleFareConfigService.getFare(
      fromLocation,
      toLocation,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fare retrieved successfully",
      data: { perSeatFare: fare },
    });
  }),
);

router.get(
  "/locations-list",
  isAuth,
  catchAsync(async (req, res) => {
    const locations = await shareVehicleFareConfigService.getLocationsList();
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Locations list retrieved successfully",
      data: locations,
    });
  }),
);

router.put(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { fromLocation, toLocation, perSeatFare } = req.body;
    const fare = await shareVehicleFareConfigService.updateFare(
      id,
      fromLocation,
      toLocation,
      perSeatFare,
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fare configuration updated successfully",
      data: fare,
    });
  }),
);

router.delete(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const fare = await shareVehicleFareConfigService.deleteFare(id);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Fare configuration deleted successfully",
      data: fare,
    });
  }),
);

export const shareVehicleFareConfigController = router;
