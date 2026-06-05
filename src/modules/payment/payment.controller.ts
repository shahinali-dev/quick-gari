import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import ReturnModel from "../return/return.model";
import RideModel from "../ride/ride.model";
import { shareVehicleService } from "../share-vehicle/share_vehicle.service";
import { PaymentFor } from "./payment.enum";
import { paymentService } from "./payment.service";
import { paymentValidation } from "./payment.validation";

const router = Router();

// User: Submit payment
router.post(
  "/submit",
  isAuth,
  validateRequest(paymentValidation.submitPaymentValidationSchema),
  catchAsync(async (req, res) => {
    const { rideId, returnId, shareVehicleBookingPayload } = req.body;
    const userId = req.user!._id.toString();

    // Determine payment type and get amount from related document
    let paymentFor: PaymentFor;
    let amount: number;

    if (rideId) {
      const ride = await RideModel.findById(rideId);
      if (!ride) {
        return sendResponse(res, {
          success: false,
          statusCode: httpStatus.NOT_FOUND,
          message: "Ride not found",
          data: null,
        });
      }
      paymentFor = PaymentFor.RIDE;
      amount = ride.fare || 0;
    } else if (returnId) {
      const returnDoc = await ReturnModel.findById(returnId);
      if (!returnDoc) {
        return sendResponse(res, {
          success: false,
          statusCode: httpStatus.NOT_FOUND,
          message: "Return not found",
          data: null,
        });
      }

      paymentFor = PaymentFor.RETURN;
      amount = returnDoc.fare || 0;
    } else if (shareVehicleBookingPayload) {
      const shareVehicle = await shareVehicleService.getShareVehicleById(
        shareVehicleBookingPayload.shareVehicleId,
        userId,
      );

      console.log("shareVehicle in payment controller", shareVehicle);
      if (!shareVehicle) {
        return sendResponse(res, {
          success: false,
          statusCode: httpStatus.NOT_FOUND,
          message: "Share vehicle not found",
          data: null,
        });
      }
      paymentFor = PaymentFor.SHARE_VEHICLE;
      amount = shareVehicle.totalPrice || 0;
    } else {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message:
          "One of rideId, returnId, or shareVehicleBookingId is required",
        data: null,
      });
    }

    const payment = await paymentService.submitPayment(
      userId,
      req.body,
      paymentFor,
      amount,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment submitted successfully",
      data: {
        payment,
        paymentDetails: {
          amount,
          paymentFor,
        },
      },
    });
  }),
);

// Admin: Approve/Reject payment
router.post(
  "/approve/:paymentId",
  isAuth,
  isAdmin,
  validateRequest(paymentValidation.approvePaymentValidationSchema),
  catchAsync(async (req, res) => {
    const { paymentId } = req.params;
    const { approved, rejectionReason } = req.body;
    const adminId = req.user!._id.toString();

    const payment = await paymentService.approvePayment(
      paymentId,
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
      data: payment,
    });
  }),
);

// Admin: Get all pending payments
router.get(
  "/pending/all",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const payments = await paymentService.getPendingPayments();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pending payments fetched successfully",
      data: payments,
    });
  }),
);

// Admin: Get pending payments by type
router.get(
  "/pending/:paymentFor",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { paymentFor } = req.params;

    if (!Object.values(PaymentFor).includes(paymentFor as PaymentFor)) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.BAD_REQUEST,
        message: `Invalid payment type. Must be one of: ${Object.values(PaymentFor).join(", ")}`,
        data: null,
      });
    }

    const payments = await paymentService.getPendingPaymentsByType(
      paymentFor as PaymentFor,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Pending ${paymentFor} payments fetched successfully`,
      data: payments,
    });
  }),
);

// User: Get my payments
router.get(
  "/my-payments",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const payments = await paymentService.getUserPayments(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your payments fetched successfully",
      data: payments,
    });
  }),
);

// User: Get single payment
router.get(
  "/:paymentId",
  isAuth,
  catchAsync(async (req, res) => {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment fetched successfully",
      data: payment,
    });
  }),
);

const paymentRouter = router;
export default paymentRouter;
