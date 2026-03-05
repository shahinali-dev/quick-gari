# Ride Payment System Documentation

## Overview

This document describes the complete flow for ride bookings. After a user accepts a driver proposal, they need to complete a payment verification process before the ride is confirmed.

## Payment Flow

### 1. **User Requests a Ride**

- Endpoint: `POST /rides`
- Ride status: `REQUESTED`
- Open for proposals from drivers

### 2. **Driver Submits Proposal**

- Endpoint: `POST /rides/proposal`
- Required: `rideId`, `fare`
- Proposal added to ride proposals array

### 3. **User Accepts Proposal**

- Endpoint: `POST /rides/accept-proposal`
- Required: `rideId`, `proposalId`
- Ride status changes to: `PENDING`

  ```

  ```

- **Frontend Action:** Show payment interface with admin bkash details
- User is instructed to send payment to admin's bkash number

### 4. **User Submits Payment Transaction ID** ⭐ NEW

- Endpoint: `POST /payment/submit`
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
  - Ride status remains: `PENDING` (waiting for payment approval)

### 5. **Admin Reviews & Approves/Rejects Payment** ⭐ NEW

- Endpoint: `POST /payment/approve/:rideId`
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
  - Ride status: `ACCEPTED`
  - User notified: "Payment approved! Your ride is confirmed."
  - Driver notified: "Ride payment approved! You are confirmed as driver."
- **If Rejected:**
  - Payment status: `REJECTED`
  - Ride status: Reset to `REQUESTED` (allows retry)
  - User notified: "Payment rejected: [reason]"
