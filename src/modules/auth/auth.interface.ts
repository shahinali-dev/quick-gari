import { Types } from "mongoose";

interface IJWTPayload {
  _id: string | Types.ObjectId;
  email: string;
  role: string;
}

export { IJWTPayload };
