# 🎯 Unified Payment System - Complete Implementation

## Overview

একটি **single dedicated Payment module** যা তিনটি different services handle করে:

- 🚗 **Ride** - Ride booking payment
- 🔄 **Return** - Return trip payment
- 🚌 **Share Vehicle** - Share vehicle booking payment

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│           UNIFIED PAYMENT MODULE                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  POST /payment/submit                                    │
│  ├─ Body: {                                              │
│  │   rideId OR returnId OR shareVehicleBookingId        │
│  │   transactionId                                       │
│  │ }                                                     │
│  │                                                       │
│  POST /payment/approve/:paymentId (Admin)               │
│  ├─ Approve/Reject any payment type                     │
│  │                                                       │
│  GET /payment/pending/all (Admin)                       │
│  ├─ View all pending payments (all types)              │
│  │                                                       │
│  GET /payment/pending/:paymentFor (Admin)               │
│  ├─ View pending by type (RIDE, RETURN, SHARE_VEHICLE) │
│  │                                                       │
└──────────────────────────────────────────────────────────┘
           ↑                  ↑                    ↑
           |                  |                    |
    ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
    │ RIDE MODULE  │  │RETURN MODULE │  │SHARE_VEHICLE    │
    ├──────────────┤  ├──────────────┤  ├─────────────────┤
    │ fare (₹)     │  │ fare (₹)     │  │ totalPrice (₹)  │
    │ payment: ref │  │ payment: ref │  │ payment: ref    │
    └──────────────┘  └──────────────┘  └─────────────────┘
```

---

## Database Schema

### Payment Document Structure

```javascript
{
  _id: ObjectId,

  // Payment info
  transactionId: "TXN1234567890",
  amount: 500,                           // Amount paid
  paymentMethod: "bkash",
  status: "PENDING" | "APPROVED" | "REJECTED",

  // What payment is for
  paymentFor: "RIDE" | "RETURN" | "SHARE_VEHICLE",  ⭐ KEY

  // Reference to service (only one will be populated)
  rideId: ObjectId (null if not for ride),
  returnId: ObjectId (null if not for return),
  shareVehicleBookingId: ObjectId (null if not for booking),

  // User & Admin info
  userId: ObjectId,                     // Who paid

  // Timestamps
  submittedAt: Date,                   // When user submitted
  approvedAt: Date,                    // When admin approved
  approvedBy: ObjectId,                // Which admin
  rejectionReason: String,             // If rejected

  createdAt: Date,
  updatedAt: Date
}
```

---

## Enum Values

```typescript
enum PaymentStatus {
  PENDING = "PENDING", // Waiting for admin
  APPROVED = "APPROVED", // Verified & approved
  REJECTED = "REJECTED", // Needs resubmission
  PROCESSING = "PROCESSING", // For future use
}

enum PaymentFor {
  RIDE = "RIDE", // Ride payment
  RETURN = "RETURN", // Return payment
  SHARE_VEHICLE = "SHARE_VEHICLE", // Share vehicle payment
}
```

---

## API Endpoints

### 1. User: Submit Payment

```
POST /api/v1/payment/submit
Auth: User
Content-Type: application/json

Request Body (For Ride):
{
  "rideId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN1234567890ABC"
}

Request Body (For Return):
{
  "returnId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN1234567890ABC"
}

Request Body (For Share Vehicle):
{
  "shareVehicleBookingId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN1234567890ABC"
}

Response (200):
{
  "success": true,
  "message": "Payment submitted successfully",
  "data": {
    "payment": {
      "_id": "payment123",
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "paymentFor": "RIDE" | "RETURN" | "SHARE_VEHICLE",
      "status": "PENDING",
      "submittedAt": "2024-03-04T12:30:00Z"
    },
    "paymentDetails": {
      "adminBkashNumber": "+880XXXXXXXXXX",
      "amount": 500,
      "paymentFor": "RIDE"
    }
  }
}
```

### 2. Admin: View All Pending Payments

```
GET /api/v1/payment/pending/all
Auth: Admin

