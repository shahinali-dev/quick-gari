import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { normalizeDate, normalizeTime } from "../../utils/normalize";
import { RideStatus } from "./ride.enum";
import RideModel from "./ride.model";
import { ICreateRidePayload } from "./ride.validation";

export class RideService {
  async isExist(userId: string, date: Date, startTime: Date) {
    const normalizedDate = normalizeDate(date);
    const normalizedTime = normalizeTime(startTime);

    const existingRide = await RideModel.findOne({
      user: userId,
      status: RideStatus.REQUESTED,
      date: normalizedDate,
      startTime: normalizedTime,
    });

    return !!existingRide;
  }

  async requestForARide(userId: string, data: ICreateRidePayload) {
    const date = normalizeDate(new Date(data.date));
    const startTime = normalizeTime(new Date(data.startTime));

    const isExistingRide = await this.isExist(userId, date, startTime);

    if (isExistingRide) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already requested for a ride on this date and time",
      );
    }

    const newRide = await RideModel.create({
      ...data,
      date,
      startTime,
    });

    return newRide;
  }

  async acceptRide(rideId: string, driverId: string, fare: number) {
    const ride = await RideModel.findById(rideId);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }
    if (ride.status !== RideStatus.REQUESTED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Ride is Already Accepted");
    }
    ride.driver = driverId;
    ride.fare = fare;
    ride.status = RideStatus.ACCEPTED;
    await ride.save();
    return ride;
  }
}

export const rideService = new RideService();
