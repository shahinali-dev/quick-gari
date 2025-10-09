import type { NextFunction, Request, Response } from "express";
import httpstatus from "http-status";
import { AppError } from "../errors/app_error";
import { Role } from "../modules/user/user.enum";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (user && user.role === Role.ADMIN) {
    return next();
  }
  throw new AppError(
    httpstatus.FORBIDDEN,
    "You are not authorized to access this route"
  );
};
