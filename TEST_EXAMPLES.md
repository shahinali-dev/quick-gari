# Ride Payment System - Test Examples

## Postman / cURL Test Examples

### 1. User Requests a Ride

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

**Expected Response:** Ride created with status `REQUESTED`

---

### 2. Driver Submits Proposal

```bash
curl -X POST http://localhost:5000/rides/proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -d '{
    "rideId": "64a8f9c2b1234567890abcde",
    "fare": "500"
  }'
```

**Expected Response:** Proposal added to ride, notifications sent to user

---

### 3. User Accepts Proposal ⭐ (Shows Payment Details)

```bash
curl -X POST http://localhost:5000/rides/accept-proposal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "64a8f9c2b1234567890abcde",
    "proposalId": "64a8f9c2b1234567890abcdf"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal accepted successfully",
  "data": {
    "ride": {
      "_id": "64a8f9c2b1234567890abcde",
      "startLocation": "Dhaka",
      "endLocation": "Chittagong",
      "fare": 500,
      "driver": {
        "_id": "64a8f9c2b1234567890abcd2",
        "name": "Rahul Islam",
        "phoneNumber": "+8801912345678"
      },
      "status": "ACCEPTED"
    },
    "paymentDetails": {
      "amount": 500,
      "paymentMethod": "bkash",
      "adminBkashNumber": "+880XXXXXXXXXX",
      "instructions": "Send payment to the admin bkash number and submit your transaction ID"
    }
  }
}
```

**Frontend shows to user:**

```
💳 Payment Required

Please send 500 BDT to: +880XXXXXXXXXX (bkash)

After payment, enter your transaction ID below:
[Input field for transaction ID]
[Submit Button]
```

---

### 4. User Submits Payment Transaction ID ⭐ (After Bkash Transfer)

```bash
curl -X POST http://localhost:5000/rides/payment/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "64a8f9c2b1234567890abcde",
    "transactionId": "TXN1234567890ABC"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment submitted successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "startLocation": "Dhaka",
    "endLocation": "Chittagong",
    "fare": 500,
    "status": "ACCEPTED",
    "payment": {
      "_id": "64a8f9d2b1234567890abcde",
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "PENDING",
      "submittedAt": "2024-03-04T12:30:00Z"
    }
  }
}
```

**Server logs:**

```
✅ Payment submitted for ride 64a8f9c2b1234567890abcde
   Transaction ID: TXN1234567890ABC
   Amount: 500
```

**User notification:**

```
✅ Payment submitted. Admin will verify and confirm shortly.
```

---

### 5. Admin Views All Pending Payments

```bash
curl -X GET http://localhost:5000/rides/payments/pending \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pending payments fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcde",
      "startLocation": "Dhaka",
      "endLocation": "Chittagong",
      "fare": 500,
      "status": "ACCEPTED",
      "user": {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Karim Ahmed",
        "phoneNumber": "+8801712345678"
      },
      "driver": {
        "_id": "64a8f9c2b1234567890abcd2",
        "name": "Rahul Islam",
        "phoneNumber": "+8801912345678"
      },
      "payment": {
        "_id": "64a8f9d2b1234567890abcde",
        "transactionId": "TXN1234567890ABC",
        "amount": 500,
        "paymentMethod": "bkash",
        "status": "PENDING",
        "submittedAt": "2024-03-04T12:30:00Z"
      }
    }
  ]
}
```

**Admin Dashboard displays:**

```
PENDING PAYMENTS
─────────────────────────────────────────────
Passenger: Karim Ahmed (+8801712345678)
Driver: Rahul Islam (+8801912345678)
Route: Dhaka → Chittagong
Amount: 500 BDT
Transaction ID: TXN1234567890ABC
Submitted: 12:30 PM

[✅ Approve] [❌ Reject]
```

---

### 6. Admin Approves Payment ✅

```bash
curl -X POST http://localhost:5000/rides/payment/approve/64a8f9c2b1234567890abcde \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "approved": true
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment approved successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "startLocation": "Dhaka",
    "endLocation": "Chittagong",
    "fare": 500,
    "status": "COMPLETED",
    "payment": {
      "_id": "64a8f9d2b1234567890abcde",
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "APPROVED",
      "submittedAt": "2024-03-04T12:30:00Z",
      "approvedAt": "2024-03-04T12:35:00Z",
      "approvedBy": "64a8f9c2b1234567890abcd0"
    }
  }
}
```

