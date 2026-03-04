import { model, Schema } from "mongoose";
import { PaymentStatus, RideStatus } from "./ride.enum";
import { IRide, IRideProposal } from "./ride.interface";

const rideProposalSchema = new Schema<IRideProposal>({
  driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  car: { type: Schema.Types.ObjectId, ref: "Car", required: true },
  fare: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const rideSchema = new Schema<IRide>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    car: { type: Schema.Types.ObjectId, ref: "Car" },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    startLocation: { type: String, required: true },
    endLocation: { type: String, required: true },
    distance: { type: Number },
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    fare: { type: Number },
    proposals: [rideProposalSchema],
    payment: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    status: {
      type: String,
      enum: Object.values(RideStatus),
      default: RideStatus.REQUESTED,
    },
  },
  {
    timestamps: true,
  },
);

const RideModel = model<IRide>("Ride", rideSchema);

export default RideModel;
