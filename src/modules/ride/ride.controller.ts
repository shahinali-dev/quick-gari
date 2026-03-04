import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
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

router.post(
  "/payment/submit",
  isAuth,
  validateRequest(rideValidation.submitPaymentValidationSchema),
  catchAsync(async (req, res) => {
    const { rideId, transactionId } = req.body;
    const userId = req.user!._id.toString();

    const ride = await rideService.submitPayment(rideId, userId, {
      rideId,
      transactionId,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment submitted successfully",
      data: ride,
    });
  }),
);

router.post(
  "/payment/approve/:rideId",
  isAuth,
  isAdmin,
  validateRequest(rideValidation.approvePaymentValidationSchema),
  catchAsync(async (req, res) => {
    const { rideId } = req.params;
    const { approved, rejectionReason } = req.body;
    const adminId = req.user!._id.toString();

    const ride = await rideService.approvePayment(
      rideId,
      adminId,
      approved,
      rejectionReason,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: approved
        ? "Payment approved successfully"
        : "Payment rejected successfully",
      data: ride,
    });
  }),
);

router.get(
  "/payments/pending",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const rides = await rideService.getPendingPayments();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pending payments fetched successfully",
      data: rides,
    });
  }),
);

const rideRouter = router;
export default rideRouter;
