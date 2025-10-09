import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
