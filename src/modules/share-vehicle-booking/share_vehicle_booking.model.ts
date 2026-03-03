import { model, Schema } from "mongoose";
import {
  BookingStatus,
  IShareVehicleBooking,
} from "./share_vehicle_booking.interface";

const shareVehicleBookingSchema = new Schema<IShareVehicleBooking>(
  {
    shareVehicle: {
      type: Schema.Types.ObjectId,
      ref: "ShareVehicle",
      required: true,
    },

    passenger: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
      },
    },

    pickupStop: {
      type: String,
      required: true,
      trim: true,
    },

    dropStop: {
      type: String,
      required: true,
      trim: true,
    },

    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
    },

    perSeatFare: {
      type: Number,
      required: true,
      min: 0,
    },

    totalFare: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes
shareVehicleBookingSchema.index({ shareVehicle: 1 });
shareVehicleBookingSchema.index({ "passenger.userId": 1 });
shareVehicleBookingSchema.index({ "passenger.userId": 1, status: 1 });

const ShareVehicleBookingModel = model<IShareVehicleBooking>(
  "ShareVehicleBooking",
  shareVehicleBookingSchema,
);

export default ShareVehicleBookingModel;
