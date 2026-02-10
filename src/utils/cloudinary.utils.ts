/* eslint-disable no-undef */
/* eslint-disable no-console */
import { v2 as cloudinary } from "cloudinary";
import httpStatus from "http-status";
import { AppError } from "../errors/app_error";

export const extractPublicId = (url: string): string => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
    return publicIdWithExt.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Failed to extract public_id:", error);
    return "";
  }
};

export const deleteFromCloudinary = async (
  publicIdOrUrl: string,
): Promise<void> => {
  try {
    const publicId = publicIdOrUrl.startsWith("http")
      ? extractPublicId(publicIdOrUrl)
      : publicIdOrUrl;

    if (!publicId) {
      console.warn("Invalid public_id, skipping deletion");
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete ${publicIdOrUrl}:`, error);
  }
};

export const deleteMultipleFromCloudinary = async (
  publicIdsOrUrls: string[],
): Promise<void> => {
  try {
    await Promise.allSettled(
      publicIdsOrUrls.map((item) => deleteFromCloudinary(item)),
    );
  } catch (error) {
    console.error("Failed to delete multiple files:", error);
  }
};

export const cleanupUploadedFiles = async (
  files:
    | Express.Multer.File
    | Express.Multer.File[]
    | { [key: string]: Express.Multer.File[] },
): Promise<void> => {
  try {
    const urls: string[] = [];

    // Single file
    if (!Array.isArray(files) && "path" in files) {
      urls.push(files.path);
    }
    // Array of files
    else if (Array.isArray(files)) {
      urls.push(...files.map((file) => file.path));
    }
    // Object with multiple fields (from upload.fields())
    else if (typeof files === "object") {
      Object.values(files).forEach((fileArray) => {
        urls.push(...fileArray.map((file) => file.path));
      });
    }

    if (urls.length > 0) {
      await deleteMultipleFromCloudinary(urls);
      console.log(`Cleaned up ${urls.length} uploaded files`);
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
};

export const replaceCloudinaryFile = async (
  oldUrl: string,
  newFile: Express.Multer.File,
): Promise<string> => {
  try {
    // First delete old file
    await deleteFromCloudinary(oldUrl);
    // Return new file URL
    return newFile.path;
  } catch (error) {
    console.error("Failed to replace file:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update image",
    );
  }
};
