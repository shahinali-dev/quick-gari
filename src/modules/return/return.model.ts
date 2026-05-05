import { model, Schema } from "mongoose";
import { PaymentStatus } from "../ride/ride.enum";
import { ReturnStatus } from "./return.enum";
import { IReturn } from "./return.interface";

const returnSchema = new Schema<IReturn>(
  {
    passenger: { type: Schema.Types.ObjectId, ref: "User" },
    car: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startLocation: { type: String, required: true },
    endLocation: { type: String, required: true },
    distance: { type: Number },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    fare: { type: Number },
    amount: { type: Number },
    payment: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.AVAILABLE,
    },
    returnOtp: { type: String, select: false },
    returnOtpExpiry: { type: Date, select: false },
    returnOtpVerified: { type: Boolean, default: false },
    serviceCharge: { type: Number },
  },
  {
    timestamps: true,
  },
);

const ReturnModel = model<IReturn>("Return", returnSchema);

export default ReturnModel;
