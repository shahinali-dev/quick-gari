import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
import { carRoute } from "../modules/car/car.controller";
import { userRoute } from "../modules/user/user.controller";

const router = Router();

const moduleRoutes = [
  {
    path: "/api/v1/auth",
    route: authRoute,
  },

  {
    path: "/api/v1/user",
    route: userRoute,
  },
  {
    path: "/api/v1/car",
    route: carRoute,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
