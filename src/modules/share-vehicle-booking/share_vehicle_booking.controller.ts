import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import { isCarOwner } from "../../middleware/is_car_owner";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { shareVehicleBookingService } from "./share_vehicle_booking.service";
import { shareVehicleBookingValidation } from "./share_vehicle_booking.validation";

const router = Router();

// Create a new booking
router.post(
  "/",
  isAuth,
  validateRequest(
    shareVehicleBookingValidation.createShareVehicleBookingValidationSchema,
  ),
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const payload = req.body;

    const booking = await shareVehicleBookingService.createBooking(
      userId,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }),
);

// Get all bookings for the current user
router.get(
  "/my-bookings",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();

    const bookings =
      await shareVehicleBookingService.getBookingsByUserId(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User bookings fetched successfully",
      data: bookings,
    });
  }),
);

// Get active bookings for the current user
router.get(
  "/my-active-bookings",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();

    const bookings =
      await shareVehicleBookingService.getActiveBookingsForPassenger(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active bookings fetched successfully",
      data: bookings,
    });
  }),
);

// Get bookings for a specific share vehicle
router.get(
  "/vehicle/:shareVehicleId",
  isAuth,
  isCarOwner,
  catchAsync(async (req, res) => {
    const { shareVehicleId } = req.params;
    const userId = req.user!._id.toString();

    const bookings =
      await shareVehicleBookingService.getBookingsByShareVehicleId(
        shareVehicleId,
        userId,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Vehicle bookings fetched successfully",
      data: bookings,
    });
  }),
);

// Get confirmed bookings for a specific share vehicle
router.get(
  "/vehicle/:shareVehicleId/confirmed",
  isAuth,
  isCarOwner,
  catchAsync(async (req, res) => {
    const { shareVehicleId } = req.params;
    const userId = req.user!._id.toString();

    const bookings =
      await shareVehicleBookingService.getConfirmedBookingsForShareVehicle(
        shareVehicleId,
        userId,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Confirmed bookings fetched successfully",
      data: bookings,
    });
  }),
);

// Get a specific booking by ID
router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const booking = await shareVehicleBookingService.getBookingById(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking fetched successfully",
      data: booking,
    });
  }),
);

// Confirm a booking
router.patch(
  "/:id/confirm",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const booking = await shareVehicleBookingService.confirmBooking(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking confirmed successfully",
      data: booking,
    });
  }),
);

// Cancel a booking
router.patch(
  "/:id/cancel",
  isAuth,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const booking = await shareVehicleBookingService.cancelBooking(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking cancelled successfully",
      data: booking,
    });
  }),
);

const shareVehicleBookingRouter = router;
export default shareVehicleBookingRouter;
