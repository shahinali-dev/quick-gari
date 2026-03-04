/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { notificationService } from "../notification/notification.service";
import { ReturnStatus } from "../return/return.enum";
import ReturnModel from "../return/return.model";
import { RideStatus } from "../ride/ride.enum";
import RideModel from "../ride/ride.model";
import ShareVehicleBookingModel from "../share-vehicle-booking/share_vehicle_booking.model";
import { PaymentFor, PaymentStatus } from "./payment.enum";
import PaymentModel from "./payment.model";
import { ISubmitPaymentPayload } from "./payment.validation";

export class PaymentService {
  // Submit payment for any service (Ride, Return, Share Vehicle Booking)
  async submitPayment(
    userId: string,
    data: ISubmitPaymentPayload,
    paymentFor: PaymentFor,
    amount: number,
  ) {
    // Validate at least one reference ID is provided
    const { rideId, returnId, shareVehicleBookingId, transactionId } = data;

    if (!rideId && !returnId && !shareVehicleBookingId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "One of rideId, returnId, or shareVehicleBookingId is required",
      );
    }

    // Check if transaction ID already exists
    const existingPayment = await PaymentModel.findOne({
      transactionId,
    });

    if (existingPayment) {
      throw new AppError(httpStatus.BAD_REQUEST, "Transaction ID already used");
    }

    // Create payment record
    const payment = await PaymentModel.create({
      transactionId,
      amount,
      paymentMethod: "bkash",
      paymentFor,
      rideId: rideId ? new Types.ObjectId(rideId) : undefined,
      returnId: returnId ? new Types.ObjectId(returnId) : undefined,
      shareVehicleBookingId: shareVehicleBookingId
        ? new Types.ObjectId(shareVehicleBookingId)
        : undefined,
      userId: new Types.ObjectId(userId),
      status: PaymentStatus.PENDING,
      submittedAt: new Date(),
    });

    const populatedPayment = await PaymentModel.findById(payment._id).populate(
      "userId",
      "name phoneNumber",
    );

    // Notify user
    await notificationService.notifyUser(
      userId as any,
      rideId || returnId || shareVehicleBookingId || "",
      "Payment submitted. Admin will verify and confirm shortly.",
      "PAYMENT_SUBMITTED",
      { transactionId, paymentFor },
    );

    return populatedPayment;
  }

  // Approve or reject payment
  async approvePayment(
    paymentId: string,
    adminId: string,
    approved: boolean,
    rejectionReason?: string,
  ) {
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    let serviceModel: any;
    let serviceDoc: any;

    // Get the related service document (Ride, Return, or Share Vehicle Booking)
    if (payment.rideId) {
      serviceModel = RideModel;
      serviceDoc = await serviceModel.findById(payment.rideId);
      serviceDoc.payment = PaymentStatus.APPROVED;
      serviceDoc.status = RideStatus.ACCEPTED;
      await serviceDoc.save();
    } else if (payment.returnId) {
      serviceModel = ReturnModel;
      serviceDoc = await serviceModel.findById(payment.returnId);
      serviceDoc.payment = PaymentStatus.APPROVED;
      serviceDoc.status = ReturnStatus.BOOKED;
      await serviceDoc.save();
    } else if (payment.shareVehicleBookingId) {
      serviceModel = ShareVehicleBookingModel;
      serviceDoc = await serviceModel.findById(payment.shareVehicleBookingId);
      serviceDoc.payment = PaymentStatus.APPROVED;
      await serviceDoc.save();
    }

    if (!serviceDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Related booking not found");
    }

    if (approved) {
      payment.status = PaymentStatus.APPROVED;
      payment.approvedAt = new Date();
      payment.approvedBy = new Types.ObjectId(adminId);

      // Notify user about approval
      await notificationService.notifyUser(
        payment.userId,
        payment.rideId ||
          payment.returnId ||
          payment.shareVehicleBookingId ||
          "",
        `Payment approved! Your ${payment.paymentFor.toLowerCase()} is confirmed.`,
        "PAYMENT_APPROVED",
        { paymentFor: payment.paymentFor },
      );
    } else {
      payment.status = PaymentStatus.REJECTED;
      payment.rejectionReason = rejectionReason || "Payment rejected by admin";

      // Revert service status to allow retry
      serviceDoc.status = "PENDING"; // or appropriate status
      await serviceDoc.save();

      // Notify user about rejection
      await notificationService.notifyUser(
        payment.userId,
        payment.rideId ||
          payment.returnId ||
          payment.shareVehicleBookingId ||
          "",
        `Payment rejected: ${rejectionReason || "Please try again"}`,
        "PAYMENT_REJECTED",
        { paymentFor: payment.paymentFor },
      );
    }

    await payment.save();

    const populatedPayment = await PaymentModel.findById(paymentId)
      .populate("userId", "name phoneNumber")
      .populate("rideId")
      .populate("returnId")
      .populate("shareVehicleBookingId")
      .populate("approvedBy", "name email");

    return populatedPayment;
  }

  // Get all pending payments (for admin)
  async getPendingPayments() {
    const payments = await PaymentModel.find({
      status: PaymentStatus.PENDING,
    })
      .populate("userId", "name phoneNumber")
      .populate("rideId")
      .populate("returnId")
      .populate("shareVehicleBookingId")
      .sort({ submittedAt: -1 });

    return payments;
  }

  // Get pending payments by type
  async getPendingPaymentsByType(paymentFor: PaymentFor) {
    const payments = await PaymentModel.find({
      status: PaymentStatus.PENDING,
      paymentFor,
    })
      .populate("userId", "name phoneNumber")
      .populate("rideId")
      .populate("returnId")
      .populate("shareVehicleBookingId")
      .sort({ submittedAt: -1 });

    return payments;
  }

  // Get user's payment history
  async getUserPayments(userId: string) {
    const payments = await PaymentModel.find({ userId })
      .populate("rideId")
      .populate("returnId")
      .populate("shareVehicleBookingId")
      .sort({ createdAt: -1 });

    return payments;
  }

  // Get payment by ID
  async getPaymentById(paymentId: string) {
    const payment = await PaymentModel.findById(paymentId)
      .populate("userId", "name phoneNumber")
      .populate("rideId")
      .populate("returnId")
      .populate("shareVehicleBookingId")
      .populate("approvedBy", "name email");

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    return payment;
  }
}

export const paymentService = new PaymentService();
