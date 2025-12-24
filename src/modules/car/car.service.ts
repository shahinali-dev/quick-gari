import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { ICar } from "./car.interface";
import CarModel from "./car.model";

export class CarService {
  // 🔍 Check if car already exists (optional usage)
  async isExist(carName: string) {
    const existingCar = await CarModel.findOne({ carName });
    return existingCar;
  }

  // ✅ CREATE CAR
  async createCar(data: ICar, userId: string) {
    const newCar = await CarModel.create({ ...data, user: userId });
    return newCar;
  }

  // 📌 GET ALL CARS
  async getAllCars() {
    const cars = await CarModel.find();
    return cars;
  }

  // 🔍 GET SINGLE CAR BY ID
  async getCarById(id: string) {
    const car = await CarModel.findById(id);
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }
    return car;
  }

  // ✏ UPDATE CAR
  async updateCar(id: string, payload: Partial<ICar>) {
    const updated = await CarModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }

    return updated;
  }

  // ❌ DELETE CAR
  async deleteCar(id: string) {
    const deleted = await CarModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new AppError(httpStatus.NOT_FOUND, "Car not found");
    }

    return deleted;
  }
}

// Export singleton instance
export const carService = new CarService();
