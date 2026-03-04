import { model, Schema } from "mongoose";
import { IShareVehicleFareConfig } from "./share_vehicle_fare.interface";

const shareVehicleFareConfigSchema = new Schema<IShareVehicleFareConfig>(
  {
    fromLocation: { type: String, required: true, trim: true, lowercase: true },
    toLocation: { type: String, required: true, trim: true, lowercase: true },
    perSeatFare: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

shareVehicleFareConfigSchema.index(
  { fromLocation: 1, toLocation: 1 },
  { unique: true },
);

const ShareVehicleFareConfigModel = model<IShareVehicleFareConfig>(
  "ShareVehicleFareConfig",
  shareVehicleFareConfigSchema,
);
export default ShareVehicleFareConfigModel;
