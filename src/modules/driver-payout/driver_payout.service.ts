import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import QueryBuilder from "../../utils/query_builder.utils";
import { ReturnStatus } from "../return/return.enum";
import ReturnModel from "../return/return.model";
import { RideStatus } from "../ride/ride.enum";
import RideModel from "../ride/ride.model";
import ShareVehicleBookingModel from "../share-vehicle-booking/share_vehicle_booking.model";
import { BookingStatus } from "../share-vehicle/share_vehicle.interface";

export class DriverPayoutService {
  async getPendingDriverPayouts(query: Record<string, unknown>) {
    const ridePayoutsQuery = new QueryBuilder(
      RideModel.find({
        driverPayoutCompleted: false,
        status: RideStatus.COMPLETED,
      })
        .populate("driver", "name phoneNumber avatar")
        .populate("car", "carName features")
        .populate("user", "name phoneNumber avatar"),
      query,
    )
      .search(["startLocation", "endLocation"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const returnPayoutsQuery = new QueryBuilder(
      ReturnModel.find({
        driverPayoutCompleted: false,
        status: ReturnStatus.COMPLETED,
      })
        .populate("driver", "name phoneNumber avatar")
        .populate("car", "carName features")
        .populate("passenger", "name phoneNumber avatar"),
      query,
    )
      .search(["startLocation", "endLocation"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const shareVehicleBookingPayoutsQuery = new QueryBuilder(
      ShareVehicleBookingModel.find({
        driverPayoutCompleted: false,
        status: BookingStatus.CONFIRMED,
      })
        .populate("shareVehicle")
        .populate("passenger.userId", "name phoneNumber avatar"),
      query,
    )
      .search(["pickupStop", "dropStop"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const [
      rides,
      returns,
      shareVehicleBookings,
      rideMeta,
      returnMeta,
      shareVehicleBookingMeta,
    ] = await Promise.all([
      ridePayoutsQuery.modelQuery,
      returnPayoutsQuery.modelQuery,
      shareVehicleBookingPayoutsQuery.modelQuery,
      ridePayoutsQuery.countTotal(),
      returnPayoutsQuery.countTotal(),
      shareVehicleBookingPayoutsQuery.countTotal(),
    ]);

    return {
      result: {
        rides,
        returns,
        shareVehicleBookings,
      },
      meta: {
        rides: rideMeta,
        returns: returnMeta,
        shareVehicleBookings: shareVehicleBookingMeta,
      },
    };
  }

  async completeDriverPayout(
    id: string,
    type: "ride" | "return" | "shareVehicleBooking",
  ) {
    if (type === "ride") {
      const ride = await RideModel.findByIdAndUpdate(
        id,
        { driverPayoutCompleted: true },
        { new: true },
      );

      if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
      }

      return ride;
    }

    if (type === "return") {
      const returnRide = await ReturnModel.findByIdAndUpdate(
        id,
        { driverPayoutCompleted: true },
        { new: true },
      );

      if (!returnRide) {
        throw new AppError(httpStatus.NOT_FOUND, "Return ride not found");
      }

      return returnRide;
    }

    if (type === "shareVehicleBooking") {
      const shareVehicleBooking =
        await ShareVehicleBookingModel.findByIdAndUpdate(
          id,
          { driverPayoutCompleted: true },
          { new: true },
        );

      if (!shareVehicleBooking) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Share vehicle booking not found",
        );
      }

      return shareVehicleBooking;
    }

    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid type. Must be 'ride', 'return', or 'shareVehicleBooking'",
    );
  }
}

export const driverPayoutService = new DriverPayoutService();
