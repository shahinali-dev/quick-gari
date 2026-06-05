import { z } from "zod";

const submitPaymentValidationSchema = z.object({
  rideId: z.string().optional(),
  proposalId: z.string().optional(),
  returnId: z.string().optional(),
  shareVehicleBookingPayload: z
    .object({
      shareVehicleId: z.string(),
      pickupStop: z.string(),
      dropStop: z.string(),
      seatsBooked: z.number(),
    })
    .optional(),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

const approvePaymentValidationSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const paymentValidation = {
  submitPaymentValidationSchema,
  approvePaymentValidationSchema,
};

export type ISubmitPaymentPayload = z.infer<
  typeof submitPaymentValidationSchema
>;
export type IApprovePaymentPayload = z.infer<
  typeof approvePaymentValidationSchema
>;
