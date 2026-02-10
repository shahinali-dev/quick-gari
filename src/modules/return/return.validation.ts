import { z } from "zod";

const returnRideValidationSchema = z.object({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  fare: z.number().min(1, "Fare is required"),
});

export const returnValidation = {
  returnRideValidationSchema,
};

export type IReturnRide = z.infer<typeof returnRideValidationSchema>;