**User receives notification:**

```
✅ Payment approved! Your ride is confirmed.

Driver: Rahul Islam
Pick-up: Dhaka
Drop-off: Chittagong
Amount: 500 BDT
Status: Ready to go
```

**Driver receives notification:**

```
✅ Ride payment approved! You are confirmed as driver.

Passenger: Karim Ahmed
Pick-up: Dhaka
Drop-off: Chittagong
Amount: 500 BDT
Status: Ready to start
```

---

### 7. Admin Rejects Payment ❌

```bash
curl -X POST http://localhost:5000/rides/payment/approve/64a8f9c2b1234567890abcde \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "approved": false,
    "rejectionReason": "Transaction ID not found in bank records. Please verify and try again."
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "startLocation": "Dhaka",
    "endLocation": "Chittagong",
    "fare": 500,
    "status": "REQUESTED",
    "payment": {
      "_id": "64a8f9d2b1234567890abcde",
      "transactionId": "TXN1234567890ABC",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "REJECTED",
      "rejectionReason": "Transaction ID not found in bank records. Please verify and try again.",
      "submittedAt": "2024-03-04T12:30:00Z"
    }
  }
}
```

**Note:** Ride status is set back to `REQUESTED` so user can resubmit payment

**User receives notification:**

```
❌ Payment rejected: Transaction ID not found in bank records. Please verify and try again.

Please try submitting again with correct transaction ID.
```

---

### 8. User Resubmits Payment (After Rejection) 🔄

```bash
curl -X POST http://localhost:5000/rides/payment/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "64a8f9c2b1234567890abcde",
    "transactionId": "TXN9876543210XYZ"
  }'
```

**Expected Response:** New payment created with PENDING status

---

## Error Scenarios

### Scenario 1: User tries to submit payment for REQUESTED ride (not accepted)

```bash
curl -X POST http://localhost:5000/rides/payment/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "rideId": "64a8f9c2b1234567890abcde",
    "transactionId": "TXN1234567890ABC"
  }'
```

**Error Response (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Ride must be accepted before submitting payment"
}
```

---

### Scenario 2: User tries to submit payment twice

```bash
# Second submission with same ride
curl -X POST http://localhost:5000/rides/payment/submit ...
```

**Error Response (400):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Payment already submitted for this ride"
}
```

---

### Scenario 3: Non-admin tries to access pending payments

```bash
curl -X GET http://localhost:5000/rides/payments/pending \
  -H "Authorization: Bearer USER_TOKEN"
```

**Error Response (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You are not authorized to access this route"
}
```

---

### Scenario 4: User tries to approve payment

```bash
curl -X POST http://localhost:5000/rides/payment/approve/64a8f9c2b1234567890abcde \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"approved": true}'
```

**Error Response (403):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You are not authorized to access this route"
}
```

---

## Database Schema Reference

### Ride Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId,           // User who requested ride
  driver: ObjectId,         // Driver who accepted proposal
  car: ObjectId,           // Car assigned
  startLocation: String,
  endLocation: String,
  distance: Number,
  date: Date,
  startTime: Date,
  fare: Number,
  proposals: [{
    _id: ObjectId,
    driver: ObjectId,
    car: ObjectId,
    fare: Number,
    createdAt: Date
  }],
  payment: {                // Only exists if user submitted payment
    _id: ObjectId,
    transactionId: String,
    amount: Number,
    paymentMethod: String,
    status: String,         // PENDING, APPROVED, REJECTED
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: ObjectId,
    rejectionReason: String
  },
  status: String,           // REQUESTED, ACCEPTED, COMPLETED
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implementation Checklist

- [x] Models updated with payment schema
- [x] Interfaces defined for type safety
- [x] Enums for payment status
- [x] Validation schemas for payment data
- [x] Service methods for payment operations
- [x] API endpoints created
- [x] Admin authorization middleware applied
- [x] Notifications integrated
- [x] Error handling implemented
- [x] Configuration for admin bkash number

---

## Ready to Deploy ✅

All components are properly integrated and ready for testing and deployment!
