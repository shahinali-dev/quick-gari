import UserModel from "./user.model";

const getAllUsers = async () => {
  const users = await UserModel.find().select("-password");
  return users;
};

const getAuthUser = async (id: string) => {
  const user = await UserModel.findById(id).select("-password");
  return user;
};

export const userService = {
  getAllUsers,
  getAuthUser,
};
