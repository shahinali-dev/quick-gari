import { model, Schema } from "mongoose";
import { PaymentFor, PaymentStatus } from "./payment.enum";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "bkash" },
    paymentFor: {
      type: String,
      enum: Object.values(PaymentFor),
      required: true,
    },
    rideId: { type: Schema.Types.ObjectId, ref: "Ride" },
    returnId: { type: Schema.Types.ObjectId, ref: "Return" },
    shareVehicleBookingId: {
      type: Schema.Types.ObjectId,
      ref: "ShareVehicleBooking",
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    submittedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
paymentSchema.index({ status: 1, paymentFor: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ returnId: 1 });
paymentSchema.index({ shareVehicleBookingId: 1 });

const PaymentModel = model<IPayment>("Payment", paymentSchema);

export default PaymentModel;
