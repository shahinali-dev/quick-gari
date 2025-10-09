import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { IUser } from "./user.interface";
import UserModel from "./user.model";

const isExist = async (email: string) => {
  const existingUser = await UserModel.findOne({ email });
  return existingUser;
};

const registerUser = async (user: IUser) => {
  const user = await isExist(user.email);
  if (user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exist");
  }
  const newUser = await UserModel.create(user);
  const result = await UserModel.findById(newUser._id).select("-password");
  return result;
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
