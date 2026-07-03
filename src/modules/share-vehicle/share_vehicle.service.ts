/* eslint-disable @typescript-eslint/no-explicit-any */
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { combineDateAndTime } from "../../utils/normalize";
import { OTPUtils } from "../../utils/otp_utils";
import { carService } from "../car/car.service";
import { shareVehicleBookingService } from "../share-vehicle-booking/share_vehicle_booking.service";
import { BookingStatus, ShareVehicleStatus } from "./share_vehicle.interface";
import ShareVehicleModel from "./share_vehicle.model";
import { ICreateShareVehicle } from "./share_vehicle.validation";

const TIMEZONE = "Asia/Dhaka"; // UTC+6

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

    // ২. arrivalTime format validate → "HH:MM" বা "H:MM"
    const timeRegex = /^\d{1,2}:\d{2}$/;
    for (const stop of payload.stops) {
      if (!timeRegex.test(stop.arrivalTime)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid arrivalTime format "${stop.arrivalTime}" at order ${stop.order}. Use HH:MM (e.g. 14:30)`,
        );
      }
    }

    // ৩. stops order অনুযায়ী sort
    const sortedStops = [...payload.stops].sort((a, b) => a.order - b.order);

    // ৪. helper: Dhaka time "H:MM" + journeyDate → UTC Date
    const buildUtcDateTime = (timeStr: string): Date => {
      const [hoursStr, minutesStr] = timeStr.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      const localDateTimeStr = `${payload.journeyDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
      return fromZonedTime(localDateTimeStr, TIMEZONE);
    };

    // ৫. journeyDate টা past date কিনা check (Dhaka timezone এ today এর সাথে compare)
    const nowInDhaka = toZonedTime(new Date(), TIMEZONE);
    const todayStrInDhaka = `${nowInDhaka.getFullYear()}-${String(nowInDhaka.getMonth() + 1).padStart(2, "0")}-${String(nowInDhaka.getDate()).padStart(2, "0")}`;

    if (payload.journeyDate < todayStrInDhaka) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Journey date "${payload.journeyDate}" is in the past. Please select today or a future date.`,
      );
    }

    // ৬. incomingStart এবং incomingEnd বানাও
    const incomingStart = buildUtcDateTime(sortedStops[0].arrivalTime);
    const incomingEnd = buildUtcDateTime(
      sortedStops[sortedStops.length - 1].arrivalTime,
    );

    // ৭. journeyDate আজকে হলে → first stop এর time current time এর পরে হতে হবে
    if (payload.journeyDate === todayStrInDhaka) {
      const nowUtc = new Date();
      if (incomingStart <= nowUtc) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Today's journey start time "${sortedStops[0].arrivalTime}" has already passed. Please set a future time.`,
        );
      }
    }

    // ৮. stop গুলোর time chronological order এ আছে কিনা check
    for (let i = 1; i < sortedStops.length; i++) {
      const prevTime = buildUtcDateTime(sortedStops[i - 1].arrivalTime);
      const currTime = buildUtcDateTime(sortedStops[i].arrivalTime);

      if (currTime <= prevTime) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Stop order ${sortedStops[i].order} arrivalTime "${sortedStops[i].arrivalTime}" must be after order ${sortedStops[i - 1].order} arrivalTime "${sortedStops[i - 1].arrivalTime}"`,
        );
      }
    }

    // ৯. time range conflict check
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

    // ১০. car owner কিনা verify করো
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

    // ১১. stops এ UTC datetime সহ save করো
    const stopsWithUtcTime = sortedStops.map((stop) => ({
      ...stop,
      arrivalTimeUtc: buildUtcDateTime(stop.arrivalTime),
    }));

    // ১২. create
    const result = await ShareVehicleModel.create({
      ...payload,
      vehicle: vehicleInfo,
      journeyDate: incomingStart,
      carOwner: userId,
      stops: stopsWithUtcTime,
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
      availableSeats: { $gt: 0 },
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

    console.log("booking", booking);

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

    console.log("shareVehicle from db", shareVehicle);
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
