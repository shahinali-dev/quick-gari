# 🚗 Ride Payment System - Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Changes](#database-changes)
4. [API Endpoints](#api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Frontend Integration](#frontend-integration)
7. [Admin Dashboard](#admin-dashboard)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## Overview

A complete payment verification system for ride bookings where:

- Users accept driver proposals
- Payment interface shows admin's bkash number
- Users submit bkash transaction ID
- Admin manually verifies and approves/rejects payment
- Ride confirmed only after payment approval

**Status:** ✅ Fully Implemented

---

## Architecture

### Components

```
┌─────────────────┐
│   User (Web)    │  → Request Ride
│                 │  → Accept Proposal + See Payment Details
│                 │  → Submit Transaction ID
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│        Express.js API Server            │
├─────────────────────────────────────────┤
│  Controllers (ride.controller.ts)       │
│  ├─ POST /rides                        │
│  ├─ POST /rides/proposal               │
│  ├─ POST /rides/accept-proposal        │
│  ├─ POST /rides/payment/submit   ⭐    │
│  ├─ POST /rides/payment/approve/:id ⭐ │
│  └─ GET /rides/payments/pending    ⭐  │
│                                         │
│  Services (ride.service.ts)             │
│  ├─ submitPayment()               ⭐    │
│  ├─ approvePayment()              ⭐    │
│  └─ getPendingPayments()          ⭐    │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│        MongoDB Database                 │
├─────────────────────────────────────────┤
│  Ride Document                          │
│  {                                      │
│    user: ObjectId,                      │
│    driver: ObjectId,                    │
│    status: "ACCEPTED",                  │
│    fare: 500,                           │
│    payment: {              ⭐ NEW       │
│      transactionId: "...",              │
│      amount: 500,                       │
│      status: "PENDING|APPROVED|REJECTED"│
│      ...                                │
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘
         │
         ↓
┌─────────────────┐
│ Admin (Web)     │  → View Pending Payments
│                 │  → Approve/Reject Payment
└─────────────────┘
```

---

## Database Changes

### 1. Payment Status Enum (ride.enum.ts)

```typescript
enum PaymentStatus {
  PENDING = "PENDING", // Waiting for admin review
  APPROVED = "APPROVED", // Verified and approved
  REJECTED = "REJECTED", // Needs resubmission
  PROCESSING = "PROCESSING", // Reserved for future
}
```

### 2. Payment Interface (ride.interface.ts)

```typescript
interface IPayment {
  transactionId: string; // User submitted ID
  amount: number; // Ride fare
  paymentMethod: string; // "bkash"
  status: PaymentStatus; // Current status
  submittedAt?: Date; // When submitted
  approvedAt?: Date; // When approved
  approvedBy?: ObjectId; // Admin who approved
  rejectionReason?: string; // If rejected
}
```

### 3. Ride Schema Update (ride.model.ts)

```typescript
const rideSchema = new Schema<IRide>({
  // ... existing fields ...
  payment: paymentSchema, // ⭐ NEW
  // ... rest of schema ...
});
```

### 4. Sample Database Document

```javascript
{
  "_id": "64a8f9c2b1234567890abcde",
  "user": "64a8f9c2b1234567890abcd1",
  "driver": "64a8f9c2b1234567890abcd2",
  "car": "64a8f9c2b1234567890abcd3",
  "startLocation": "Dhaka",
  "endLocation": "Chittagong",
  "fare": 500,
  "status": "ACCEPTED",
  "payment": {                              // ⭐ NEW
    "_id": "64a8f9d2b1234567890abcde",
    "transactionId": "TXN1234567890ABC",
    "amount": 500,
    "paymentMethod": "bkash",
    "status": "PENDING",
    "submittedAt": "2024-03-04T12:30:00Z"
  },
  "createdAt": "2024-03-04T10:00:00Z",
  "updatedAt": "2024-03-04T12:30:00Z"
}
```

---

## API Endpoints

### User Endpoints

#### 1️⃣ Accept Proposal (Enhanced)

```
POST /rides/accept-proposal
Content-Type: application/json
Authorization: Bearer {USER_TOKEN}

Request:
{
  "rideId": "64a8f9c2b1234567890abcde",
  "proposalId": "64a8f9c2b1234567890abcdf"
}

Response (200):
{
  "success": true,
  "data": {
    "ride": { ... },
    "paymentDetails": {          ⭐ NEW
      "amount": 500,
      "paymentMethod": "bkash",
      "adminBkashNumber": "+880XXXXXXXXXX",
      "instructions": "Send payment..."
    }
  }
}
```

#### 2️⃣ Submit Payment Transaction ID ⭐ NEW

```
POST /rides/payment/submit
Content-Type: application/json
Authorization: Bearer {USER_TOKEN}

Request:
{
  "rideId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN1234567890ABC"
}

Response (200):
{
  "success": true,
  "message": "Payment submitted successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "status": "ACCEPTED",
    "payment": {
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "status": "PENDING",
      "submittedAt": "2024-03-04T12:30:00Z"
    }
  }
}

Errors:
- 400: Ride must be accepted before submitting payment
- 400: Payment already submitted for this ride
- 404: Ride not found
- 403: You are not authorized
```

### Admin Endpoints

#### 3️⃣ View Pending Payments ⭐ NEW

```
GET /rides/payments/pending
Authorization: Bearer {ADMIN_TOKEN}

Response (200):
{
  "success": true,
  "message": "Pending payments fetched successfully",
  "data": [
    {
      "_id": "ride123",
      "user": { "_id": "user1", "name": "Karim", "phoneNumber": "+8801712345678" },
      "driver": { "_id": "driver1", "name": "Rahul", "phoneNumber": "+8801912345678" },
      "fare": 500,
      "payment": {
        "transactionId": "TXN1234567890ABC",
        "amount": 500,
        "status": "PENDING",
        "submittedAt": "2024-03-04T12:30:00Z"
      }
    }
  ]
}

Errors:
- 403: You are not authorized to access this route
```

#### 4️⃣ Approve/Reject Payment ⭐ NEW

```
POST /rides/payment/approve/:rideId
Content-Type: application/json
Authorization: Bearer {ADMIN_TOKEN}

Request - Approve:
{
  "approved": true
}

Request - Reject:
{
  "approved": false,
  "rejectionReason": "Transaction not found in bank records"
}

Response (200 - Approved):
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {
    "_id": "ride123",
    "status": "COMPLETED",           ⭐ Changed
    "payment": {
      "status": "APPROVED",          ⭐ Changed
      "approvedAt": "2024-03-04T12:35:00Z",
      "approvedBy": "admin123"
    }
  }
}

Response (200 - Rejected):
{
  "success": true,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "ride123",
    "status": "REQUESTED",           ⭐ Reset to REQUESTED
    "payment": {
      "status": "REJECTED",
      "rejectionReason": "Transaction not found in bank records"
    }
  }
}

Errors:
- 400: No payment found for this ride
- 404: Ride not found
- 403: You are not authorized to access this route
```

---

## Payment Flow

### Step-by-Step User Flow

```
1. USER REQUESTS RIDE
   └─ Status: REQUESTED
   └─ Awaiting driver proposals

2. DRIVER SUBMITS PROPOSAL
   └─ Proposal added to ride
   └─ User notified of new proposal

3. USER ACCEPTS PROPOSAL ⭐ PAYMENT STARTS HERE
   └─ Status: ACCEPTED
   └─ Response includes:
      ├─ Admin bkash number: +880XXXXXXXXXX
      ├─ Amount to send: 500 BDT
      └─ Instructions: Submit transaction ID after payment

4. USER SENDS PAYMENT (Outside App)
   └─ User opens bkash/mobile banking
   └─ Sends 500 BDT to +880XXXXXXXXXX
   └─ Receives transaction ID (e.g., TXN1234567890ABC)

5. USER SUBMITS TRANSACTION ID ⭐
   └─ POST /rides/payment/submit
   └─ Payment Status: PENDING
   └─ Ride Status: ACCEPTED
   └─ Waiting for admin verification

6. ADMIN REVIEWS PAYMENT ⭐
   ├─ GET /rides/payments/pending (views all pending)
   ├─ Checks bank records
   └─ Either:
      ├─ ✅ APPROVES: POST /payment/approve with approved: true
      │   └─ Ride Status: COMPLETED
      │   └─ Payment Status: APPROVED
      │   └─ User & Driver Notified ✓
      │
      └─ ❌ REJECTS: POST /payment/approve with approved: false
         └─ Ride Status: REQUESTED (allows retry)
         └─ Payment Status: REJECTED
         └─ User Notified with Reason
         └─ User can resubmit with correct transaction ID

7. RIDE CONFIRMED (If Approved)
   └─ User sees: "Payment approved! Your ride is confirmed"
   └─ Driver sees: "Ride confirmed! Ready to go"
   └─ Ride can now proceed
```

### Status Transitions

```
RIDE STATUS FLOW:
  REQUESTED ──→ ACCEPTED ──→ COMPLETED
                    ↓
                REQUESTED (if payment rejected)

PAYMENT STATUS FLOW:
  (None) ──→ PENDING ──→ APPROVED
                ↓
              REJECTED (revert to PENDING)
```

---

## Frontend Integration

### 1. Accept Proposal & Show Payment UI

```javascript
// After accept-proposal API call
const { paymentDetails } = response.data;

// UI to display:
const PaymentInterface = () => {
  return (
    <div className="payment-container">
      <h2>💳 Payment Required</h2>
      <p>Amount: {paymentDetails.amount} BDT</p>
      <p>Payment Method: {paymentDetails.paymentMethod}</p>

      <div className="bkash-details">
        <p>Send payment to:</p>
        <code style={{ fontSize: "18px", fontWeight: "bold" }}>
          {paymentDetails.adminBkashNumber}
        </code>
        <p className="small-text">Copy this number to your mobile banking</p>
      </div>

      <p className="instructions">{paymentDetails.instructions}</p>

      <input
        type="text"
        placeholder="Enter transaction ID (e.g., TXN1234567890ABC)"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
      />

      <button onClick={() => submitPayment(rideId, transactionId)}>
        Submit Payment
      </button>
    </div>
  );
};
```

### 2. Submit Transaction ID

```javascript
const submitPayment = async (rideId, transactionId) => {
  try {
    const response = await axios.post(
      "/rides/payment/submit",
      { rideId, transactionId },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    toast.success("Payment submitted successfully!");
    toast.info("Admin will verify within a few minutes");

    // Show pending status
    setPaymentStatus("PENDING");
  } catch (error) {
    toast.error(error.response.data.message);
  }
};
```

### 3. Listen for Payment Status Updates (Socket.IO)

```javascript
useEffect(() => {
  // Connect to socket
  const socket = io(API_URL);

  // Listen for payment approval
  socket.on("notification:new", (notification) => {
    if (notification.type === "PAYMENT_APPROVED") {
      toast.success("🎉 Payment approved! Your ride is confirmed!");
      setPaymentStatus("APPROVED");
      setRideStatus("COMPLETED");

      // Show ride details and start navigation
      navigateToRideTracking();
    }

    if (notification.type === "PAYMENT_REJECTED") {
      toast.error(`❌ Payment rejected: ${notification.message}`);
      setPaymentStatus("REJECTED");
      setRideStatus("ACCEPTED"); // Allow retry
    }
  });

  return () => socket.disconnect();
}, []);
```

---

## Admin Dashboard

### Payment Verification Interface

```javascript
const PendingPaymentsPage = () => {
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    const response = await axios.get("/rides/payments/pending", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    setPendingPayments(response.data.data);
  };

  const approvePayment = async (rideId) => {
    await axios.post(
      `/rides/payment/approve/${rideId}`,
      { approved: true },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    toast.success("Payment approved!");
    fetchPendingPayments(); // Refresh list
  };

  const rejectPayment = async (rideId, reason) => {
    await axios.post(
      `/rides/payment/approve/${rideId}`,
      { approved: false, rejectionReason: reason },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    toast.success("Payment rejected");
    fetchPendingPayments(); // Refresh list
  };

  return (
    <div className="pending-payments">
      <h1>Pending Payment Verifications</h1>
      <p>Total: {pendingPayments.length}</p>

      {pendingPayments.map((ride) => (
        <div key={ride._id} className="payment-card">
          <div className="payment-info">
            <h3>
              {ride.user.name} → {ride.driver.name}
            </h3>
            <p>
              Route: {ride.startLocation} → {ride.endLocation}
            </p>
            <p>
              Amount: <strong>{ride.payment.amount} BDT</strong>
            </p>
            <p>
              Transaction ID: <code>{ride.payment.transactionId}</code>
            </p>
            <p>
              Submitted: {new Date(ride.payment.submittedAt).toLocaleString()}
            </p>
          </div>

          <div className="action-buttons">
            <button
              className="approve-btn"
              onClick={() => approvePayment(ride._id)}
            >
              ✅ Approve
            </button>

            <button
              className="reject-btn"
              onClick={() => {
                const reason = prompt("Rejection reason:");
                if (reason) rejectPayment(ride._id, reason);
              }}
            >
              ❌ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing Guide

### Prerequisites

- Postman or cURL
- Valid user and admin tokens
- `.env` with `ADMIN_BKASH_NUMBER`

### Test Sequence

#### 1. Create Ride

```bash
curl -X POST http://localhost:5000/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "startLocation": "Dhaka",
    "endLocation": "Chittagong",
    "date": "2024-03-15",
    "startTime": "10:00"
  }'
```

**Expected:** Ride created with REQUESTED status

#### 2. Submit Proposal

```bash
curl -X POST http://localhost:5000/rides/proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -d '{
    "rideId": "RIDE_ID",
    "fare": "500"
  }'
