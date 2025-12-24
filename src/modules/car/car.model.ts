import { Schema, model } from "mongoose";
import { FuelType, GearType } from "./car.enum";
import { ICar, IFeature, ISpecification } from "./car.interface";

const SpecificationSchema = new Schema<ISpecification>({
  maxPower: { type: String, required: true },
  fuelEconomy: { type: String, required: true },
  maxSpeed: { type: String, required: true },
  zeroToSixty: { type: String, required: true },
});

const FeatureSchema = new Schema<IFeature>({
  model: { type: String, required: true },
  capacity: { type: String, required: true },
  color: { type: String, required: true },

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

  seat: {
    type: Number,
    required: true,
    min: 1,
  },
});

const CarSchema = new Schema<ICar>(
  {
    carName: { type: String, required: true, trim: true },

    specification: { type: SpecificationSchema, required: true },

    features: { type: FeatureSchema, required: true },

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
  { timestamps: true }
);

const CarModel = model<ICar>("Car", CarSchema);

export default CarModel;
