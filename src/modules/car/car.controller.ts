import { Router } from "express";
import httpStatus from "http-status";
import { isAdmin } from "../../middleware/is_admin";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { carService } from "./car.service";
import { carValidation } from "./car.validation";

const router = Router();

// -------------------------
// CREATE CAR
// -------------------------
router.post(
  "/",
  isAuth,
  isAdmin,
  validateRequest(carValidation.createCarValidationSchema),
  catchAsync(async (req, res) => {
    const carData = req.body;
    const car = await carService.createCar(carData);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Car created successfully",
      data: car,
    });
  })
);

// -------------------------
// GET ALL CARS
// -------------------------
router.get(
  "/",
  catchAsync(async (req, res) => {
    const cars = await carService.getAllCars();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All cars fetched successfully",
      data: cars,
    });
  })
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
  })
);

// -------------------------
// UPDATE CAR
// -------------------------
router.patch(
  "/:id",
  isAuth,
  isAdmin,
  validateRequest(carValidation.updateCarValidationSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    const updatedCar = await carService.updateCar(id, payload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car updated successfully",
      data: updatedCar,
    });
  })
);

// -------------------------
// DELETE CAR
// -------------------------
router.delete(
  "/:id",
  isAuth,
  isAdmin,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const deletedCar = await carService.deleteCar(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Car deleted successfully",
      data: deletedCar,
    });
  })
);

export const carRoute = router;