```

**Expected:** Proposal added

#### 3. Accept Proposal ⭐

```bash
curl -X POST http://localhost:5000/rides/accept-proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "RIDE_ID",
    "proposalId": "PROPOSAL_ID"
  }'
```

**Expected:** Response includes `paymentDetails` with `adminBkashNumber`

#### 4. Submit Payment ⭐

```bash
curl -X POST http://localhost:5000/rides/payment/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "RIDE_ID",
    "transactionId": "TXN1234567890ABC"
  }'
```

**Expected:** Payment created with PENDING status

#### 5. View Pending (Admin) ⭐

```bash
curl -X GET http://localhost:5000/rides/payments/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** List of rides with pending payments

#### 6. Approve Payment ⭐

```bash
curl -X POST http://localhost:5000/rides/payment/approve/RIDE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"approved": true}'
```

**Expected:** Ride status changed to COMPLETED, payment APPROVED

---

## Troubleshooting

### Issue: "Admin Bkash number not showing"

**Solution:** Check `.env` has `ADMIN_BKASH_NUMBER=+880XXXXXXXXXX`

### Issue: "User can submit payment before accepting proposal"

**Solution:** Service validates `ride.status === ACCEPTED` before allowing submission

### Issue: "Admin can't approve payment"

**Solution:** Ensure admin has `role === ADMIN` in database

