import { z } from "zod";

const rideValidationSchema = z.object({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
});

const proposalValidationSchema = z.object({
  rideId: z.string().min(1, "Ride ID is required"),
  fare: z.number().positive("Fare must be a positive number"),
});

const acceptProposalValidationSchema = z.object({
  rideId: z.string({ required_error: "Ride ID is required" }),
  proposalId: z.string().min(1, "Proposal ID is required"),
});

const submitPaymentValidationSchema = z.object({
  rideId: z.string().min(1, "Ride ID is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

const approvePaymentValidationSchema = z.object({
  rideId: z.string().min(1, "Ride ID is required"),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const rideValidation = {
  rideValidationSchema,
  proposalValidationSchema,
  acceptProposalValidationSchema,
  submitPaymentValidationSchema,
  approvePaymentValidationSchema,
};

export type ICreateRidePayload = z.infer<typeof rideValidationSchema>;
export type IAcceptRidePayload = z.infer<typeof proposalValidationSchema>;
export type ISubmitPaymentPayload = z.infer<
  typeof submitPaymentValidationSchema
>;
export type IApprovePaymentPayload = z.infer<
  typeof approvePaymentValidationSchema
>;
