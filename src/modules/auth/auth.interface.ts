import { Types } from "mongoose";

interface IJWTPayload {
  _id: Types.ObjectId;
  email: string;
  role: string;
}

export { IJWTPayload };
