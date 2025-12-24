/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import multer, { File } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { AppError } from "../errors/app_error";
import cloudinary from "../lib/cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "car-images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }],
  } as any,
});

const fileFilter = (req: any, file: File, cb: any) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid file type. Only JPEG, PNG and WebP allowed"
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
