import { toZonedTime } from "date-fns-tz";
import { z } from "zod";

const TIMEZONE = "Asia/Dhaka";

const shareVehicleValidationSchema = z.object({
  journeyDate: z
    .string()
    .min(1, "Journey date is required")
    .refine((date) => {
      // দুটোকেই Dhaka timezone এ শুধু date string হিসেবে compare করো
      const nowInDhaka = toZonedTime(new Date(), TIMEZONE);
      const todayStr = `${nowInDhaka.getFullYear()}-${String(nowInDhaka.getMonth() + 1).padStart(2, "0")}-${String(nowInDhaka.getDate()).padStart(2, "0")}`;

      return date >= todayStr; // string compare → "2026-06-08" >= "2026-06-08" ✓
    }, "Journey date cannot be in the past"),
  stops: z
    .array(
      z.object({
        location: z.string().min(1, "Stop location is required"),
        arrivalTime: z.string().min(1, "Arrival time is required"),
        order: z.number().min(0, "Order must be a non-negative integer"),
      }),
    )
    .min(2, "At least 2 stops are required (origin and destination)"),
});

export const shareVehicleValidation = {
  shareVehicleValidationSchema,
};

export type ICreateShareVehicle = z.infer<typeof shareVehicleValidationSchema>;
