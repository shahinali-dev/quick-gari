import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
import { carRoute } from "../modules/car/car.controller";
import paymentRouter from "../modules/payment/payment.controller";
import returnRouter from "../modules/return/return.controller";
import rideRouter from "../modules/ride/ride.controller";
import shareVehicleBookingRouter from "../modules/share-vehicle-booking/share_vehicle_booking.controller";
import { shareVehicleFareConfigController } from "../modules/share-vehicle-fare-config/share_vehicle_fare.controller";
import shareVehicleRouter from "../modules/share-vehicle/share_vehicle.controller";
import { userRoute } from "../modules/user/user.controller";

const router = Router();

const moduleRoutes = [
  {
    path: "/v1/auth",
    route: authRoute,
  },

  {
    path: "/v1/user",
    route: userRoute,
  },
  {
    path: "/v1/car",
    route: carRoute,
  },
  {
    path: "/v1/ride",
    route: rideRouter,
  },
  {
    path: "/v1/return-trip",
    route: returnRouter,
  },
  {
    path: "/v1/share-vehicle",
    route: shareVehicleRouter,
  },
  {
    path: "/v1/share-vehicle-fare",
    route: shareVehicleFareConfigController,
  },
  {
    path: "/v1/share-vehicle-booking",
    route: shareVehicleBookingRouter,
  },
  {
    path: "/v1/payment",
    route: paymentRouter,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
