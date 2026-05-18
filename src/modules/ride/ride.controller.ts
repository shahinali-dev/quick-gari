import { Router } from "express";
import httpStatus from "http-status";
import { isAdminOrCarOwner } from "../../middleware/is_admin_or_car_owner";
import { isAuth } from "../../middleware/is_auth";
import { isCarOwner } from "../../middleware/is_car_owner";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { rideService } from "./ride.service";
import { rideValidation } from "./ride.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  validateRequest(rideValidation.rideValidationSchema),
  catchAsync(async (req, res) => {
    const data = req.body;
    const userId = req.user!._id.toString();
    const ride = await rideService.requestForARide(userId, data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Ride requested successfully",
      data: ride,
    });
  }),
);

router.get(
  "/requested",
  isAuth,
  isAdminOrCarOwner,
  catchAsync(async (req, res) => {
    const rides = await rideService.getAllRequestedRides();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Requested rides fetched successfully",
      data: rides,
    });
  }),
);

router.post(
  "/proposal",
  isAuth,
  isCarOwner,
  validateRequest(rideValidation.proposalValidationSchema),
  catchAsync(async (req, res) => {
    const { rideId, fare } = req.body;
    const driverId = req.user!._id.toString();

    const ride = await rideService.submitProposal(rideId, driverId, fare);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Proposal submitted successfully",
      data: ride,
    });
  }),
);

router.post(
  "/accept-proposal",
  isAuth,
  validateRequest(rideValidation.acceptProposalValidationSchema),
  catchAsync(async (req, res) => {
    const { rideId, proposalId } = req.body;
    const userId = req.user!._id.toString();

    const ride = await rideService.acceptProposal(rideId, userId, proposalId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Proposal accepted successfully",
      data: ride,
    });
  }),
);

router.get(
  "/:rideId/proposals",
  isAuth,
  catchAsync(async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user!._id.toString();

    const proposals = await rideService.getRideProposals(rideId, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Proposals fetched successfully",
      data: proposals,
    });
  }),
);

router.get(
  "/:rideId",
  isAuth,
  catchAsync(async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user!._id.toString();

    const ride = await rideService.getRideById(rideId, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Ride fetched successfully",
      data: ride,
    });
  }),
);

router.get(
  "/list/user",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();

    const rides = await rideService.getUserRides(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rides fetched successfully",
      data: rides,
    });
  }),
);

router.post(
  "/:rideId/verify-otp",
  isAuth,
  catchAsync(async (req, res) => {
    const { rideId } = req.params;
    const { otp } = req.body;
    const userId = req.user!._id.toString();

    const ride = await rideService.verifyRideOtp(rideId, userId, otp);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully",
      data: ride,
    });
  }),
);

// Driver Active Rides
router.get(
  "/driver/active",
  isAuth,
  catchAsync(async (req, res) => {
    const driverId = req.user!._id.toString();

    const activeRides = await rideService.getDriverActiveRides(driverId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active rides fetched successfully",
      data: activeRides,
    });
  }),
);

// Passenger Active Rides
router.get(
  "/passenger/active",
  isAuth,
  catchAsync(async (req, res) => {
    const passengerId = req.user!._id.toString();

    const activeRides = await rideService.getPassengerActiveRides(passengerId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Active rides fetched successfully",
      data: activeRides,
    });
  }),
);

// user completed rides
router.get(
  "/list/user/completed",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();

    const rides = await rideService.getUserCompletedRides(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Completed rides fetched successfully",
      data: rides,
    });
  }),
);

// driver completed rides
router.get(
  "/list/driver/completed",
  isAuth,
  catchAsync(async (req, res) => {
    const driverId = req.user!._id.toString();

    const rides = await rideService.getDriverCompletedRides(driverId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Completed rides fetched successfully",
      data: rides,
    });
  }),
);

const rideRouter = router;
export default rideRouter;
