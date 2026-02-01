import { model, Schema } from "mongoose";
import { RideStatus } from "./ride.enum";
import { IRide } from "./ride.interface";

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
