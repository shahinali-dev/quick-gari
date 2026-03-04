# ⚡ Unified Payment System - Quick Reference

## 🎯 What's Been Done

Created a **single Payment module** that handles payments for:

- 🚗 Ride booking
- 🔄 Return trip booking
- 🚌 Share vehicle booking

---

## 📊 Key Concept

```
PaymentFor enum: RIDE | RETURN | SHARE_VEHICLE

Payment Document:
{
  transactionId: "TXN123...",
  amount: 500,
  paymentFor: "RIDE" | "RETURN" | "SHARE_VEHICLE",  ⭐ IMPORTANT
  rideId: (only if RIDE),
  returnId: (only if RETURN),
  shareVehicleBookingId: (only if SHARE_VEHICLE),
  status: "PENDING" | "APPROVED" | "REJECTED"
}
```

---

## 🔌 6 New API Endpoints

| Endpoint                       | Method | Auth  | Purpose                                  |
| ------------------------------ | ------ | ----- | ---------------------------------------- |
| `/payment/submit`              | POST   | User  | Submit transaction ID                    |
| `/payment/approve/:paymentId`  | POST   | Admin | Approve/reject payment                   |
| `/payment/pending/all`         | GET    | Admin | View all pending                         |
| `/payment/pending/:paymentFor` | GET    | Admin | View by type (RIDE/RETURN/SHARE_VEHICLE) |
| `/payment/my-payments`         | GET    | User  | View my payments                         |
| `/payment/:paymentId`          | GET    | User  | View single payment                      |

---

## 💡 Request Examples

### User: Submit Payment

```bash
# For Ride
POST /api/v1/payment/submit
{ "rideId": "...", "transactionId": "TXN123" }

# For Return
POST /api/v1/payment/submit
{ "returnId": "...", "transactionId": "TXN123" }

# For Share Vehicle
POST /api/v1/payment/submit
{ "shareVehicleBookingId": "...", "transactionId": "TXN123" }
```

### Admin: View Pending

```bash
# All pending (all types)
GET /api/v1/payment/pending/all

# Only RIDE payments
GET /api/v1/payment/pending/RIDE

# Only RETURN payments
GET /api/v1/payment/pending/RETURN

# Only SHARE_VEHICLE payments
GET /api/v1/payment/pending/SHARE_VEHICLE
```

### Admin: Approve/Reject

```bash
# Approve
POST /api/v1/payment/approve/:paymentId
{ "approved": true }

# Reject
POST /api/v1/payment/approve/:paymentId
{ "approved": false, "rejectionReason": "..." }
```

---

## 🗂️ File Structure

```
New Payment Module:
src/modules/payment/
├── payment.enum.ts              (PaymentStatus, PaymentFor)
├── payment.interface.ts         (IPayment)
├── payment.model.ts             (MongoDB schema)
├── payment.validation.ts        (Zod schemas)
├── payment.service.ts           (Business logic)
└── payment.controller.ts        (API routes)

Updated Models:
├── return.model.ts              (Added payment ref)
├── return.interface.ts          (Added payment field)
├── share_vehicle_booking.model.ts (Added payment ref)
├── share_vehicle_booking.interface.ts (Added payment field)
├── return.controller.ts         (Enhanced response)
├── share_vehicle_booking.controller.ts (Enhanced response)
└── router.ts                    (Added payment route)
```

---

## ✨ Frontend Integration

### Step 1: After Any Booking

```javascript
const { paymentRequired, paymentDetails } = response.data;
// Show payment UI with:
// - adminBkashNumber
// - amount
// - paymentFor (RIDE/RETURN/SHARE_VEHICLE)
```

### Step 2: User Submits Payment

```javascript
const payload = {
  transactionId: "TXN123...",
  rideId: bookingId        // if RIDE
  // OR
  returnId: bookingId      // if RETURN
  // OR
  shareVehicleBookingId: bookingId  // if SHARE_VEHICLE
};
axios.post('/api/v1/payment/submit', payload);
```

### Step 3: Admin Dashboard

```javascript
// View pending
const pendingRide = await axios.get("/api/v1/payment/pending/RIDE");
const pendingReturn = await axios.get("/api/v1/payment/pending/RETURN");
const pendingShare = await axios.get("/api/v1/payment/pending/SHARE_VEHICLE");

// Approve
axios.post(`/api/v1/payment/approve/${paymentId}`, { approved: true });
```

---

## 🔄 Status Transitions

### Payment Status

```
PENDING → APPROVED  → (Booking status → COMPLETED/CONFIRMED)
      ↓
    REJECTED → (Can retry with new transaction ID)
```

### Booking Status Changes (After Payment Approval)

```
Ride:           ACCEPTED → COMPLETED
Return:         PENDING → COMPLETED
Share Vehicle:  PENDING → CONFIRMED
```

---

## 🧪 Quick Test

### 1. Create Ride/Return/Booking (as user)

```bash
POST /api/v1/ride  (or /api/v1/return-trip or /api/v1/share-vehicle-booking)
```

### 2. Submit Payment

```bash
POST /api/v1/payment/submit
{ "rideId|returnId|shareVehicleBookingId": "...", "transactionId": "TXN123" }
```

### 3. View Pending (as admin)

```bash
GET /api/v1/payment/pending/RIDE (or RETURN, SHARE_VEHICLE)
```

### 4. Approve Payment (as admin)

```bash
POST /api/v1/payment/approve/:paymentId
{ "approved": true }
```

---

## ✅ Advantages

✅ **Single Module** - All payment logic in one place
✅ **Unified Admin** - One dashboard for all payment types
✅ **Type-Safe** - PaymentFor enum prevents bugs
✅ **Flexible** - Easy to add new types (Donation, Rental, etc)
✅ **Scalable** - Proper indexing & relationships
✅ **Audit Trail** - Admin approval tracking
✅ **Extensible** - Can add more fields without breaking existing

---

## ⚙️ Configuration

No new environment variables needed! Uses existing:

```
ADMIN_BKASH_NUMBER=+880XXXXXXXXXX
```

---

## 🚀 Status: COMPLETE

সব files তৈরি এবং configured!

Ready to test immediately! 🎯
