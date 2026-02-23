import { model, Schema } from "mongoose";
import { IShareVehicle, ShareVehicleStatus } from "./share_vehicle.interface";

const shareVehicleSchema = new Schema<IShareVehicle>(
  {
    carOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: {
      carName: { type: String, required: true, trim: true },
      seatCapacity: { type: Number, required: true, min: 1 },
      images: [{ type: String }],
      driverName: { type: String, required: true, trim: true },
    },

    journeyDate: {
      type: Date,
      required: true,
    },

    stops: {
      type: [
        {
          location: { type: String, required: true, trim: true },
          arrivalTime: { type: String, required: true },
          order: { type: Number, required: true },
          perSeatFare: {
            type: Number,
            required: true,
            min: 0,
          },
          _id: false,
        },
      ],
      validate: {
        validator: (stops: IShareVehicle["stops"]) => stops.length >= 2,
        message: "At least 2 stops required (origin + destination)",
      },
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(ShareVehicleStatus),
      default: ShareVehicleStatus.SCHEDULED,
    },
  },
  {
    timestamps: true,
  },
);

shareVehicleSchema.index({ journeyDate: 1, status: 1 });

const ShareVehicleModel = model<IShareVehicle>(
  "ShareVehicle",
  shareVehicleSchema,
);

export default ShareVehicleModel;
