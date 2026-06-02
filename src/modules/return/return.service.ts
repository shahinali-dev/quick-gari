import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import {
  combineDateAndTime,
  normalizeDate,
  normalizeTime,
} from "../../utils/normalize";
import { OTPUtils } from "../../utils/otp_utils";
import QueryBuilder from "../../utils/query_builder.utils";
import { carService } from "../car/car.service";
import { notificationService } from "../notification/notification.service";
import { userService } from "../user/user.service";
import { ReturnStatus } from "./return.enum";
import ReturnModel from "./return.model";
import { IReturnRide } from "./return.validation";

export class ReturnService {
  async isExist(userId: string, date: Date) {
    const existingReturnRide = await ReturnModel.findOne({
      driver: userId,
      status: ReturnStatus.AVAILABLE,
      date,
    });

    return !!existingReturnRide;
  }

  async createAReturnRide(payload: IReturnRide, userId: string) {
    const date = normalizeDate(new Date(payload.date));
    const startTime = normalizeTime(new Date(payload.startTime));

    const hours = startTime.getHours().toString().padStart(2, "0");
    const minutes = startTime.getMinutes().toString().padStart(2, "0");
    const rideDateTime = combineDateAndTime(date, `${hours}:${minutes}`);

    const now = new Date();

    // ✅ Past check
    if (rideDateTime <= now) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Return ride cannot be created for a past date or time",
      );
    }

    // ✅ Future limit check — max 10 days in advance
    const MAX_ADVANCE_DAYS = 10;
    const maxAllowedDate = new Date(
      now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000,
    );
    if (rideDateTime > maxAllowedDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Return ride cannot be scheduled more than ${MAX_ADVANCE_DAYS} days in advance`,
      );
    }

    const user = await userService.getUserById(userId);
    if (!user?.isCarOwner) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not a car owner");
    }

    const isExistingReturnRide = await this.isExist(userId, date);
    if (isExistingReturnRide) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already created a return ride on this date",
      );
    }

    const car = await carService.getCarsByUserId(userId);
    if (!car) {
      throw new AppError(httpStatus.BAD_REQUEST, "No car found for this user");
    }

    const newReturnRide = await ReturnModel.create({
      ...payload,
      date,
      startTime,
      driver: userId,
      car: car._id,
    });

    return newReturnRide;
  }

  async getAllReturnRides(query: Record<string, unknown>) {
    const returnTripsQuery = new QueryBuilder(
      ReturnModel.find({ status: ReturnStatus.AVAILABLE })
        .populate("driver", "name phoneNumber avatar")
        .populate("car", "carName features"),
      query,
    )
      .search(["startLocation", "endLocation"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await returnTripsQuery.modelQuery;
    const meta = await returnTripsQuery.countTotal();

    return { result, meta };
  }

  async getReturnRideById(id: string) {
    const returnRide = await ReturnModel.findById(id)
      .populate("driver", "name phoneNumber avatar ")
      .populate("car", "carName features")
      .populate("passenger", "name phoneNumber avatar");

    if (!returnRide) {
      throw new AppError(httpStatus.NOT_FOUND, "Return ride not found");
    }

    return returnRide;
  }

  async bookReturnRide(id: string, userId: string) {
    const returnRide = await ReturnModel.findById(id);

    if (!returnRide) {
      throw new AppError(httpStatus.NOT_FOUND, "Return ride not found");
    }

    const existingBooking = await ReturnModel.findOne({
      passenger: userId,
      status: ReturnStatus.BOOKED,
    });

    if (existingBooking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You already have an active return ride booking. Complete it before booking a new one",
      );
    }

    if (returnRide.status !== ReturnStatus.AVAILABLE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This return ride is already booked",
      );
    }

    if (!returnRide.driver) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid return ride driver");
    }

    if (returnRide.driver.toString() === userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot book your own return ride",
      );
    }

    returnRide.status = ReturnStatus.BOOKED;
    returnRide.passenger = new Types.ObjectId(userId);
    await returnRide.save();

    const updatedReturnRide = await ReturnModel.findById(id)
      .populate("passenger", "name phoneNumber avatar")
      .populate("driver", "name phoneNumber avatar")
      .populate("car", "carName features");

    // Notify driver
    await notificationService.notifyUser(
      new Types.ObjectId(returnRide.driver.toString()),
      "You got a booking for return trip",
      "GOT_RETURN_TRIP_BOOKING",
      { rideId: updatedReturnRide!._id.toString() },
    );

    return updatedReturnRide;
  }

  // return.service.ts — ReturnService class e add koro
  async verifyReturnOtp(returnId: string, driverId: string, inputOtp: string) {
    const returnDoc = await ReturnModel.findById(returnId).select(
      "+returnOtp +returnOtpExpiry +returnOtpVerified",
    );

    if (!returnDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Return booking not found");
    }

    // Return model e driver field directly ache
    if (returnDoc.driver?.toString() !== driverId.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not the assigned driver for this return",
      );
    }

    if (returnDoc.status !== ReturnStatus.BOOKED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Return booking is not in a verifiable state",
      );
    }

    if (returnDoc.returnOtpVerified) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has already been verified for this booking",
      );
    }

    if (!returnDoc.returnOtp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP found for this booking. Please contact support",
      );
    }

    if (!returnDoc.returnOtpExpiry) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No OTP expiry found for this booking. Please contact support",
      );
    }

    const now = new Date().getTime();
    const expiryTime = new Date(returnDoc.returnOtpExpiry).getTime();

    // OTP valid 10 min before expiry
    const validForm = expiryTime - 10 * 60 * 1000;

    // 30 min OTP expiry
    const validUntil = expiryTime + 30 * 60 * 1000;

    if (now < validForm) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Return trip has not started yet. OTP will be valid 10 minutes before start time",
      );
    }

    if (now > validUntil) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please contact support to generate a new OTP",
      );
    }

    const isValid = OTPUtils.verifyOTPSafely(returnDoc.returnOtp, inputOtp);

    if (!isValid) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    // Clear OTP, mark ongoing
    returnDoc.returnOtpVerified = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returnDoc.returnOtp = undefined as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returnDoc.returnOtpExpiry = undefined as any;
    returnDoc.status = ReturnStatus.COMPLETED;
    await returnDoc.save();

    return {
      message: "OTP verified. Return journey has started!",
      returnId: returnDoc._id,
    };
  }

  // Driver active return rides
  async getActiveReturnRidesForDriver(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeReturnRides = await ReturnModel.find({
      driver: driverId,
      status: { $in: [ReturnStatus.BOOKED, ReturnStatus.AVAILABLE] },
      createdAt: { $gte: today },
    })
      .populate("passenger", "name phoneNumber avatar")
      .populate("car", "carName features");

    if (!activeReturnRides.length) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No active return rides found for this driver",
      );
    }

    return activeReturnRides;
  }

  // Passenger active return rides
  async getActiveReturnRidesForPassenger(passengerId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeReturnRides = await ReturnModel.find({
      passenger: passengerId,
      status: ReturnStatus.BOOKED,
      createdAt: { $gte: today },
    })
      .populate("driver", "name phoneNumber avatar")
      .populate("car", "carName features");

    if (!activeReturnRides.length) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No active return rides found for this passenger",
      );
    }

    return activeReturnRides;
  }

  // Driver completed return rides
  async getCompletedReturnRidesForDriver(driverId: string) {
    const completedRides = await ReturnModel.find({
      driver: driverId,
      status: ReturnStatus.COMPLETED,
    })
      .populate("passenger", "name phoneNumber avatar")
      .populate("car", "carName features");

    return completedRides;
  }

  // Passenger completed return rides
  async getCompletedReturnRidesForPassenger(passengerId: string) {
    const completedRides = await ReturnModel.find({
      passenger: passengerId,
      status: ReturnStatus.COMPLETED,
    })
      .populate("driver", "name phoneNumber avatar")
      .populate("car", "carName features");

    return completedRides;
  }
}

export const returnService = new ReturnService();
