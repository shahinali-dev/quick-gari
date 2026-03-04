# 🎨 Visual Implementation Guide

## Payment System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      RIDE PAYMENT SYSTEM FLOW                   │
└─────────────────────────────────────────────────────────────────┘

STEP 1: USER ACCEPTS PROPOSAL
────────────────────────────────────────────────────────────────
  POST /rides/accept-proposal
  ├─ Input: { rideId, proposalId }
  ├─ Validation: User owns ride
  ├─ Status: REQUESTED → ACCEPTED
  └─ Response: ✅ paymentDetails {
                  "amount": 500,
                  "adminBkashNumber": "+880XXXXXXXXXX"
                }

STEP 2: USER SENDS BKASH PAYMENT (Outside App)
────────────────────────────────────────────────────────────────
  [User opens Bkash/Mobile Banking]
    ├─ Enter number: +880XXXXXXXXXX
    ├─ Enter amount: 500 BDT
    ├─ Confirm payment
    └─ Receives: Transaction ID (TXN123...)

STEP 3: USER SUBMITS TRANSACTION ID
────────────────────────────────────────────────────────────────
  POST /rides/payment/submit
  ├─ Input: { rideId, transactionId: "TXN123..." }
  ├─ Validations:
  │  ├─ Ride exists
  │  ├─ User owns ride
  │  ├─ Ride status = ACCEPTED
  │  └─ Payment not already submitted
  ├─ Action: Create payment with PENDING status
  └─ Response: ✅ ride with payment {
                  "status": "PENDING",
                  "transactionId": "TXN123...",
                  "submittedAt": "2024-03-04T12:30:00Z"
                }

  💡 User receives notification:
     "Payment submitted. Admin will verify shortly."

STEP 4: ADMIN REVIEWS PENDING PAYMENTS
────────────────────────────────────────────────────────────────
  GET /rides/payments/pending
  ├─ Auth: Admin only
  ├─ Returns: Array of rides with PENDING payments
  └─ Admin sees:
     ├─ User name & phone
     ├─ Driver name & phone
     ├─ Route & amount
     ├─ Transaction ID
     └─ Submission time

  👤 Admin action: Check bank records for transaction

STEP 5a: ADMIN APPROVES PAYMENT ✅
────────────────────────────────────────────────────────────────
  POST /rides/payment/approve/:rideId
  ├─ Input: { approved: true }
  ├─ Validations:
  │  ├─ Admin authenticated
  │  ├─ Ride exists
  │  └─ Payment exists
  ├─ Updates:
  │  ├─ Payment Status: PENDING → APPROVED
  │  ├─ Payment.approvedAt: Now
  │  ├─ Payment.approvedBy: AdminId
  │  ├─ Ride Status: ACCEPTED → COMPLETED
  │  └─ Save to database
  └─ Notifications:
     ├─ User: "✅ Payment approved! Your ride is confirmed."
     └─ Driver: "✅ Ride confirmed! You are the driver."

STEP 5b: ADMIN REJECTS PAYMENT ❌
────────────────────────────────────────────────────────────────
  POST /rides/payment/approve/:rideId
  ├─ Input: { approved: false, rejectionReason: "..." }
  ├─ Validations: Same as approve
  ├─ Updates:
  │  ├─ Payment Status: PENDING → REJECTED
  │  ├─ Payment.rejectionReason: "..."
  │  ├─ Ride Status: ACCEPTED → REQUESTED
  │  └─ Save to database
  └─ Notification:
     └─ User: "❌ Payment rejected: [reason]. Please retry."

STEP 6: USER CAN RETRY (If Rejected) 🔄
────────────────────────────────────────────────────────────────
  └─ Go back to STEP 3, submit new transaction ID
     ├─ Same process
     ├─ New payment created
     └─ Admin reviews again
