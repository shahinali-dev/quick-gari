# Ride Payment APIs - Quick Reference

## 1. Accept Proposal (with Payment Details)

```
POST /rides/accept-proposal
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "rideId": "64a8f9c2b1234567890abcde",
  "proposalId": "64a8f9c2b1234567890abcdf"
}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal accepted successfully",
  "data": {
    "ride": {
      "_id": "64a8f9c2b1234567890abcde",
      "user": "64a8f9c2b1234567890abcd1",
      "driver": "64a8f9c2b1234567890abcd2",
      "car": "64a8f9c2b1234567890abcd3",
      "startLocation": "Dhaka",
      "endLocation": "Chittagong",
      "fare": 500,
      "status": "ACCEPTED",
      "proposals": [...],
      "createdAt": "2024-03-04T10:30:00Z",
      "updatedAt": "2024-03-04T11:00:00Z"
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

## 2. Submit Payment Transaction ID

```
POST /rides/payment/submit
Content-Type: application/json
Authorization: Bearer {token}

Request Body:
{
  "rideId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN1234567890"
}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Payment submitted successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "user": "64a8f9c2b1234567890abcd1",
    "driver": "64a8f9c2b1234567890abcd2",
    "fare": 500,
    "status": "ACCEPTED",
    "payment": {
      "_id": "64a8f9d2b1234567890abcde",
      "transactionId": "TXN1234567890",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "PENDING",
      "submittedAt": "2024-03-04T11:15:00Z"
    }
  }
}

Error Cases:
- 400: "Ride must be accepted before submitting payment"
- 400: "Payment already submitted for this ride"
- 404: "Ride not found"
- 403: "You are not authorized"
```

## 3. Admin Approve/Reject Payment

```
POST /rides/payment/approve/:rideId
Content-Type: application/json
Authorization: Bearer {admin-token}

Request Body (Approve):
{
  "approved": true
}

Request Body (Reject):
{
  "approved": false,
  "rejectionReason": "Transaction ID not found in bank records"
}

Response - On Approval (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Payment approved successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "user": "64a8f9c2b1234567890abcd1",
    "driver": "64a8f9c2b1234567890abcd2",
    "fare": 500,
    "status": "COMPLETED",
    "payment": {
      "_id": "64a8f9d2b1234567890abcde",
      "transactionId": "TXN1234567890",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "APPROVED",
      "submittedAt": "2024-03-04T11:15:00Z",
      "approvedAt": "2024-03-04T11:20:00Z",
      "approvedBy": "64a8f9c2b1234567890abcd0"
    }
  }
}

Response - On Rejection (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "status": "REQUESTED",
    "payment": {
      "status": "REJECTED",
      "rejectionReason": "Transaction ID not found in bank records"
    }
  }
}

Error Cases:
- 400: "No payment found for this ride"
- 404: "Ride not found"
- 403: "You are not authorized to access this route"
```

## 4. Get All Pending Payments (Admin Dashboard)

```
GET /rides/payments/pending
Authorization: Bearer {admin-token}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Pending payments fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcde",
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
      "startLocation": "Dhaka",
      "endLocation": "Chittagong",
      "fare": 500,
      "status": "ACCEPTED",
      "payment": {
        "_id": "64a8f9d2b1234567890abcde",
        "transactionId": "TXN1234567890",
        "amount": 500,
        "paymentMethod": "bkash",
        "status": "PENDING",
        "submittedAt": "2024-03-04T11:15:00Z"
      }
    },
    ...
  ]
}

Error Cases:
- 403: "You are not authorized to access this route"
```

## Environment Variables

```env
ADMIN_BKASH_NUMBER=+880XXXXXXXXXX
```

## Notes

- All endpoints require JWT authentication (Authorization header)
- Admin endpoints require admin role
- Payment status flow: PENDING → APPROVED/REJECTED
- Ride status flow: REQUESTED → ACCEPTED → COMPLETED (after payment approval)
- If payment is rejected, ride reverts to REQUESTED status for retry
