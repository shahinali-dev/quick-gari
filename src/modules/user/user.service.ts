import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import passwordUtils from "../../utils/password_utils";
import { IUser } from "./user.interface";
import UserModel from "./user.model";

const isExist = async (email: string) => {
  const existingUser = await UserModel.findOne({ email });
  return existingUser;
};

const registerUser = async (user: IUser) => {
  const existingUser = await isExist(user.email);
  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exist");
  }

  const { password, ...rest } = user;
  if (!password) {
    throw new AppError(httpStatus.BAD_REQUEST, "Password is required");
  }

  const hashedPassword = await passwordUtils.hash(password);
  const newUser = await UserModel.create({
    ...rest,
    password: hashedPassword,
  });

  return await UserModel.findById(newUser._id).select("-password");
};

const getAllUsers = async () => {
  const users = await UserModel.find().select("-password");
  return users;
};

export const userService = {
  isExist,
  registerUser,
  getAllUsers,
};
