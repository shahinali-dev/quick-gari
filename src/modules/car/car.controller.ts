/* eslint-disable no-undef */
import { Router } from "express";
import httpStatus from "http-status";

import { AppError } from "../../errors/app_error";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import { upload } from "../../middleware/multer.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { ICarFiles } from "./car.interface";
import { carService } from "./car.service";
import { carValidation } from "./car.validation";

const router = Router();

// -------------------------
// Register CAR
// -------------------------
router.post(
  "/",
  isAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "taxTokenPhoto", maxCount: 1 },
    { name: "registrationCardPhoto", maxCount: 1 },
    { name: "drivingLicensePhoto", maxCount: 1 },
  ]),
  catchAsync(async (req, res) => {
    const carData = JSON.parse(req.body.data);
    carValidation.createCarValidationSchema.parse(carData);

    const files = req.files as ICarFiles;
    const userId = req.user!._id.toString();

    // Validation
    if (!files.images || files.images.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "At least one car image required",
      );
    }
    if (!files.taxTokenPhoto?.[0]) {
      throw new AppError(httpStatus.BAD_REQUEST, "Tax token photo required");
    }
    if (!files.registrationCardPhoto?.[0]) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Registration card photo required",
      );
    }
    if (!files.drivingLicensePhoto?.[0]) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Driving license photo required",
      );
    }

    const car = await carService.registerCar(carData, files, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Car registered successfully",
      data: car,
    });
  }),
);

// approve a car
router.patch(
  "/:id/approve",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const car = await carService.approveCar(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car approved successfully",
      data: car,
    });
  }),
);

// -------------------------
// GET ALL CARS
// -------------------------
router.get(
  "/",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const cars = await carService.getAllCars();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All cars fetched successfully",
      data: cars,
    });
  }),
);

//Get approved cars
router.get(
  "/approved",
  catchAsync(async (req, res) => {
    const cars = await carService.getApprovedCars();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Approved cars fetched successfully",
      data: cars,
    });
  }),
);

// -------------------------
// GET CAR BY ID
// -------------------------
router.get(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const car = await carService.getCarById(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car fetched successfully",
      data: car,
    });
  }),
);

// get car by id (admin)
router.get(
  "/admin/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const car = await carService.getCarByIdAdmin(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car fetched successfully",
      data: car,
    });
  }),
);

router.patch(
  "/:id",
  isAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "taxTokenPhoto", maxCount: 1 },
    { name: "registrationCardPhoto", maxCount: 1 },
    { name: "drivingLicensePhoto", maxCount: 1 },
  ]),
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    const payload = JSON.parse(req.body.data);
    carValidation.updateCarValidationSchema.parse(payload);

    const files = req.files as ICarFiles;

    const updatedCar = await carService.updateCar(id, userId, payload, files);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car updated successfully",
      data: updatedCar,
    });
  }),
);

router.delete(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const userId = req.user!._id.toString();
    const { id } = req.params;

    await carService.deleteCar(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car deleted successfully",
      data: null,
    });
  }),
);

export const carRoute = router;
