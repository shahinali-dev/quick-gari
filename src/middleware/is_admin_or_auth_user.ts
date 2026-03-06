import type { NextFunction, Request, Response } from "express";
import httpstatus from "http-status";
import { AppError } from "../errors/app_error";
import { Role } from "../modules/user/user.enum";

export const isAdminOrAuthUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  const userId = req.params.id;

  if (user && (user.role === Role.ADMIN || user.id === userId)) {
    return next();
  }
  throw new AppError(
    httpstatus.FORBIDDEN,
    "You are not authorized to access this route",
  );
};
