# Ride Payment System Documentation

## Overview

This document describes the payment flow for ride bookings. After a user accepts a driver proposal, they need to complete a payment verification process before the ride is confirmed.

## Payment Flow

### 1. **User Requests a Ride**

- Endpoint: `POST /rides`
- Ride status: `REQUESTED`
- Open for proposals from drivers

### 2. **Driver Submits Proposal**

- Endpoint: `POST /rides/proposal`
- Required: `rideId`, `fare`
- Proposal added to ride proposals array

### 3. **User Accepts Proposal** ⭐ NEW

- Endpoint: `POST /rides/accept-proposal`
- Required: `rideId`, `proposalId`
- Ride status changes to: `ACCEPTED`
- **Response includes:**
  ```json
  {
    "ride": { ... },
    "paymentDetails": {
      "amount": 500,
      "paymentMethod": "bkash",
      "adminBkashNumber": "+880XXXXXXXXXX",
      "instructions": "Send payment to the admin bkash number and submit your transaction ID"
    }
  }
  ```
- **Frontend Action:** Show payment interface with admin bkash details
- User is instructed to send payment to admin's bkash number

### 4. **User Submits Payment Transaction ID** ⭐ NEW

- Endpoint: `POST /rides/payment/submit`
- Required: `rideId`, `transactionId`
- Payload:
  ```json
  {
    "rideId": "64a8f9c2b1234567890abcde",
    "transactionId": "TXN123456789"
  }
  ```
- **What happens:**
  - Payment record created with status: `PENDING`
  - Submitted timestamp recorded
  - Admin notified about pending payment
  - Ride status remains: `ACCEPTED` (waiting for payment approval)

### 5. **Admin Reviews & Approves/Rejects Payment** ⭐ NEW

- Endpoint: `POST /rides/payment/approve/:rideId`
- Required: `approved` (boolean), `rejectionReason` (optional)
- Admin middleware required (`isAdmin`)
- Payload:
  ```json
  {
    "approved": true,
    "rejectionReason": null
  }
  ```
- **If Approved:**
  - Payment status: `APPROVED`
  - Ride status: `COMPLETED`
  - User notified: "Payment approved! Your ride is confirmed."
  - Driver notified: "Ride payment approved! You are confirmed as driver."
- **If Rejected:**
  - Payment status: `REJECTED`
  - Ride status: Reset to `REQUESTED` (allows retry)
  - User notified: "Payment rejected: [reason]"

### 6. **Admin Views All Pending Payments** ⭐ NEW

- Endpoint: `GET /rides/payments/pending`
- Admin middleware required
- Returns all rides with `PENDING` payment status

## Database Schema

### Payment Object Structure

```typescript
interface IPayment {
  transactionId: string; // User submitted transaction ID
  amount: number; // Ride fare
  paymentMethod: string; // "bkash"
  status: PaymentStatus; // PENDING, APPROVED, REJECTED, PROCESSING
  submittedAt?: Date; // When user submitted transaction ID
  approvedAt?: Date; // When admin approved
  approvedBy?: ObjectId; // Admin user ID
  rejectionReason?: string; // Reason for rejection
}
```

### RideStatus Enum

```typescript
enum RideStatus {
  REQUESTED = "REQUESTED", // User created ride, waiting for proposals
  ACCEPTED = "ACCEPTED", // Proposal accepted, waiting for payment
  REJECTED = "REJECTED", // Proposal rejected
  COMPLETED = "COMPLETED", // Payment approved, ride completed
  CANCELLED = "CANCELLED", // Ride cancelled
}
```

### PaymentStatus Enum

```typescript
enum PaymentStatus {
  PENDING = "PENDING", // User submitted transaction ID, waiting for admin approval
  APPROVED = "APPROVED", // Admin approved, ride confirmed
  REJECTED = "REJECTED", // Admin rejected, needs retry
  PROCESSING = "PROCESSING", // For future use
}
```

## Environment Variables Required

Add to `.env`:

```
ADMIN_BKASH_NUMBER=+880XXXXXXXXXX
```

## Frontend Integration

### Step 1: Show Payment Interface After Accept Proposal

```typescript
// After accepting proposal, frontend shows:
const { paymentDetails } = response.data;

// Display to user:
// "Please send payment to: {adminBkashNumber}"
// "Amount: {amount} BDT"
// "Once paid, enter your transaction ID below"
```

### Step 2: User Submits Transaction ID

```typescript
// Call submit payment endpoint
const submitPayment = async (rideId, transactionId) => {
  const response = await axios.post("/rides/payment/submit", {
    rideId,
    transactionId,
  });
  // Show success message
};
```

### Step 3: Wait for Admin Approval (Optional - Real-time with Socket.io)

```typescript
// Socket event when payment approved:
socket.on("PAYMENT_APPROVED", (ride) => {
  // Show ride confirmed message
  // Start ride timer/tracking
});
```

## Key Points

1. **Payment is separate from ride acceptance:** Ride is accepted but not confirmed until payment is approved
2. **Admin manual verification:** Admin checks transaction on their bank and approves/rejects
3. **Flexible retry:** If payment rejected, user can resubmit without re-accepting proposal
4. **Real-time notifications:** Both user and driver notified via push notifications
5. **Admin dashboard:** Admin can view all pending payments and manage approvals

## Error Handling

| Scenario                  | Error Code | Message                                         |
| ------------------------- | ---------- | ----------------------------------------------- |
| Ride not found            | 404        | Ride not found                                  |
| User not authorized       | 403        | You are not authorized                          |
| Ride not accepted         | 400        | Ride must be accepted before submitting payment |
| Payment already submitted | 400        | Payment already submitted for this ride         |
| No payment found          | 400        | No payment found for this ride                  |
| Invalid transaction ID    | 400        | Transaction ID is required                      |

## Future Enhancements

1. **Automatic payment verification** with bkash API integration
2. **Payment timeout** - automatically reject if not approved within X hours
3. **Payment receipt** - generate and send invoice
4. **Refund management** - handle refunds if ride is cancelled after payment
5. **Multiple payment methods** - credit card, Nagad, Rocket support
