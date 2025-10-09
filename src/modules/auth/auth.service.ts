import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import comparePassword from "../../utils/compare_password.utils";
import { ISignIn } from "../user/user.interface";
import UserModel from "../user/user.model";

const signIn = async (payload: ISignIn) => {
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (!existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
  }

  const isMatch = comparePassword(
    payload.password as string,
    existingUser.password as string
  );
  if (!isMatch) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid email or password");
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { password, ...jwtPayload } = existingUser.toJSON();

  const accessToken = jwt.sign(jwtPayload, config.JWT_ACCESS_SECRET as string, {
    expiresIn: config.JWT_ACCESS_EXPIRE_IN,
  });

  const refreshToken = jwt.sign(
    jwtPayload,
    config.JWT_REFRESH_SECRET as string,
    {
      expiresIn: config.JWT_REFRESH_EXPIRE_IN,
    }
  );

  return { user: jwtPayload, accessToken, refreshToken };
};

const getAuthUser = async (id: string) => {
  const user = await UserModel.findById(id).select("-password");
  return user;
};

export const authService = {
  signIn,
  getAuthUser,
};
