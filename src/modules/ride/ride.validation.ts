import { z } from "zod";

const rideValidationSchema = z.object({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
});

const proposalValidationSchema = z.object({
  rideId: z.string().min(1, "Ride ID is required"),
  fare: z.string().min(1, "Fare is required"),
});

const acceptProposalValidationSchema = z.object({
  rideId: z.string({ required_error: "Ride ID is required" }),
  proposalId: z.string().min(1, "Proposal ID is required"),
});

export const rideValidation = {
  rideValidationSchema,
  proposalValidationSchema,
  acceptProposalValidationSchema,
};

export type ICreateRidePayload = z.infer<typeof rideValidationSchema>;
export type IAcceptRidePayload = z.infer<typeof proposalValidationSchema>;
