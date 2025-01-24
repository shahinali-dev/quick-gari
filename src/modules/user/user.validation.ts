import { z } from "zod";
import { Role } from "./user.interface";

// Base validation schema for common fields
const baseUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum([Role.ADMIN, Role.USER]).optional(),
  avatar: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userValidation = {
  baseUserValidationSchema,
};