```

---

## Database Schema Visualization

```
┌─ RIDE DOCUMENT ─────────────────────────────────────┐
│                                                      │
│  _id: ObjectId                                       │
│  user: ObjectId (User who requested)                │
│  driver: ObjectId (Driver who accepted)             │
│  car: ObjectId (Assigned car)                       │
│  startLocation: String                              │
│  endLocation: String                                │
│  fare: Number (500)                                 │
│  status: String (ACCEPTED, COMPLETED, REQUESTED)   │
│  proposals: Array (driver proposals)                │
│                                                      │
│  ┌─ PAYMENT OBJECT (⭐ NEW) ───────────────────┐   │
│  │                                              │   │
│  │  transactionId: String (TXN123...)          │   │
│  │  amount: Number (500)                       │   │
│  │  paymentMethod: String (bkash)              │   │
│  │  status: String (PENDING|APPROVED|REJECTED) │   │
│  │  submittedAt: Date                          │   │
│  │  approvedAt: Date (if approved)             │   │
│  │  approvedBy: ObjectId (Admin ID)            │   │
│  │  rejectionReason: String (if rejected)      │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  createdAt: Date                                     │
│  updatedAt: Date                                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## API Endpoint Map

```
USER ENDPOINTS
└─ GET /rides                          [List my rides]
└─ POST /rides                         [Create new ride]
└─ POST /rides/proposal                [Submit proposal as driver]
└─ POST /rides/accept-proposal         [Accept proposal] ✨ ENHANCED
   └─ Response includes: paymentDetails ⭐
└─ GET /rides/:id                      [View ride details]
└─ GET /rides/:id/proposals            [View proposals]
└─ POST /rides/payment/submit          [Submit transaction ID] ⭐ NEW
   ├─ Input: { rideId, transactionId }
   ├─ Status change: (none) → PENDING
   └─ Response: Ride with payment
└─ [Future] GET /rides/:id/payment     [View my payment status]

ADMIN ENDPOINTS
└─ GET /rides/payments/pending         [View all pending] ⭐ NEW
   └─ Response: Array of rides with PENDING payments
└─ POST /rides/payment/approve/:id     [Approve/reject payment] ⭐ NEW
   ├─ Input: { approved, rejectionReason? }
   ├─ If approved: Status → APPROVED, Ride → COMPLETED
   ├─ If rejected: Status → REJECTED, Ride → REQUESTED
   └─ Response: Updated ride
└─ [Future] GET /admin/payment-history [Payment history/analytics]
```

---

## Status Transitions

### Ride Status Flow

```
    ┌─────────────┐
    │  REQUESTED  │ ← Initial state after user creates ride
    └──────┬──────┘
           │
    [Driver submits proposal]
           │
           ↓
    ┌─────────────┐
    │  ACCEPTED   │ ← User accepted proposal, awaiting payment
    └──────┬──────┘
           │
    ┌──────┴──────────────────────┐
    │                             │
[Payment Approved]        [Payment Rejected]
    │                             │
    ↓                             ↓
┌─────────────┐          ┌─────────────┐
│ COMPLETED   │          │ REQUESTED   │ ← User can retry
└─────────────┘          └──────┬──────┘
                                │
                    [Submit payment again]
                                │
                                ↓
                          [Back to PENDING...]

[User/Admin cancels]
    │
    ↓
┌─────────────┐
│ CANCELLED   │
└─────────────┘
```

### Payment Status Flow

```
  [No Payment Initially]
           │
    [User submits transaction ID]
           │
           ↓
    ┌─────────────┐
    │  PENDING    │ ← Awaiting admin review
    └──────┬──────┘
           │
    ┌──────┴──────────────────────┐
    │                             │
[Admin checks & approves]  [Admin checks & rejects]
    │                             │
    ↓                             ↓
┌─────────────┐          ┌─────────────┐
│  APPROVED   │          │  REJECTED   │
└─────────────┘          └──────┬──────┘
                                │
                    [User submits new transaction]
                                │
                                ↓
                          [Back to PENDING...]
```

---

## Authorization & Access Control

```
┌─────────────────────────────────────────────┐
│            API AUTHORIZATION               │
├─────────────────────────────────────────────┤
│                                             │
│  USER ENDPOINTS                            │
│  ├─ POST /rides/payment/submit              │
│  │  └─ Check: User is authenticated        │
│  │  └─ Check: User owns the ride           │
│  │  └─ Check: Ride is ACCEPTED             │
│  │                                         │
│  ADMIN ENDPOINTS                           │
│  ├─ GET /rides/payments/pending             │
│  │  └─ Check: User is Admin                │
│  │                                         │
│  ├─ POST /rides/payment/approve/:id         │
│  │  └─ Check: User is Admin                │
│  │  └─ Check: Payment exists               │
│  │                                         │
└─────────────────────────────────────────────┘
```

