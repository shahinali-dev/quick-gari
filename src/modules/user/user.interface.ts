/* eslint-disable no-unused-vars */

import { Types } from "mongoose";
import { Role } from "./user.enum";

export interface IUser {
  name: string;
  email: string;
  role: Role;
  password: string;
  avatar?: string;
  phoneNumber?: string;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface IAuthUser {
  _id: string | Types.ObjectId;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phoneNumber?: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  iat: number;
  exp: number;
}
