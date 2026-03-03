import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import ShareVehicleFareConfigModel from "./share_vehicle_fare.model";

export class ShareVehicleFareConfigService {
  async setFare(fromLocation: string, toLocation: string, perSeatFare: number) {
    const fare = await ShareVehicleFareConfigModel.findOneAndUpdate(
      {
        fromLocation: fromLocation.toLowerCase(),
        toLocation: toLocation.toLowerCase(),
      },
      { perSeatFare, isActive: true },
      { upsert: true, new: true },
    );
    return fare;
  }

  async getFare(fromLocation: string, toLocation: string): Promise<number> {
    const fare = await ShareVehicleFareConfigModel.findOne({
      fromLocation: fromLocation.toLowerCase(),
      toLocation: toLocation.toLowerCase(),
      isActive: true,
    });

    if (!fare) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `Fare not configured for route: ${fromLocation} → ${toLocation}`,
      );
    }

    return fare.perSeatFare;
  }

  async getAllFares() {
    return ShareVehicleFareConfigModel.find({ isActive: true }).sort({
      fromLocation: 1,
    });
  }

  async deleteFare(id: string) {
    return ShareVehicleFareConfigModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
  }
}

export const shareVehicleFareConfigService =
  new ShareVehicleFareConfigService();
