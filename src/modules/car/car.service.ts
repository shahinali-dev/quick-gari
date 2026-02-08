/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { userService } from "../user/user.service";
import { ICar, ICreateCarPayload, IFeature } from "./car.interface";
import CarModel from "./car.model";

export class CarService {
  // 🔍 Check if car already exists (optional usage)
  async isExist(carName: string) {
    const existingCar = await CarModel.findOne({ carName });
    return existingCar;
  }

  // ✅ CREATE CAR
  async registerCar(
    data: ICreateCarPayload,
    files: Express.Multer.File[],
    userId: string,
  ) {
    await userService.makeCarOwner(userId);

    // Cloudinary theke image URLs extract koro
    const imageUrls = files.map((file) => file.path);

    const carPayload: ICar = {
      ...data,
      features: {
        ...data.features,
        images: imageUrls,
      },
      user: userId,
    };

    const newCar = await CarModel.create(carPayload);
    return newCar;
  }

  // approve a car
  async approveCar(carId: string) {
    const car = await CarModel.findById(carId);
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }
    car.isApproved = true;
    await car.save();
    return car;
  }

  // 📌 GET ALL CARS
  async getAllCars() {
    const cars = await CarModel.find();
    return cars;
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

  // ✏ UPDATE CAR
  async updateCar(
    id: string,
    userId: string,
    payload: Partial<ICar>,
    files: Express.Multer.File[],
  ) {
    const car = await CarModel.findById(id);

    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }

    const isOwner = car?.user.toString() === userId;
    const user = await userService.getUserById(userId);

    if (!isOwner || user?.role !== "admin") {
      throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to update");
    }

    const updatedPayload: Partial<ICar> = { ...payload };

    if (files && files.length > 0) {
      const imageUrls = files.map((file) => file.path);
      updatedPayload.features = {
        ...car.features,
        ...payload.features,
        images: imageUrls,
      } as IFeature;
    } else if (payload.features) {
      const { images, ...restFeatures } = payload.features as any;
      updatedPayload.features = {
        ...car.features,
        ...restFeatures,
      } as IFeature;
    }

    const updated = await CarModel.findByIdAndUpdate(id, updatedPayload, {
      new: true,
      runValidators: true,
    });

    return updated;
  }

  // ❌ DELETE CAR
  async deleteCar(id: string, userId: string) {
    const car = await CarModel.findById(id);

    const isOwner = car?.user.toString() === userId;
    const user = await userService.getUserById(userId);

    if (!isOwner || user?.role !== "admin") {
      throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to delete");
    }

    const deleted = await CarModel.findByIdAndDelete(id);

    return deleted;
  }

  // get car by user id
  async getCarsByUserId(userId: string) {
    const cars = await CarModel.findOne({ user: userId });
    return cars;
  }
}

// Export singleton instance
export const carService = new CarService();
