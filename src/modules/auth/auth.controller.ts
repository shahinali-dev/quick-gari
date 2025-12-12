import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import { authService } from "./auth.service";

const router = Router();

router.post(
  "/signin",
  catchAsync(async (req, res) => {
    const userData = req.body;
    console.log("sign in payload:", userData);
    const user = await authService.signIn(userData);

    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: user.user,
      token: {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
      },
    });
  })
);

router.get(
  "/user-info",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const user = await authService.getAuthUser(userId);
    res.status(httpStatus.OK).json({
      success: true,
      statusCode: httpStatus.OK,
      message: "User info fetched successfully",
      data: user,
    });
  })
);

export const authRoute = router;
