import dotenv from "dotenv";
dotenv.config();

export default {
  DB: process.env.DB_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SALT_ROUNDS: process.env.SALT_ROUNDS,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRE_IN: process.env.JWT_ACCESS_EXPIRE_IN,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE_IN: process.env.JWT_REFRESH_EXPIRE_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
