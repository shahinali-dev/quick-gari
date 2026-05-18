/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { OTPUtils } from "../../utils/otp_utils";
import { EmailService } from "../email/email.service";
import { notificationService } from "../notification/notification.service";
import { ReturnStatus } from "../return/return.enum";
import ReturnModel from "../return/return.model";
import { RideStatus } from "../ride/ride.enum";
import RideModel from "../ride/ride.model";
import { BookingStatus } from "../share-vehicle-booking/share_vehicle_booking.interface";
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

    const userData = populatedPayment?.userId as any;
    await notificationService.notifyAdmins(
      `Payment submitted by ${userData?.name || "User"} — ${paymentFor}`,
      "PAYMENT_SUBMITTED",
      { paymentId: payment._id.toString() },
      { transactionId, amount, paymentFor, userName: userData?.name },
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

    if (payment.status !== PaymentStatus.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment has already been processed",
      );
    }

    let serviceDoc: any;

    // ─── Fetch related service doc ────────────────────────────────────────────
    if (payment.rideId) {
      serviceDoc = await RideModel.findById(payment.rideId)
        .select("+rideOtp +rideOtpExpiry +rideOtpVerified")
        .populate("user", "name email");
    } else if (payment.returnId) {
      serviceDoc = await ReturnModel.findById(payment.returnId)
        .select("+returnOtp +returnOtpExpiry +returnOtpVerified")
        .populate("passenger", "name email"); // Return model e "passenger" ref
    } else if (payment.shareVehicleBookingId) {
      // ShareVehicleBooking e passenger embedded — populate lagbe na
      serviceDoc = await ShareVehicleBookingModel.findById(
        payment.shareVehicleBookingId,
      )
        .select("+bookingOtp +bookingOtpExpiry +bookingOtpVerified")
        .populate("shareVehicle");
    }

    if (!serviceDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Related booking not found");
    }

    // ─── User info extract (model structure different tai alag kore newa) ─────
    // Ride     → serviceDoc.user       (populated)
    // Return   → serviceDoc.passenger  (populated)
    // SVB      → serviceDoc.passenger  (embedded object, already has email)
    const getUserInfo = (): { name: string; email: string } => {
      if (payment.rideId) {
        return serviceDoc.user as { name: string; email: string };
      } else if (payment.returnId) {
        return serviceDoc.passenger as { name: string; email: string };
      } else {
        // ShareVehicleBooking — embedded passenger
        return {
          name: serviceDoc.passenger.name,
          email: serviceDoc.passenger.email,
        };
      }
    };

    // ─── Helper: OTP generate + save + email ─────────────────────────────────
    const generateAndSendOtp = async (config: {
      otpField: string;
      otpExpiryField: string;
      otpVerifiedField: string;
      emailSubject: string;
      emailHeading: string;
      emailBodyText: string;
    }) => {
      const user = getUserInfo();
      const otp = OTPUtils.generateSecureOTP();
      const hashedOtp = OTPUtils.hashOTP(otp);

      // Calculate OTP expiry based on service date/time
      let otpExpiryDate: Date;
      if (payment.rideId) {
        // Ride: startTime is the actual ride time
        otpExpiryDate = new Date(serviceDoc.startTime);
      } else if (payment.returnId) {
        // Return: startTime is the actual return time
        otpExpiryDate = new Date(serviceDoc.startTime);
      } else {
        // ShareVehicleBooking: journeyDate from related ShareVehicle
        otpExpiryDate = new Date(
          serviceDoc.shareVehicle?.journeyDate || new Date(),
        );
      }

      serviceDoc[config.otpField] = hashedOtp;
      serviceDoc[config.otpExpiryField] = otpExpiryDate;
      serviceDoc[config.otpVerifiedField] = false;

      await EmailService.sendOTPEmailGeneric({
        email: user.email,
        name: user.name,
        otp,
        subject: config.emailSubject,
        heading: config.emailHeading,
        icon: "🚗",
        otpLabel: "Share with your driver",
        bodyText: config.emailBodyText,
        infoTitle: "🔒 Important",
        infoBody:
          "• Only share this OTP with your assigned driver<br />" +
          "• Quick Gari support will never ask for your OTP<br />" +
          "• OTP is valid for one-time use only",
      });
    };

    // ─── APPROVED ─────────────────────────────────────────────────────────────
    if (approved) {
      payment.status = PaymentStatus.APPROVED;
      payment.approvedAt = new Date();
      payment.approvedBy = new Types.ObjectId(adminId);

      if (payment.rideId) {
        serviceDoc.serviceCharge =
          Math.round((serviceDoc.fare ?? 0) * 0.1 * 100) / 100;
        serviceDoc.payment = PaymentStatus.APPROVED;
        serviceDoc.status = RideStatus.ACCEPTED;

        await generateAndSendOtp({
          otpField: "rideOtp",
          otpExpiryField: "rideOtpExpiry",
          otpVerifiedField: "rideOtpVerified",
          emailSubject: "Your Ride OTP - Quick Gari",
          emailHeading: "Your Ride Is Confirmed!",
          emailBodyText:
            "Your payment has been approved! Share this OTP with your driver when you board the vehicle. The driver will enter this code to start your ride.",
        });
      } else if (payment.returnId) {
        serviceDoc.serviceCharge =
          Math.round((serviceDoc.fare ?? 0) * 0.1 * 100) / 100;
        serviceDoc.payment = PaymentStatus.APPROVED;
        serviceDoc.status = ReturnStatus.BOOKED;

        // OTP ready — return service e driver verify korbe, same pattern
        await generateAndSendOtp({
          otpField: "returnOtp",
          otpExpiryField: "returnOtpExpiry",
          otpVerifiedField: "returnOtpVerified",
          emailSubject: "Your Return Booking OTP - Quick Gari",
          emailHeading: "Return Booking Confirmed!",
          emailBodyText:
            "Your payment has been approved! Share this OTP with your driver when you board the vehicle.",
        });
      } else if (payment.shareVehicleBookingId) {
        serviceDoc.serviceCharge =
          Math.round((serviceDoc.totalFare ?? 0) * 0.1 * 100) / 100;
        serviceDoc.payment = PaymentStatus.APPROVED;
        serviceDoc.status = BookingStatus.CONFIRMED; // adjust if enum differs

        await generateAndSendOtp({
          otpField: "bookingOtp",
          otpExpiryField: "bookingOtpExpiry",
          otpVerifiedField: "bookingOtpVerified",
          emailSubject: "Your Booking OTP - Quick Gari",
          emailHeading: "Booking Confirmed!",
          emailBodyText:
            "Your payment has been approved! Share this OTP with your driver at the pickup point.",
        });
      }

      await serviceDoc.save();

      // ─── REJECTED ─────────────────────────────────────────────────────────────
    } else {
      payment.status = PaymentStatus.REJECTED;
      payment.rejectionReason = rejectionReason || "Payment rejected by admin";

      // Status revert
      if (payment.rideId) {
        serviceDoc.status = RideStatus.PENDING;
        serviceDoc.payment = PaymentStatus.PENDING;
      } else if (payment.returnId) {
        serviceDoc.status = ReturnStatus.AVAILABLE; // return model er default
        serviceDoc.payment = PaymentStatus.PENDING;
      } else if (payment.shareVehicleBookingId) {
        serviceDoc.status = BookingStatus.PENDING;
        serviceDoc.payment = PaymentStatus.PENDING;
      }

      await serviceDoc.save();

      // Rejection mail — user k janano
      const user = getUserInfo();
      await EmailService.sendOTPEmailGeneric({
        email: user.email,
        name: user.name,
        otp: "—", // OTP nai, placeholder
        subject: "Payment Rejected - Quick Gari",
        heading: "Payment Could Not Be Processed",
        icon: "❌",
        otpLabel: "Reference ID",
        bodyText: `Unfortunately, your payment could not be approved. Reason: ${
          rejectionReason || "Payment rejected by admin"
        }. Please resubmit your payment with a valid transaction ID.`,
        infoTitle: "📞 Need Help?",
        infoBody:
          "• Double-check your bKash transaction ID before resubmitting<br />" +
          "• Contact our support team if you believe this is an error<br />" +
          "• Your booking has been kept — just resubmit the payment",
      });
    }

    await payment.save();

    // ─── Return populated payment ─────────────────────────────────────────────
    const populatedPayment = await PaymentModel.findById(paymentId)
      .populate("userId", "name phoneNumber email")
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
