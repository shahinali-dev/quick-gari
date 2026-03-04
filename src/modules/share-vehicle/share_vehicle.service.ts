/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { combineDateAndTime } from "../../utils/normalize";
import { carService } from "../car/car.service";
import { ShareVehicleStatus } from "./share_vehicle.interface";
import ShareVehicleModel from "./share_vehicle.model";
import { ICreateShareVehicle } from "./share_vehicle.validation";

export class ShareVehicleService {
  async isExistingShareVehicle(
    userId: string,
    incomingStart: Date,
    incomingEnd: Date,
  ) {
    const existingRides = await ShareVehicleModel.find({
      carOwner: userId,
      status: {
        $in: [ShareVehicleStatus.SCHEDULED, ShareVehicleStatus.ONGOING],
      },
    });

    for (const ride of existingRides) {
      const sortedStops = [...ride.stops].sort((a, b) => a.order - b.order);

      const rideStart = combineDateAndTime(
        ride.journeyDate,
        sortedStops[0].arrivalTime,
      );
      const rideEnd = combineDateAndTime(
        ride.journeyDate,
        sortedStops[sortedStops.length - 1].arrivalTime,
      );

      const hasOverlap = incomingStart < rideEnd && incomingEnd > rideStart;

      if (hasOverlap) {
        return ride;
      }
    }

    return null;
  }

  async createShareVehicle(userId: string, payload: ICreateShareVehicle) {
    // ১. stops অন্তত ২টা আছে কিনা check
    if (!payload.stops || payload.stops.length < 2) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "At least 2 stops required (origin + destination)",
      );
    }

    // ২. stops order অনুযায়ী sort
    const sortedStops = [...payload.stops].sort((a, b) => a.order - b.order);

    // ৩. নতুন ride এর start এবং end time বানাও
    const incomingStart = combineDateAndTime(
      new Date(payload.journeyDate),
      sortedStops[0].arrivalTime,
    );

    const incomingEnd = combineDateAndTime(
      new Date(payload.journeyDate),
      sortedStops[sortedStops.length - 1].arrivalTime,
    );

    // ৪. time range conflict check
    const conflict = await this.isExistingShareVehicle(
      userId,
      incomingStart,
      incomingEnd,
    );
    if (conflict) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You already have a ride scheduled during this time period",
      );
    }

    // ৫. car owner কিনা verify করো
    const car = await carService.getCarsByUserId(userId);
    if (!car) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not a car owner");
    }

    const vehicleInfo = {
      carName: car.carName,
      seatCapacity: car.features.seatCapacity,
      images: car.features.images,
      driverName: (car.user as any).name || "Driver",
    };

    // ৬. create
    const result = await ShareVehicleModel.create({
      ...payload,
      vehicle: vehicleInfo,
      carOwner: userId,
      stops: sortedStops,
      availableSeats: vehicleInfo.seatCapacity,
      status: ShareVehicleStatus.SCHEDULED,
    });

    return result;
  }

  async getShareVehicleById(id: string) {
    const shareVehicle = await ShareVehicleModel.findById(id);
    if (!shareVehicle) {
      throw new AppError(httpStatus.NOT_FOUND, "Share vehicle not found");
    }
    return shareVehicle;
  }

  async getShareVehiclesByUserId(userId: string) {
    const shareVehicles = await ShareVehicleModel.find({ carOwner: userId });
    return shareVehicles;
  }

  async getAvailableShareVehicles(date?: Date) {
    const shareVehicles = await ShareVehicleModel.find({
      status: ShareVehicleStatus.SCHEDULED,
      ...(date && { journeyDate: { $gte: date } }),
    });
    return shareVehicles;
  }

  async cancelShareVehicle(shareVehicleId: string) {
    const shareVehicle = await this.getShareVehicleById(shareVehicleId);
    shareVehicle.status = ShareVehicleStatus.CANCELLED;
    await shareVehicle.save();
    return shareVehicle;
  }

  async completeShareVehicle(shareVehicleId: string) {
    const shareVehicle = await this.getShareVehicleById(shareVehicleId);
    shareVehicle.status = ShareVehicleStatus.COMPLETED;
    await shareVehicle.save();
    return shareVehicle;
  }

  async getOngoingShareVehicles(userId: string) {
    const shareVehicles = await ShareVehicleModel.find({
      carOwner: userId,
      status: ShareVehicleStatus.ONGOING,
    });
    return shareVehicles;
  }
}

export const shareVehicleService = new ShareVehicleService();
