import { z } from "zod";

const createShareVehicleBookingValidationSchema = z.object({
  shareVehicleId: z
    .string()
    .min(1, "Share vehicle ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid share vehicle ID"),
  pickupStop: z.string().min(1, "Pickup stop is required").trim(),
  dropStop: z.string().min(1, "Drop stop is required").trim(),
  seatsBooked: z
    .number()
    .int("Seats booked must be an integer")
    .min(1, "At least 1 seat must be booked")
    .max(10, "Cannot book more than 10 seats"),
});

const cancelShareVehicleBookingValidationSchema = z.object({
  bookingId: z
    .string()
    .min(1, "Booking ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID"),
});

export const shareVehicleBookingValidation = {
  createShareVehicleBookingValidationSchema,
  cancelShareVehicleBookingValidationSchema,
};

export type ICreateShareVehicleBooking = z.infer<
  typeof createShareVehicleBookingValidationSchema
>;

export type ICancelShareVehicleBooking = z.infer<
  typeof cancelShareVehicleBookingValidationSchema
>;
