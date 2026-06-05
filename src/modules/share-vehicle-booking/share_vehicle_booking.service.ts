import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { shareVehicleFareConfigService } from "../share-vehicle-fare-config/share_vehicle_fare.service";
import ShareVehicleModel from "../share-vehicle/share_vehicle.model";
import { shareVehicleService } from "../share-vehicle/share_vehicle.service";
import UserModel from "../user/user.model";
import { BookingStatus } from "./share_vehicle_booking.interface";
import ShareVehicleBookingModel from "./share_vehicle_booking.model";
import { ICreateShareVehicleBooking } from "./share_vehicle_booking.validation";

export class ShareVehicleBookingService {
  async createBooking(userId: string, payload: ICreateShareVehicleBooking) {
    // ১. User exist করে কিনা check করো
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // ২. Share vehicle exist করে কিনা check করো
    const shareVehicle = await shareVehicleService.getShareVehicleById(
      payload.shareVehicleId,
    );

    // ३. Share vehicle তে pickup এবং drop stops exist করে কিনা check করো
    const stopLocations = shareVehicle.stops.map((stop) => stop.location);
    if (!stopLocations.includes(payload.pickupStop)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Pickup stop "${payload.pickupStop}" does not exist in this vehicle's route`,
      );
    }
    if (!stopLocations.includes(payload.dropStop)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Drop stop "${payload.dropStop}" does not exist in this vehicle's route`,
      );
    }

    // ४. Pickup এবং drop stop same কিনা check করো
    if (payload.pickupStop === payload.dropStop) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Pickup and drop stops cannot be the same",
      );
    }

    // ५. Stop order check করো
    const pickupOrder = shareVehicle.stops.find(
      (stop) => stop.location === payload.pickupStop,
    )!.order;
    const dropOrder = shareVehicle.stops.find(
      (stop) => stop.location === payload.dropStop,
    )!.order;

    if (pickupOrder >= dropOrder) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid route: "${payload.pickupStop}" comes after "${payload.dropStop}" in this vehicle's route`,
      );
    }

    //pickup location arrival time
    const pickupArrivalTime = shareVehicle.stops.find(
      (stop) => stop.location === payload.pickupStop,
    )!.arrivalTime;

    // ६. Available seats check করো
    if (shareVehicle.availableSeats < payload.seatsBooked) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Only ${shareVehicle.availableSeats} seats available, requested ${payload.seatsBooked}`,
      );
    }

    // ७. Fare configuration exist করে কিনা check করো
    const perSeatFare = await shareVehicleFareConfigService.getFare(
      payload.pickupStop,
      payload.dropStop,
    );

    // ८. Total fare calculate করো
    const totalFare = perSeatFare * payload.seatsBooked;
    //10 % service charge add করো
    const serviceCharge = totalFare * 0.1;
    const totalPriceWithFivePercentServiceCharge = totalFare + serviceCharge;

    // ९. Booking create করো
    const bookingPayload = {
      shareVehicle: new Types.ObjectId(payload.shareVehicleId),
      passenger: {
        userId: new Types.ObjectId(userId),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      pickupStop: payload.pickupStop,
      dropStop: payload.dropStop,
      seatsBooked: payload.seatsBooked,
      perSeatFare,
      totalFare,
      totalPrice: totalPriceWithFivePercentServiceCharge,
      status: BookingStatus.PENDING,
      journeyStartedAt: pickupArrivalTime,
    };

    const booking = await ShareVehicleBookingModel.create(bookingPayload);

    // १०. Update available seats in share vehicle
    await ShareVehicleModel.findByIdAndUpdate(payload.shareVehicleId, {
      $inc: { availableSeats: -payload.seatsBooked },
    });

    return booking;
  }

  async getBookingById(id: string) {
    const booking = await ShareVehicleBookingModel.findById(id)
      .populate("shareVehicle")
      .populate("passenger.userId");

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    return booking;
  }

  async getBookingsByUserId(userId: string) {
    const bookings = await ShareVehicleBookingModel.find({
      "passenger.userId": userId,
    })
      .populate("shareVehicle")
      .sort({ createdAt: -1 });

    return bookings;
  }

  async getBookingsByShareVehicleId(shareVehicleId: string, userId: string) {
    const shareVehicle =
      await shareVehicleService.getShareVehicleById(shareVehicleId);

    if (shareVehicle.carOwner.toString() !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to access this resource",
      );
    }
    const bookings = await ShareVehicleBookingModel.find({
      shareVehicle: shareVehicleId,
    }).sort({ createdAt: -1 });

    return bookings;
  }

  async getUserBookingForShareVehicle(shareVehicleId: string, userId: string) {
    const booking = await ShareVehicleBookingModel.findOne({
      shareVehicle: shareVehicleId,
      "passenger.userId": userId,
    }).select("+bookingOtp +bookingOtpExpiry +bookingOtpVerified");

    return booking;
  }

  async getPassengersForShareVehicle(shareVehicleId: string, userId: string) {
    const shareVehicle = await ShareVehicleModel.findById(shareVehicleId);

    if (!shareVehicle) {
      throw new AppError(httpStatus.NOT_FOUND, "Share vehicle not found");
    }

    if (shareVehicle.carOwner.toString() !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to access this resource",
      );
    }

    const bookings = await ShareVehicleBookingModel.find({
      shareVehicle: shareVehicleId,
      status: BookingStatus.CONFIRMED,
    }).select(
      "passenger pickupStop dropStop seatsBooked totalFare totalPrice payment status bookingOtpVerified",
    );

    return bookings;
  }

  async confirmBooking(bookingId: string) {
    const booking = await this.getBookingById(bookingId);

    if (booking.status === BookingStatus.CONFIRMED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Booking is already confirmed",
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot confirm a cancelled booking",
      );
    }

    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.getBookingById(bookingId);
    if (booking.passenger.userId.toString() !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to cancel this booking",
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Booking is already cancelled",
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    await booking.save();

    // । Share vehicle এ available seats ফেরত দাও
    const shareVehicle = await ShareVehicleModel.findById(booking.shareVehicle);
    if (shareVehicle) {
      shareVehicle.availableSeats += booking.seatsBooked;
      await shareVehicle.save();
    }

    return booking;
  }

  async getConfirmedBookingsForShareVehicle(
    shareVehicleId: string,
    userId: string,
  ) {
    const shareVehicle =
      await shareVehicleService.getShareVehicleById(shareVehicleId);
    if (shareVehicle.carOwner.toString() !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to access this resource",
      );
    }
    const bookings = await ShareVehicleBookingModel.find({
      shareVehicle: shareVehicleId,
      status: BookingStatus.CONFIRMED,
    }).populate("passenger.userId");

    return bookings;
  }

  async getActiveBookingsForPassenger(userId: string) {
    const bookings = await ShareVehicleBookingModel.find({
      "passenger.userId": userId,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    })
      .populate("shareVehicle")
      .sort({ createdAt: -1 });

    return bookings;
  }
}

export const shareVehicleBookingService = new ShareVehicleBookingService();
