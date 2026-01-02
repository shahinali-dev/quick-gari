import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

// Helper to get real IP address
const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (forwarded as string).split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
};

//  IP-based rate limiting with proper key function
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP as key for rate limiting
  keyGenerator: (req: Request) => {
    return getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: "error",
      message: "Too many OTP verification attempts. Please try again later",
      errorMessage: [
        {
          path: "",
          message:
            "Too many OTP verification attempts from your IP. Please try again later",
        },
      ],
    });
  },
  // Skip failed requests (only count successful requests)
  skipFailedRequests: false,
  // Skip successful requests (count all attempts)
  skipSuccessfulRequests: false,
});

// Stricter rate limiter for resend
export const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: "error",
      message: "Too many OTP resend requests. Please try again later",
      errorMessage: [
        {
          path: "",
          message:
            "Too many OTP resend requests from your IP. Please try again later",
        },
      ],
    });
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

// Registration rate limiter (prevent mass registration)
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return getClientIp(req);
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: "error",
      message: "Too many registration attempts. Please try again later",
      errorMessage: [
        {
          path: "",
          message:
            "Too many registration attempts from your IP. Please try again in 1 hour",
        },
      ],
    });
  },
  skipFailedRequests: true,
  skipSuccessfulRequests: false,
});
