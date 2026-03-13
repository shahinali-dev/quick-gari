/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import {
  cleanupUploadedFiles,
  deleteMultipleFromCloudinary,
} from "../../utils/cloudinary.utils";
import QueryBuilder from "../../utils/query_builder.utils";
import { userService } from "../user/user.service";
import { ICar, ICarFiles, ICreateCarPayload } from "./car.interface";
import CarModel from "./car.model";

export class CarService {
  //  REGISTER CAR
  async registerCar(data: ICreateCarPayload, files: ICarFiles, userId: string) {
    try {
      const carPayload: ICar = {
        carName: data.carName,
        features: {
          ...data.features,
          images: files.images.map((file) => file.path),
        },
        vehicleRegistration: {
          ...data.vehicleRegistration,
          taxTokenPhoto: files.taxTokenPhoto[0].path,
          registrationCardPhoto: files.registrationCardPhoto[0].path,
        },
        drivingLicensePhoto: files.drivingLicensePhoto[0].path,
        user: userId,
      };

      const newCar = await CarModel.create(carPayload);

      // Populate user info for notification
      const populatedCar = await CarModel.findById(newCar._id).populate(
        "user",
        "name email",
      );

      // Send real-time notification to all admins
      const userData = populatedCar?.user as any;
      await notificationService.notifyAdmins(
        `New car registration request from ${userData?.name || "User"}`,
        "CAR_REGISTRATION",
        { carId: newCar._id.toString() },
        {
          carName: newCar.carName,
          userName: userData?.name,
          userEmail: userData?.email,
        },
      );

      return newCar;
    } catch (error) {
      // Automatically cleanup all uploaded files
      await cleanupUploadedFiles(files as any);
      throw error;
    }
  }

  // approve a car
  async approveCar(carId: string) {
    const car = await CarModel.findById(carId);
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }
    car.isApproved = true;
    await car.save();

    await userService.makeCarOwner(car.user.toString());
    return car;
  }

  // 📌 GET ALL CARS
  async getAllCars(query: Record<string, unknown>) {
    const searchableFields = ["carName"];

    const queryBuilder = new QueryBuilder(
      CarModel.find().populate("user", "name email avatar"),
      query,
    )
      .search(searchableFields)
      .filter()
      .sort()
      .paginate();

    const result = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    return {
      data: result,
      meta,
    };
  }

  //get all car registration requests (admin)
  async getAllCarRegistrationRequests(query: Record<string, unknown>) {
    const searchableFields = ["carName"];

    const queryBuilder = new QueryBuilder(
      CarModel.find({ isApproved: false, isDeleted: false }).populate(
        "user",
        "name email avatar",
      ),
      query,
    )
      .search(searchableFields)
      .filter()
      .sort()
      .paginate();

    const result = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    return {
      data: result,
      meta,
    };
  }

  // Get approved cars
  async getApprovedCars() {
    const cars = await CarModel.find({ isApproved: true });
    return cars;
  }

  // 🔍 GET SINGLE CAR BY ID
  async getCarById(id: string) {
    const car = await CarModel.findOne({ _id: id, isApproved: true });
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }
    return car;
  }

  // get car by id (admin)
  async getCarByIdAdmin(id: string) {
    const car = await CarModel.findById(id);
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }
    return car;
  }

  //  UPDATE CAR
  async updateCar(
    id: string,
    userId: string,
    payload: Partial<ICreateCarPayload>,
    files?: ICarFiles,
  ) {
    const car = await CarModel.findById(id);

    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }

    // Authorization check
    const user = await userService.getUserById(userId);
    const isOwner = car.user.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      // || থেকে && করুন
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to update this car",
      );
    }

    // Collect old images for cleanup
    const oldImagesToDelete: string[] = [];

    try {
      const updatedPayload: any = {}; // Partial<ICar> এর বদলে any ব্যবহার করুন

      // Handle carName
      if (payload.carName) {
        updatedPayload.carName = payload.carName;
      }

      // Handle feature images update
      if (files?.images && files.images.length > 0) {
        oldImagesToDelete.push(...car.features.images);

        updatedPayload.features = {
          ...car.features,
          ...payload.features,
          images: files.images.map((file) => file.path),
        };
      } else if (payload.features) {
        updatedPayload.features = {
          ...car.features,
          ...payload.features,
          images: car.features.images,
        };
      }

      // Handle tax token photo update
      if (files?.taxTokenPhoto?.[0]) {
        oldImagesToDelete.push(car.vehicleRegistration.taxTokenPhoto);

        updatedPayload.vehicleRegistration = {
          ...car.vehicleRegistration,
          ...payload.vehicleRegistration,
          taxTokenPhoto: files.taxTokenPhoto[0].path,
        };
      } else if (payload.vehicleRegistration) {
        updatedPayload.vehicleRegistration = {
          ...car.vehicleRegistration,
          ...payload.vehicleRegistration,
        };
      }

      // Handle registration card photo update
      if (files?.registrationCardPhoto?.[0]) {
        oldImagesToDelete.push(car.vehicleRegistration.registrationCardPhoto);

        updatedPayload.vehicleRegistration = {
          ...updatedPayload.vehicleRegistration!,
          registrationCardPhoto: files.registrationCardPhoto[0].path,
        };
      }

      // Handle driving license photo update
      if (files?.drivingLicensePhoto?.[0]) {
        oldImagesToDelete.push(car.drivingLicensePhoto);
        updatedPayload.drivingLicensePhoto = files.drivingLicensePhoto[0].path;
      }

      // Update in database
      const updated = await CarModel.findByIdAndUpdate(id, updatedPayload, {
        new: true,
        runValidators: true,
      });

      // Clean up old images
      if (oldImagesToDelete.length > 0) {
        await deleteMultipleFromCloudinary(oldImagesToDelete);
        console.log(`🗑️ Cleaned up ${oldImagesToDelete.length} old images`);
      }

      return updated;
    } catch (error) {
      if (files) {
        await cleanupUploadedFiles(files as any); // Type assertion
        console.log("🧹 Rolled back newly uploaded files");
      }
      throw error;
    }
  }

  // DELETE CAR
  async deleteCar(id: string, userId: string) {
    const car = await CarModel.findById(id);

    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }

    // Already deleted check
    if (car.isDeleted) {
      throw new AppError(httpStatus.BAD_REQUEST, "Car is already deleted");
    }

    // Authorization check
    const user = await userService.getUserById(userId);
    const isOwner = car.user.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      // || থেকে && করুন
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this car",
      );
    }

    const deleted = await CarModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );

    return deleted;
  }

  // get car by user id
  async getCarsByUserId(userId: string) {
    const cars = await CarModel.findOne({ user: userId })
      .populate("user", "name email")
      .select("carName features user");
    return cars;
  }
}

// Export singleton instance
export const carService = new CarService();
