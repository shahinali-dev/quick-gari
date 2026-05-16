import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { returnService } from "./return.service";
import { returnValidation } from "./return.validation";

const router = Router();

// Create a return ride (Driver creates)
router.post(
  "/",
  isAuth,
  validateRequest(returnValidation.returnRideValidationSchema),
  catchAsync(async (req, res) => {
    const payload = req.body;
    const userId = req.user!._id.toString();

    const returnRide = await returnService.createAReturnRide(payload, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Return ride created successfully",
      data: returnRide,
    });
  }),
);

// Get all available return rides (For passengers to browse)
router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const returnRides = await returnService.getAllReturnRides(
      req.query as Record<string, unknown>,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return rides fetched successfully",
      data: returnRides.result,
      meta: returnRides.meta,
    });
  }),
);

// Get a specific return ride by ID
router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const returnRide = await returnService.getReturnRideById(id);

    if (!returnRide) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Return ride not found",
        data: null,
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return ride fetched successfully",
      data: returnRide,
    });
  }),
);

// Book a return ride (Passenger books)
router.post(
  "/:id/book",
  isAuth,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const returnRide = await returnService.bookReturnRide(id, userId);

    // Return response with payment details for frontend
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return ride booked successfully",
      data: returnRide,
    });
  }),
);

// verify-otp
router.post(
  "/:returnId/verify-otp",
  isAuth,
  catchAsync(async (req, res) => {
    const { returnId } = req.params;
    const { otp } = req.body;
    const userId = req.user!._id.toString();

    const returnRide = await returnService.verifyReturnOtp(
      returnId,
      userId,
      otp,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully",
      data: returnRide,
    });
  }),
);

// Driver Active Return Ride
router.get(
  "/driver/active",
  isAuth,
  catchAsync(async (req, res) => {
    const driverId = req.user!._id.toString();

    const activeReturnRide =
      await returnService.getActiveReturnRideForDriver(driverId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active return ride fetched successfully",
      data: activeReturnRide,
    });
  }),
);

// Passenger Active Return Ride
router.get(
  "/passenger/active",
  isAuth,
  catchAsync(async (req, res) => {
    const passengerId = req.user!._id.toString();

    const activeReturnRide =
      await returnService.getActiveReturnRideForPassenger(passengerId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active return ride fetched successfully",
      data: activeReturnRide,
    });
  }),
);

// Driver Completed Return Rides
router.get(
  "/driver/completed",
  isAuth,
  catchAsync(async (req, res) => {
    const driverId = req.user!._id.toString();

    const completedRides =
      await returnService.getCompletedReturnRidesForDriver(driverId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Completed return rides fetched successfully",
      data: completedRides,
    });
  }),
);

// Passenger Completed Return Rides
router.get(
  "/passenger/completed",
  isAuth,
  catchAsync(async (req, res) => {
    const passengerId = req.user!._id.toString();

    const completedRides =
      await returnService.getCompletedReturnRidesForPassenger(passengerId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Completed return rides fetched successfully",
      data: completedRides,
    });
  }),
);

const returnRouter = router;
export default returnRouter;
