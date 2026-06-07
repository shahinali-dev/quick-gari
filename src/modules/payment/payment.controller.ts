import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
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
    const userId = req.user!._id.toString();

    const payment = await paymentService.submitPayment(userId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment submitted successfully",
      data: { payment },
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
    const payments = await paymentService.getPendingPayments(req.query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pending payments fetched successfully",
      data: payments.data,
      meta: payments.meta,
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