Response (200):
{
  "success": true,
  "message": "Pending payments fetched successfully",
  "data": [
    {
      "_id": "payment123",
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "paymentFor": "RIDE" | "RETURN" | "SHARE_VEHICLE",
      "status": "PENDING",
      "userId": { "name": "User", "phoneNumber": "..." },
      "rideId": { ... } | null,
      "returnId": { ... } | null,
      "shareVehicleBookingId": { ... } | null,
      "submittedAt": "2024-03-04T12:30:00Z"
    },
    // ... more payments
  ]
}
```

### 3. Admin: View Pending by Type

```
GET /api/v1/payment/pending/:paymentFor
Auth: Admin

:paymentFor = RIDE | RETURN | SHARE_VEHICLE

Response: Same as above, filtered by type
```

### 4. Admin: Approve/Reject Payment

```
POST /api/v1/payment/approve/:paymentId
Auth: Admin
Content-Type: application/json

Request Body (Approve):
{
  "approved": true
}

Request Body (Reject):
{
  "approved": false,
  "rejectionReason": "Transaction not found in records"
}

Response (200):
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "_id": "payment123",
    "status": "APPROVED" | "REJECTED",
    "paymentFor": "RIDE" | "RETURN" | "SHARE_VEHICLE",
    "approvedAt": "2024-03-04T12:35:00Z",
    "approvedBy": "admin123"
  }
}
```

### 5. User: Get My Payments

```
GET /api/v1/payment/my-payments
Auth: User

Response:
{
  "success": true,
  "message": "Your payments fetched successfully",
  "data": [
    { payment1 },
    { payment2 },
    // ... user's payments
  ]
}
```

### 6. User: Get Single Payment

```
GET /api/v1/payment/:paymentId
Auth: User

Response:
{
  "success": true,
  "message": "Payment fetched successfully",
  "data": { payment details }
}
```

---

## Flow Diagrams

### RIDE Payment Flow

```
1. User requests ride
2. Driver submits proposal
3. User accepts proposal
   └─ Response: { rideId, paymentDetails }
4. User sends bkash payment
5. User submits transaction ID
   └─ POST /payment/submit { rideId, transactionId }
   └─ Payment created with PENDING status
6. Admin views pending
   └─ GET /payment/pending/all or /pending/RIDE
7. Admin approves
   └─ POST /payment/approve/:paymentId { approved: true }
   └─ Ride status → COMPLETED
8. User notified ✓
```

### RETURN Payment Flow

```
1. Driver creates return ride
2. Passenger books return
   └─ Response: { return, paymentDetails }
3. Passenger sends bkash payment
4. Passenger submits transaction ID
   └─ POST /payment/submit { returnId, transactionId }
   └─ Payment created with PENDING status
5. Admin views pending
   └─ GET /payment/pending/all or /pending/RETURN
6. Admin approves
   └─ POST /payment/approve/:paymentId { approved: true }
   └─ Return status → COMPLETED
7. Passenger notified ✓
```

### SHARE VEHICLE Payment Flow

```
1. Owner posts share vehicle
2. Passenger books seats
   └─ Response: { booking, paymentDetails }
3. Passenger sends bkash payment
4. Passenger submits transaction ID
   └─ POST /payment/submit { shareVehicleBookingId, transactionId }
   └─ Payment created with PENDING status
5. Admin views pending
   └─ GET /payment/pending/all or /pending/SHARE_VEHICLE
6. Admin approves
   └─ POST /payment/approve/:paymentId { approved: true }
   └─ Booking status → CONFIRMED
7. Passenger notified ✓
```

---

## Service Updates

### Ride Service

When user accepts proposal:

- Response includes `paymentDetails`
- Contains admin bkash number
- Shows amount to pay

### Return Service

When passenger books:

- Response includes `paymentDetails`
- Contains admin bkash number
- Shows amount to pay

### Share Vehicle Booking Service

When passenger confirms booking:

- Response includes `paymentDetails`
- Contains admin bkash number
- Shows amount to pay

---

## Frontend Integration

### Step 1: Show Payment UI After Booking

```javascript
// Any booking response
const { paymentRequired, paymentDetails } = response.data;

