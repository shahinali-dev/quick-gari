import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { normalizeDate, normalizeTime } from "../../utils/normalize";
import { notificationService } from "../notification/notification.service";
import { ReturnStatus } from "./return.enum";
import ReturnModel from "./return.model";
import { IReturnRide } from "./return.validation";

export class ReturnService {
  async isExist(userId: string, date: Date) {
    const existingReturnRide = await ReturnModel.findOne({
      user: userId,
      status: ReturnStatus.AVAILABLE,
      date,
    });

    return !!existingReturnRide;
  }

  async createAReturnRide(payload: IReturnRide, userId: string) {
    const date = normalizeDate(new Date(payload.date));
    const startTime = normalizeTime(new Date(payload.startTime));

    const isExistingReturnRide = await this.isExist(userId, date);

    if (isExistingReturnRide) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already created a return ride on this date",
      );
    }

    const newReturnRide = await ReturnModel.create({
      ...payload,
      date,
      startTime,
      driver: userId,
    });

    return newReturnRide;
  }

  async getAllReturnRides() {
    const returnRides = await ReturnModel.find({
      status: ReturnStatus.AVAILABLE,
    })
      .populate("driver", "name phoneNumber profileImage rating")
      .populate("car", "model brand color licensePlate")
      .sort({ createdAt: -1 });

    return returnRides;
  }

  async getReturnRideById(id: string) {
    const returnRide = await ReturnModel.findById(id)
      .populate("driver", "name phoneNumber profileImage rating")
      .populate("car", "model brand color licensePlate")
      .populate("passenger", "name phoneNumber profileImage");

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

    if (returnRide.driver.toString() === userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot book your own return ride",
      );
    }

    returnRide.status = ReturnStatus.BOOKED;
    returnRide.passenger = userId;
    await returnRide.save();

    const updatedReturnRide = await ReturnModel.findById(id)
      .populate("passenger", "name phoneNumber profileImage")
      .populate("driver", "name phoneNumber profileImage")
      .populate("car");

    // Notify driver
    await notificationService.notifyUser(
      returnRide.driver,
      updatedReturnRide!._id,
      "You got a booking for return trip",
      "GOT_RETURN_TRIP_BOOKING",
      {
        passenger: updatedReturnRide?.passenger,
        returnRide: updatedReturnRide,
      },
    );

    return updatedReturnRide;
  }
}

export const returnService = new ReturnService();