---

## Integration Points

```
┌──────────────────────────────────────┐
│        FRONTEND INTEGRATION          │
├──────────────────────────────────────┤
│                                      │
│  1. ACCEPT PROPOSAL RESPONSE         │
│     ├─ Show paymentDetails component │
│     ├─ Display: adminBkashNumber     │
│     ├─ Display: amount to send       │
│     └─ Input: transaction ID field   │
│                                      │
│  2. SUBMIT PAYMENT ENDPOINT          │
│     ├─ API call: POST /payment/...   │
│     ├─ Body: { rideId, transactionId}
│     ├─ Show: Success/error message   │
│     └─ State: Set to "PENDING"       │
│                                      │
│  3. SOCKET.IO LISTENER               │
│     ├─ Event: notification:new       │
│     ├─ Type: PAYMENT_APPROVED        │
│     ├─ Type: PAYMENT_REJECTED        │
│     └─ Update: UI accordingly        │
│                                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     ADMIN DASHBOARD INTEGRATION      │
├──────────────────────────────────────┤
│                                      │
│  1. PENDING PAYMENTS LIST            │
│     └─ GET /rides/payments/pending   │
│        ├─ Display user info          │
│        ├─ Display driver info        │
│        ├─ Display amount             │
│        ├─ Display transaction ID     │
│        └─ Show: Submitted time       │
│                                      │
│  2. PAYMENT DETAILS                  │
│     ├─ User name & phone             │
│     ├─ Driver name & phone           │
│     ├─ Route information             │
│     ├─ Payment amount                │
│     └─ Transaction details           │
│                                      │
│  3. APPROVE/REJECT BUTTONS           │
│     ├─ Approve Button                │
│     │  └─ POST /approve with true    │
│     │                                │
│     └─ Reject Button                 │
│        ├─ Prompt for reason          │
│        └─ POST /approve with false   │
│                                      │
└──────────────────────────────────────┘
```

---

## Error Handling Flow

```
USER SUBMITS PAYMENT
│
├─ Ride exists?
│  └─ No → 404: Ride not found
│
├─ User owns ride?
│  └─ No → 403: You are not authorized
│
├─ Ride status = ACCEPTED?
│  └─ No → 400: Ride must be accepted first
│
├─ Payment not already submitted?
│  └─ No → 400: Payment already submitted
│
└─ ✅ Success → Save payment with PENDING status

────────────────────────────────────────────

ADMIN APPROVES PAYMENT
│
├─ Admin authenticated?
│  └─ No → 403: You are not authorized
│
├─ Ride exists?
│  └─ No → 404: Ride not found
│
├─ Payment exists?
│  └─ No → 400: No payment found
│
└─ ✅ Success → Approve/Reject and notify users
```

---

## File Changes Overview

```
┌─────────────────────────────────────────┐
│        RIDE MODULE STRUCTURE             │
├─────────────────────────────────────────┤
│                                         │
│  ride/                                  │
│  ├─ ride.enum.ts              ✅ 📝    │
│  │  └─ Added: PaymentStatus             │
│  │                                     │
│  ├─ ride.interface.ts         ✅ 📝    │
│  │  └─ Added: IPayment                  │
│  │                                     │
│  ├─ ride.model.ts             ✅ 📝    │
│  │  └─ Added: payment schema            │
│  │                                     │
│  ├─ ride.validation.ts        ✅ 📝    │
│  │  ├─ Added: submitPaymentSchema      │
│  │  └─ Added: approvePaymentSchema     │
│  │                                     │
│  ├─ ride.service.ts           ✅ 📝    │
│  │  ├─ Added: submitPayment()          │
│  │  ├─ Added: approvePayment()         │
│  │  └─ Added: getPendingPayments()     │
│  │                                     │
│  └─ ride.controller.ts        ✅ 📝    │
│     ├─ Added: POST /payment/submit     │
│     ├─ Added: POST /payment/approve    │
│     └─ Added: GET /payments/pending    │
│                                         │
│  config/                                │
│  └─ index.ts                 ✅ 📝     │
│     └─ Added: ADMIN_BKASH_NUMBER       │
│                                         │
└─────────────────────────────────────────┘
```

---

**This visual guide helps understand the complete payment system at a glance!**
