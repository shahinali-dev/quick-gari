import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import config from "../../config";
import { Role } from "./user.enum";
import { IUser } from "./user.interface";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    password: {
      type: String,
      required: true,
    },

    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving if it's a local user
userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(
      this.password,
      Number(config.SALT_ROUNDS)
    );
    this.password = hashedPassword;
  }
  next();
});

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
