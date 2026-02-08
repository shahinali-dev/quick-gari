import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { returnService } from "./return.service";
import { returnValidation } from "./return.validation";

const router = Router();

// Create a return ride (Driver creates)
router.post(
  "/",
  isAuth,
  validateRequest(returnValidation.returnRideValidationSchema),
  catchAsync(async (req, res) => {
    const payload = req.body;
    const userId = req.user!._id.toString();

    const returnRide = await returnService.createAReturnRide(payload, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Return ride created successfully",
      data: returnRide,
    });
  }),
);

// Get all available return rides (For passengers to browse)
router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const returnRides = await returnService.getAllReturnRides();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return rides fetched successfully",
      data: returnRides,
    });
  }),
);

// Get a specific return ride by ID
router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const returnRide = await returnService.getReturnRideById(id);

    if (!returnRide) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Return ride not found",
        data: null,
      });
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return ride fetched successfully",
      data: returnRide,
    });
  }),
);

// Book a return ride (Passenger books)
router.post(
  "/:id/book",
  isAuth,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const returnRide = await returnService.bookReturnRide(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Return ride booked successfully",
      data: returnRide,
    });
  }),
);

const returnRouter = router;
export default returnRouter;
