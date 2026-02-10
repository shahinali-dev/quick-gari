import { Schema, model } from "mongoose";
import { FuelType, GearType, vehicleType } from "./car.enum";
import { ICar, IFeature } from "./car.interface";

const VehicleRegistrationSchema = new Schema({
  registrationNumber: { type: String, required: true },
  registration: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
  },
  taxTokenPhoto: { type: String, required: true },
  registrationCardPhoto: { type: String, required: true },
});

const FeatureSchema = new Schema<IFeature>({
  vehicleType: {
    type: String,
    enum: Object.values(vehicleType),
    required: true,
  },

  model: { type: String, required: true },
  brand: { type: String, required: true },

  fuelType: {
    type: String,
    enum: Object.values(FuelType),
    required: true,
  },

  gearType: {
    type: String,
    enum: Object.values(GearType),
    required: true,
  },

  images: {
    type: [String],
    required: true,
    validate: {
      validator: (arr: string[]) => arr.length > 0,
      message: "At least one image is required",
    },
  },

  seatCapacity: {
    type: Number,
    required: true,
    min: 1,
  },
  manufactureYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear(),
  },
});

const CarSchema = new Schema<ICar>(
  {
    carName: { type: String, required: true, trim: true },

    features: { type: FeatureSchema, required: true },

    vehicleRegistration: {
      type: VehicleRegistrationSchema,
      required: true,
    },
    drivingLicensePhoto: {
      type: String,
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const CarModel = model<ICar>("Car", CarSchema);

export default CarModel;
