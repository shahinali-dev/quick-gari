import { model, Schema } from "mongoose";
import { ReturnStatus } from "./return.enum";
import { IReturn } from "./return.interface";

const returnSchema = new Schema<IReturn>(
  {
    passenger: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.REQUESTED,
    },
  },
  {
    timestamps: true,
  },
);

const ReturnModel = model<IReturn>("Return", returnSchema);

export default ReturnModel;
