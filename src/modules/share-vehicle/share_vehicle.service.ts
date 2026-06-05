/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { combineDateAndTime } from "../../utils/normalize";
import { OTPUtils } from "../../utils/otp_utils";
import { carService } from "../car/car.service";
import { shareVehicleBookingService } from "../share-vehicle-booking/share_vehicle_booking.service";
import { BookingStatus, ShareVehicleStatus } from "./share_vehicle.interface";
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

    const passengers =
      await shareVehicleBookingService.getPassengersForShareVehicle(
        id,
        shareVehicle.carOwner.toString(),
      );

    return {
      ...shareVehicle.toObject(),
      passengers,
    };
  }

  async getShareVehicleByIdWithoutPassengers(id: string) {
    const shareVehicle = await ShareVehicleModel.findById(id);
    if (!shareVehicle) {
      throw new AppError(httpStatus.NOT_FOUND, "Share vehicle not found");
    }

    return shareVehicle;
  }

  async getShareVehiclesByUserId(userId: string) {
    const shareVehicles = await ShareVehicleModel.find({ carOwner: userId });

    const shareVehiclesWithPassengers = await Promise.all(
      shareVehicles.map(async (vehicle) => {
        const passengers =
          await shareVehicleBookingService.getPassengersForShareVehicle(
            vehicle._id!.toString(),
            userId,
          );
        return {
          ...vehicle.toObject(),
          passengers,
        };
      }),
    );
    return shareVehiclesWithPassengers;
  }

  async getShareVehiclesByUserIdWithoutPassengers(userId: string) {
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
    const shareVehicle =
      await this.getShareVehicleByIdWithoutPassengers(shareVehicleId);
    shareVehicle.status = ShareVehicleStatus.CANCELLED;
    await shareVehicle.save();
    return shareVehicle;
  }

  async completeShareVehicle(shareVehicleId: string) {
    const shareVehicle =
      await this.getShareVehicleByIdWithoutPassengers(shareVehicleId);
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
  async verifyOtp(
    shareVehicleId: string,
    driverId: string,
    passengerId: string,
    inputOtp: string,
  ) {
    const booking =
      await shareVehicleBookingService.getUserBookingForShareVehicle(
        shareVehicleId,
        passengerId,
      );

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    if (booking.bookingOtpVerified) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP already verified for this booking",
      );
    }
    if (!booking.bookingOtp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP not generated for this booking",
      );
    }
    if (!booking.bookingOtpExpiry) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP expiry not set for this booking",
      );
    }

    const now = new Date().getTime();
    const expiryTime = new Date(booking.bookingOtpExpiry).getTime();

    const validFrom = expiryTime - 10 * 60 * 1000;
    const validUntil = expiryTime + 30 * 60 * 1000;

    if (now < validFrom) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Ride has not started yet. OTP will be valid 10 minutes before start time",
      );
    }

    if (now > validUntil) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please request a new one",
      );
    }

    const isValid = OTPUtils.verifyOTPSafely(booking.bookingOtp, inputOtp);

    if (!isValid) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    booking.bookingOtpVerified = true;
    booking.status = BookingStatus.CONFIRMED;
    booking.bookingOtp = undefined;
    booking.bookingOtpExpiry = undefined;
    await booking.save();

    // is any other passenger OTP pending for the same share vehicle? If not, mark share vehicle as COMPLETED
    const shareVehicle = await ShareVehicleModel.findById(shareVehicleId);
    if (!shareVehicle) {
      throw new AppError(httpStatus.NOT_FOUND, "Share vehicle not found");
    }

    const passengers =
      await shareVehicleBookingService.getPassengersForShareVehicle(
        shareVehicleId,
        shareVehicle.carOwner.toString(),
      );

    const pendingBookings = passengers.filter(
      (passenger: any) => !passenger.bookingOtpVerified,
    );

    if (pendingBookings.length === 0) {
      shareVehicle.status = ShareVehicleStatus.COMPLETED;
      await shareVehicle.save();
    }

    return booking;
  }
}

export const shareVehicleService = new ShareVehicleService();
