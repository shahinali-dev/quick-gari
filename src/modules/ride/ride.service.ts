import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { normalizeDate, normalizeTime } from "../../utils/normalize";
import { carService } from "../car/car.service";
import { notificationService } from "../notification/notification.service";
import { userService } from "../user/user.service";
import { RideStatus } from "./ride.enum";
import RideModel from "./ride.model";
import { ICreateRidePayload } from "./ride.validation";

export class RideService {
  async isExist(userId: string, date: Date, startTime: Date) {
    const existingRide = await RideModel.findOne({
      user: userId,
      status: RideStatus.REQUESTED,
      date: date,
      startTime: startTime,
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
      user: userId,
    });

    // Populate user info for notification
    const populatedRide = await RideModel.findById(newRide._id).populate(
      "user",
      "name phone",
    );

    // Send real-time notification to all car owners
    await notificationService.sendToCarOwners(
      newRide._id,
      populatedRide?.toObject(),
    );

    return newRide;
  }

  async submitProposal(
    rideId: string,
    driverId: string,
    fare: number,
    message?: string,
  ) {
    const ride = await RideModel.findById(rideId);

    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.status !== RideStatus.REQUESTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Ride is not open for proposals",
      );
    }

    const car = await carService.getCarsByUserId(driverId);
    const carId = car?._id;

    // Check if driver already submitted proposal
    const existingProposal = ride.proposals.find(
      (p) => p.driver.toString() === driverId.toString(),
    );

    if (existingProposal) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already submitted a proposal for this ride",
      );
    }

    // Add proposal
    ride.proposals.push({
      driver: driverId,
      car: carId,
      fare: fare,
      message: message,
      createdAt: new Date(),
    });

    await ride.save();

    // Populate proposal details
    const updatedRide = await RideModel.findById(rideId)
      .populate({
        path: "proposals.driver",
        select: "name phoneNumber avatar",
      })
      .populate({
        path: "proposals.car",
      });

    // Notify user about new proposal
    await notificationService.notifyUser(
      ride.user,
      ride._id,
      "New proposal received for your ride!",
      "NEW_PROPOSAL",
      {
        driverName:
          updatedRide?.proposals[updatedRide.proposals.length - 1].driver,
        fare: fare,
      },
    );

    return updatedRide;
  }

  async acceptProposal(rideId: string, userId: string, proposalId: string) {
    const ride = await RideModel.findById(rideId);

    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.user.toString() !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    if (ride.status !== RideStatus.REQUESTED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Ride is not open");
    }

    // Find proposal by _id instead of index
    const selectedProposal = ride.proposals.find(
      (p) => p._id?.toString() === proposalId,
    );

    if (!selectedProposal) {
      throw new AppError(httpStatus.NOT_FOUND, "Proposal not found");
    }

    // Update ride with selected proposal
    ride.driver = selectedProposal.driver;
    ride.car = selectedProposal.car;
    ride.fare = selectedProposal.fare;
    ride.status = RideStatus.ACCEPTED;

    await ride.save();

    // Populate final ride details
    const populatedRide = await RideModel.findById(ride._id)
      .populate("driver", "name phoneNumber avatar")
      .populate("car");

    // Notify selected driver
    await notificationService.notifyUser(
      selectedProposal.driver,
      ride._id,
      "Your proposal has been accepted!",
      "PROPOSAL_ACCEPTED",
      { ride: populatedRide },
    );

    // Notify other drivers that ride is no longer available
    const rejectedDrivers = ride.proposals
      .filter((p) => p._id?.toString() !== proposalId)
      .map((p) => p.driver);

    for (const driverId of rejectedDrivers) {
      await notificationService.notifyUser(
        driverId,
        ride._id,
        "Ride has been accepted by another driver",
        "RIDE_TAKEN",
        {},
      );
    }

    return populatedRide;
  }

  // Get ride proposals
  async getRideProposals(rideId: string, userId: string) {
    const ride = await RideModel.findById(rideId)
      .populate({
        path: "proposals.driver",
        select: "name phoneNumber avatar",
      })
      .populate({
        path: "proposals.car",
      });

    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    if (ride.user.toString() !== userId) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    return ride.proposals;
  }

  // get ride by id
  async getRideById(rideId: string, userId: string) {
    const ride = await RideModel.findById(rideId);
    if (!ride) {
      throw new AppError(httpStatus.NOT_FOUND, "Ride not found");
    }

    const isRideUser = ride.user.toString() === userId;
    if (!isRideUser) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    const isUserCarOwner = await userService.getUserById(userId);
    if (!isUserCarOwner?.isCarOwner) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    return ride;
  }
}

export const rideService = new RideService();
