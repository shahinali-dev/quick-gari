import { Types } from "mongoose";
import { PaymentFor, PaymentStatus } from "./payment.enum";

export interface IPayment {
  _id?: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentMethod: string; // "bkash"
  paymentFor: PaymentFor; // RIDE, RETURN, SHARE_VEHICLE
  rideId?: Types.ObjectId; // If payment is for ride
  returnId?: Types.ObjectId; // If payment is for return
  shareVehicleBookingId?: Types.ObjectId; // If payment is for share vehicle booking
  userId: Types.ObjectId; // User who made the payment
  status: PaymentStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId; // Admin who approved
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
