import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { normalizeDate, normalizeTime } from "../../utils/normalize";
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
        .populate("car"),
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
      .populate("car")
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
      .populate("car");

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

    if (!returnDoc.returnOtpExpiry || new Date() > returnDoc.returnOtpExpiry) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "OTP has expired. Please contact support to resend",
      );
    }

    const isValid = OTPUtils.verifyOTPSafely(returnDoc.returnOtp, inputOtp);

    if (!isValid) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    // Clear OTP, mark ongoing
    returnDoc.returnOtpVerified = true;
    returnDoc.returnOtp = undefined as any;
    returnDoc.returnOtpExpiry = undefined as any;
    await returnDoc.save();

    return {
      message: "OTP verified. Return journey has started!",
      returnId: returnDoc._id,
    };
  }
}

export const returnService = new ReturnService();
