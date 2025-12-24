import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Define environment schema
const envSchema = z.object({
  DB_URL: z.string().min(1, "DB_URL is required"),
  PORT: z.string().default("5000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  SALT_ROUNDS: z
    .string()
    .min(1, "SALT_ROUNDS is required")
    .refine((val) => !isNaN(Number(val)), "SALT_ROUNDS must be a valid number"),

  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_EXPIRE_IN: z.string().min(1, "JWT_ACCESS_EXPIRE_IN is required"),

  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_REFRESH_EXPIRE_IN: z.string().min(1, "JWT_REFRESH_EXPIRE_IN is required"),

  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required").optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

// Parse & return validated env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.table(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

// Export in required format
export default {
  DB: env.DB_URL,
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,

  SALT_ROUNDS: env.SALT_ROUNDS,

  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRE_IN: env.JWT_ACCESS_EXPIRE_IN,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE_IN: env.JWT_REFRESH_EXPIRE_IN,

  CORS_ORIGIN: env.CORS_ORIGIN,

  CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
};