if (paymentRequired) {
  showPaymentInterface({
    amount: paymentDetails.amount,
    paymentFor: paymentDetails.paymentFor,
    adminBkashNumber: paymentDetails.adminBkashNumber,
    message: paymentDetails.message,
  });
}
```

### Step 2: User Submits Payment

```javascript
const submitPayment = async (bookingId, bookingType, transactionId) => {
  const payload = {
    transactionId,
  };

  if (bookingType === "RIDE") {
    payload.rideId = bookingId;
  } else if (bookingType === "RETURN") {
    payload.returnId = bookingId;
  } else if (bookingType === "SHARE_VEHICLE") {
    payload.shareVehicleBookingId = bookingId;
  }

  const response = await axios.post("/payment/submit", payload);
};
```

### Step 3: Admin Dashboard

```javascript
// View all pending
const allPending = await axios.get("/payment/pending/all");

// View by type
const ridePending = await axios.get("/payment/pending/RIDE");
const returnPending = await axios.get("/payment/pending/RETURN");
const shareVehiclePending = await axios.get("/payment/pending/SHARE_VEHICLE");

// Approve/Reject
const approve = (paymentId) => {
  axios.post(`/payment/approve/${paymentId}`, { approved: true });
};
```

---

## Files Created/Modified

### New Files Created

```
src/modules/payment/
├── payment.enum.ts              ✅ NEW
├── payment.interface.ts         ✅ NEW
├── payment.model.ts             ✅ NEW
├── payment.validation.ts        ✅ NEW
├── payment.service.ts           ✅ NEW
└── payment.controller.ts        ✅ NEW
```

### Files Modified

```
src/modules/ride/
└── ride.controller.ts           ✅ Enhanced responses

src/modules/return/
├── return.interface.ts          ✅ Added payment field
├── return.model.ts              ✅ Added payment ref
└── return.controller.ts         ✅ Enhanced responses

src/modules/share-vehicle-booking/
├── share_vehicle_booking.interface.ts  ✅ Added payment field
├── share_vehicle_booking.model.ts      ✅ Added payment ref
└── share_vehicle_booking.controller.ts ✅ Enhanced responses

src/router/
└── router.ts                    ✅ Added payment route
```

---

## Key Benefits

✅ **Single Payment Module** - One place for all payment logic
✅ **Unified Admin Dashboard** - Manage all payments in one place
✅ **Flexible** - Easy to add new payment types
✅ **Type-Safe** - PaymentFor enum ensures type safety
✅ **Scalable** - Proper indexing for performance
✅ **Audit Trail** - Track who approved what and when
✅ **User Notifications** - Automatic notifications on status change
✅ **Error Handling** - Comprehensive validation and error messages

---

## Configuration

Existing environment variable (already configured):

```bash
ADMIN_BKASH_NUMBER=+880XXXXXXXXXX
```

---

## Testing Endpoints

### Test 1: Submit Ride Payment

```bash
curl -X POST http://localhost:5000/api/v1/payment/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "RIDE_ID",
    "transactionId": "TXN1234567890"
  }'
```

### Test 2: Submit Return Payment

```bash
curl -X POST http://localhost:5000/api/v1/payment/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "returnId": "RETURN_ID",
    "transactionId": "TXN1234567890"
  }'
```

### Test 3: Submit Share Vehicle Payment

```bash
curl -X POST http://localhost:5000/api/v1/payment/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shareVehicleBookingId": "BOOKING_ID",
    "transactionId": "TXN1234567890"
  }'
```

### Test 4: View Pending Payments

```bash
curl -X GET http://localhost:5000/api/v1/payment/pending/all \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 5: Approve Payment

```bash
curl -X POST http://localhost:5000/api/v1/payment/approve/PAYMENT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

---

## Status: ✅ COMPLETE

সম্পূর্ণ unified payment system তৈরি হয়েছে যা:

- ✅ তিনটি different services কে support করে
- ✅ সিঙ্গেল admin dashboard এ সব manage করা যায়
- ✅ সব payment types এর জন্য same workflow
- ✅ টাইপ-safe, scalable, maintainable

**Now ready for immediate use!** 🚀