### Issue: "Payment submitted twice"

**Solution:** Service checks if `ride.payment` already exists

### Issue: "Can't resubmit after rejection"

**Solution:** This is working as designed. After rejection, ride status reverts to REQUESTED, allowing user to submit new payment

---

## Configuration Checklist

- [x] Add `ADMIN_BKASH_NUMBER` to `.env`
- [x] Verify `isAdmin` middleware is available
- [x] Check notification service is integrated
- [x] Verify Socket.IO is configured (optional but recommended)
- [x] Test email notifications for admins (optional)

---

## Files Modified Summary

| File                 | Changes                           |
| -------------------- | --------------------------------- |
| `ride.enum.ts`       | Added `PaymentStatus` enum        |
| `ride.interface.ts`  | Added `IPayment` interface        |
| `ride.model.ts`      | Added payment schema              |
| `ride.validation.ts` | Added payment validation schemas  |
| `ride.service.ts`    | Added 3 new payment methods       |
| `ride.controller.ts` | Added 3 new payment endpoints     |
| `config/index.ts`    | Added `ADMIN_BKASH_NUMBER` config |

---

## Next Steps

1. ✅ Add `ADMIN_BKASH_NUMBER` to `.env`
2. ✅ Test all endpoints with Postman
3. ✅ Implement frontend UI
4. ✅ Set up admin dashboard
5. ✅ Deploy to production
6. 🔄 Monitor payment submissions
7. 📊 Add analytics/reporting (future)

---

## Support & Documentation

- **API Reference:** See `API_PAYMENT_REFERENCE.md`
- **Test Examples:** See `TEST_EXAMPLES.md`
- **Complete System Flow:** See `RIDE_PAYMENT_SYSTEM.md`
- **Implementation Details:** See `IMPLEMENTATION_COMPLETE.md`

---

**Status:** ✅ Implementation Complete & Ready to Deploy
