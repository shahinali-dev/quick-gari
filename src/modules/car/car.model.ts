import { model, Schema } from "mongoose";
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
    enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
    required: true,
  },
  gearType: {
    type: String,
    enum: ["Manual", "Automatic"],
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
});

const CarSchema = new Schema<ICar>(
  {
    carName: { type: String, required: true, trim: true },

    specification: { type: SpecificationSchema, required: true },

    features: { type: FeatureSchema, required: true },
  },
  { timestamps: true }
);

const CarModel = model<ICar>("Car", CarSchema);

export default CarModel;
