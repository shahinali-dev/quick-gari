import { z } from "zod";

// Base validation schema for common fields
const baseUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gender: z.enum(["male", "female", "other"]),
  phoneNumber: z.string().optional(),
});

export const userValidation = {
  baseUserValidationSchema,
};
