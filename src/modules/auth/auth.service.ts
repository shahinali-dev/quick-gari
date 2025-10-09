import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import comparePassword from "../../utils/compare_password.utils";
import { ISignIn, IUser } from "../user/user.interface";
import UserModel from "../user/user.model";

const signUp = async (user: IUser) => {
  const isExist = await existingUser(user.email);
  if (isExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exist");
  }
  const newUser = await UserModel.create(user);
  const result = await UserModel.findById(newUser._id).select("-password");
  return result;
};

const existingUser = async (email: string) => {
  const existingUser = await UserModel.findOne({ email });
  return existingUser;
};

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

export const authService = {
  signUp,
  signIn,
  existingUser,
};
