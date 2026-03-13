# Quick-Gari Complete API Documentation

**Base URL:** `http://localhost:5000/api` or `https://quick-gari.vercel.app/api`

---

## Table of Contents

1. [Auth APIs](#auth-apis)
2. [User APIs](#user-apis)
3. [Car APIs](#car-apis)
4. [Ride APIs](#ride-apis)
5. [Return Trip APIs](#return-trip-apis)
6. [Share Vehicle APIs](#share-vehicle-apis)
7. [Share Vehicle Booking APIs](#share-vehicle-booking-apis)
8. [Share Vehicle Fare Config APIs](#share-vehicle-fare-config-apis)
9. [Payment APIs](#payment-apis)
10. [Notification APIs](#notification-apis)

---

## Auth APIs

### 1. Sign In (POST)

**Endpoint:** `POST /v1/auth/signin`

**Access:** Public (No authentication required)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcd1",
    "name": "Karim Ahmed",
    "email": "karim@example.com",
    "role": "user",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary.com/...",
    "isVerified": true
  },
  "token": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**User Roles:** Regular User / Admin / Car Owner / Driver

---

### 2. Get Authenticated User Info (GET)

**Endpoint:** `GET /v1/auth/user-info`

**Access:** ✅ Authenticated users (Bearer token required)

**Request Header:**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User info fetched successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcd1",
    "name": "Karim Ahmed",
    "email": "karim@example.com",
    "role": "user",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary.com/...",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**User Roles:** All authenticated users

---

### 3. Verify OTP (POST)

**Endpoint:** `POST /v1/auth/verify-otp`

**Access:** Users with valid verify token (OTP verification middleware)

**Request Body:**

```json
{
  "otp": "123456"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcd1",
    "email": "karim@example.com",
    "isVerified": true,
    "verificationTimestamp": "2024-03-09T12:30:00Z"
  }
}
```

**User Roles:** New users during registration

---

### 4. Resend OTP (POST)

**Endpoint:** `POST /v1/auth/resend-otp`

**Access:** Users with valid verify token

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP resent successfully",
  "data": {
    "email": "karim@example.com",
    "message": "OTP sent to your email"
  }
}
```

**User Roles:** New users during registration

---

### 5. Refresh Access Token (POST)

**Endpoint:** `POST /v1/auth/refresh`

**Access:** Public (No authentication required)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**User Roles:** All authenticated users

---

## User APIs

### 1. Register User (POST)

**Endpoint:** `POST /v1/user/register`

**Access:** Public (No authentication required)

**Request Type:** `multipart/form-data`

**Form Fields:**

- `name` (string, required) - User's full name
- `email` (string, required) - Valid email
- `password` (string, required, min 8 characters) - Strong password
- `gender` (string, required) - "male" | "female" | "other"
- `phoneNumber` (string, optional) - Phone number like +8801712345678
- `avatar` (file, optional) - Profile picture

**Response (Success - 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcd1",
    "name": "Karim Ahmed",
    "email": "karim@example.com",
    "gender": "male",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary.com/...",
    "role": "user",
    "isVerified": false,
    "verifyToken": "temporary_token_for_otp_verification"
  }
}
```

**Roles:** Public users

---

### 2. Get All Users (GET)

**Endpoint:** `GET /v1/user/users`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Request Header:**

```
Authorization: Bearer <accessToken>
```

**Query Parameters:**

- `page` (optional) - Page number for pagination
- `limit` (optional) - Items per page
- `search` (optional) - Search by name or email

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All users fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcd1",
      "name": "Karim Ahmed",
      "email": "karim@example.com",
      "role": "user",
      "phoneNumber": "+8801712345678",
      "isVerified": true,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "64a8f9c2b1234567890abcd2",
      "name": "Rahul Islam",
      "email": "rahul@example.com",
      "role": "carOwner",
      "phoneNumber": "+8801912345678",
      "isVerified": true,
      "createdAt": "2024-01-20T09:15:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

**Roles:** 🔒 Admin only

---

### 3. Get User by ID (GET)

**Endpoint:** `GET /v1/user/:id`

**Access:** ✅ Authenticated users (Can view own profile or admin can view any)

**Request Header:**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcd1",
    "name": "Karim Ahmed",
    "email": "karim@example.com",
    "role": "user",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary.com/...",
    "gender": "male",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Roles:** User (own profile) or 🔒 Admin

---

## Car APIs

### 1. Register Car (POST)

**Endpoint:** `POST /v1/car/`

**Access:** ✅ Authenticated users (Car owner registration)

**Request Type:** `multipart/form-data`

**Form Fields:**

- `data` (JSON string, required) - Car details as JSON string
- `images` (files array, required, 1-5 images) - Car photos
- `taxTokenPhoto` (file, required) - Tax token document
- `registrationCardPhoto` (file, required) - Registration card
- `drivingLicensePhoto` (file, required) - Driving license

**Data JSON Structure:**

```json
{
  "carName": "My Honda Civic",
  "features": {
    "vehicleType": "car",
    "brand": "Honda",
    "model": "Civic",
    "fuelType": "petrol",
    "gearType": "manual",
    "seatCapacity": 4,
    "manufactureYear": 2020
  },
  "vehicleRegistration": {
    "registrationNumber": "ABC-1234",
    "registration": 2020
  }
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Car registered successfully",
  "data": {
    "_id": "64a8f9d2b1234567890abcde",
    "owner": "64a8f9c2b1234567890abcd1",
    "carName": "My Honda Civic",
    "features": {
      "vehicleType": "car",
      "brand": "Honda",
      "model": "Civic",
      "fuelType": "petrol",
      "gearType": "manual",
      "seatCapacity": 4,
      "manufactureYear": 2020
    },
    "vehicleRegistration": {
      "registrationNumber": "ABC-1234",
      "registration": 2020
    },
    "images": ["https://cloudinary.com/...", "https://cloudinary.com/..."],
    "taxTokenPhoto": "https://cloudinary.com/...",
    "registrationCardPhoto": "https://cloudinary.com/...",
    "drivingLicensePhoto": "https://cloudinary.com/...",
    "status": "PENDING",
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** ✅ Car owner / Authenticated user

---

### 2. Get All Cars (GET) - Admin Only

**Endpoint:** `GET /v1/car/`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Query Parameters:**

- `page` (optional) - Pagination
- `limit` (optional) - Items per page
- `status` (optional) - Filter by status (PENDING, APPROVED, REJECTED)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All cars fetched successfully",
  "data": [
    {
      "_id": "64a8f9d2b1234567890abcde",
      "owner": {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Rahul Islam",
        "email": "rahul@example.com"
      },
      "carName": "My Honda Civic",
      "features": {
        "brand": "Honda",
        "model": "Civic",
        "seatCapacity": 4
      },
      "status": "PENDING"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

**Roles:** 🔒 Admin only

---

### 3. Get Approved Cars (GET)

**Endpoint:** `GET /v1/car/approved`

**Access:** Public (No authentication required)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Approved cars fetched successfully",
  "data": [
    {
      "_id": "64a8f9d2b1234567890abcde",
      "carName": "My Honda Civic",
      "owner": {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Rahul Islam",
        "phoneNumber": "+8801912345678"
      },
      "features": {
        "brand": "Honda",
        "model": "Civic",
        "fuelType": "petrol",
        "seatCapacity": 4,
        "manufacturYear": 2020
      },
      "images": ["https://cloudinary.com/...", "https://cloudinary.com/..."],
      "status": "APPROVED"
    }
  ]
}
```

**Roles:** Public

---

### 4. Get Car by ID (GET)

**Endpoint:** `GET /v1/car/:id`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car fetched successfully",
  "data": {
    "_id": "64a8f9d2b1234567890abcde",
    "owner": {
      "_id": "64a8f9c2b1234567890abcd1",
      "name": "Rahul Islam",
      "rating": 4.8
    },
    "carName": "My Honda Civic",
    "features": {
      "brand": "Honda",
      "model": "Civic",
      "fuelType": "petrol",
      "gearType": "manual",
      "seatCapacity": 4,
      "manufactureYear": 2020
    },
    "images": ["https://cloudinary.com/...", "https://cloudinary.com/..."],
    "status": "APPROVED"
  }
}
```

**Roles:** ✅ Authenticated users

---

### 5. Get Car by ID (Admin) (GET)

**Endpoint:** `GET /v1/car/admin/:id`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car fetched successfully",
  "data": {
    "_id": "64a8f9d2b1234567890abcde",
    "owner": {
      "_id": "64a8f9c2b1234567890abcd1",
      "name": "Rahul Islam",
      "email": "rahul@example.com"
    },
    "carName": "My Honda Civic",
    "features": {
      "brand": "Honda",
      "model": "Civic"
    },
    "taxTokenPhoto": "https://cloudinary.com/...",
    "registrationCardPhoto": "https://cloudinary.com/...",
    "drivingLicensePhoto": "https://cloudinary.com/...",
    "status": "PENDING",
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** 🔒 Admin only

---

### 6. Get All Car Registration Requests (GET) - Admin Only

**Endpoint:** `GET /v1/car/admin/registration/requests`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Query Parameters:**

- `page` (optional)
- `limit` (optional)
- `status` (optional) - PENDING, APPROVED, REJECTED

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car registration requests fetched successfully",
  "data": [
    {
      "_id": "64a8f9d2b1234567890abcde",
      "owner": {
        "name": "Rahul Islam",
        "email": "rahul@example.com"
      },
      "carName": "My Honda Civic",
      "status": "PENDING",
      "createdAt": "2024-03-09T10:30:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

**Roles:** 🔒 Admin only

---

### 7. Approve Car (PATCH)

**Endpoint:** `PATCH /v1/car/:id/approve`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car approved successfully",
  "data": {
    "_id": "64a8f9d2b1234567890abcde",
    "status": "APPROVED",
    "approvedAt": "2024-03-09T11:45:00Z"
  }
}
```

**Roles:** 🔒 Admin only

---

### 8. Update Car (PATCH)

**Endpoint:** `PATCH /v1/car/:id`

**Access:** ✅ Authenticated users (Car owner)

**Request Type:** `multipart/form-data`

**Form Fields:** Same as register car (data + optional files)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car updated successfully",
  "data": {
    "_id": "64a8f9d2b1234567890abcde",
    "carName": "My Updated Honda Civic",
    "features": {
      "brand": "Honda",
      "model": "Civic"
    }
  }
}
```

**Roles:** ✅ Car owner (own car only)

---

### 9. Delete Car (DELETE)

**Endpoint:** `DELETE /v1/car/:id`

**Access:** ✅ Authenticated users + 🔒 Admin only

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car deleted successfully",
  "data": null
}
```

**Roles:** 🔒 Admin only

---

## Ride APIs

### 1. Request a Ride (POST)

**Endpoint:** `POST /v1/ride/`

**Access:** ✅ Authenticated users

**Request Body:**

```json
{
  "startLocation": "Mirpur, Dhaka",
  "endLocation": "Gulshan, Dhaka",
  "date": "2026-03-15",
  "startTime": "09:00"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ride requested successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "user": "64a8f9c2b1234567890abcd1",
    "startLocation": "Mirpur, Dhaka",
    "endLocation": "Gulshan, Dhaka",
    "date": "2026-03-15",
    "startTime": "09:00",
    "status": "REQUESTED",
    "proposals": [],
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** ✅ Authenticated users (Passengers)

---

### 2. Get All Requested Rides (GET)

**Endpoint:** `GET /v1/ride/requested`

**Access:** ✅ Authenticated users + (🚗 Car owner OR 🔒 Admin)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Requested rides fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcde",
      "user": {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Karim Ahmed",
        "phoneNumber": "+8801712345678"
      },
      "startLocation": "Mirpur, Dhaka",
      "endLocation": "Gulshan, Dhaka",
      "date": "2026-03-15",
      "startTime": "09:00",
      "status": "REQUESTED",
      "createdAt": "2024-03-09T10:30:00Z"
    }
  ]
}
```

**Roles:** 🚗 Car owner (driver) / 🔒 Admin

---

### 3. Submit Ride Proposal (POST)

**Endpoint:** `POST /v1/ride/proposal`

**Access:** ✅ Authenticated users + 🚗 Car owner

**Request Body:**

```json
{
  "rideId": "64a8f9c2b1234567890abcde",
  "fare": "500"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal submitted successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "proposals": [
      {
        "_id": "64a8f9c2b1234567890abcdf",
        "driver": {
          "_id": "64a8f9c2b1234567890abcd2",
          "name": "Rahul Islam"
        },
        "fare": 500,
        "status": "PENDING",
        "submittedAt": "2024-03-09T10:45:00Z"
      }
    ]
  }
}
```

**Roles:** 🚗 Car owner (driver)

---

### 4. Accept Proposal (POST)

**Endpoint:** `POST /v1/ride/accept-proposal`

**Access:** ✅ Authenticated users

**Request Body:**

```json
{
  "rideId": "64a8f9c2b1234567890abcde",
  "proposalId": "64a8f9c2b1234567890abcdf"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal accepted successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "startLocation": "Mirpur, Dhaka",
    "endLocation": "Gulshan, Dhaka",
    "fare": 500,
    "driver": {
      "_id": "64a8f9c2b1234567890abcd2",
      "name": "Rahul Islam",
      "phoneNumber": "+8801912345678"
    },
    "status": "PENDING",
    "paymentDetails": {
      "amount": 500,
      "paymentMethod": "bkash",
      "adminBkashNumber": "+880XXXXXXXXXX",
      "instructions": "Send payment to admin bkash and submit transaction ID"
    }
  }
}
```

**Roles:** ✅ User (ride requester)

---

### 5. Get Ride Proposals (GET)

**Endpoint:** `GET /v1/ride/:rideId/proposals`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposals fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcdf",
      "driver": {
        "_id": "64a8f9c2b1234567890abcd2",
        "name": "Rahul Islam",
        "rating": 4.8
      },
      "fare": 500,
      "status": "PENDING",
      "message": "I can pick you up at 09:00",
      "submittedAt": "2024-03-09T10:45:00Z"
    },
    {
      "_id": "64a8f9c2b1234567890abce0",
      "driver": {
        "_id": "64a8f9c2b1234567890abcd3",
        "name": "Ahmed Khan",
        "rating": 4.5
      },
      "fare": 450,
      "status": "PENDING",
      "submittedAt": "2024-03-09T10:50:00Z"
    }
  ]
}
```

**Roles:** ✅ Authenticated users

---

### 6. Get Ride by ID (GET)

**Endpoint:** `GET /v1/ride/:rideId`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ride fetched successfully",
  "data": {
    "_id": "64a8f9c2b1234567890abcde",
    "user": {
      "_id": "64a8f9c2b1234567890abcd1",
      "name": "Karim Ahmed"
    },
    "driver": {
      "_id": "64a8f9c2b1234567890abcd2",
      "name": "Rahul Islam",
      "phoneNumber": "+8801912345678"
    },
    "startLocation": "Mirpur, Dhaka",
    "endLocation": "Gulshan, Dhaka",
    "date": "2026-03-15",
    "startTime": "09:00",
    "fare": 500,
    "status": "ACCEPTED",
    "payment": {
      "status": "PENDING",
      "amount": 500
    }
  }
}
```

**Roles:** ✅ Authenticated users

---

### 7. Get User Rides (GET)

**Endpoint:** `GET /v1/ride/list/user`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rides fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcde",
      "startLocation": "Mirpur, Dhaka",
      "endLocation": "Gulshan, Dhaka",
      "status": "ACCEPTED",
      "date": "2026-03-15",
      "startTime": "09:00"
    }
  ]
}
```

**Roles:** ✅ User (own rides)

---

## Return Trip APIs

### 1. Create Return Ride (POST)

**Endpoint:** `POST /v1/return-trip/`

**Access:** ✅ Authenticated users (Driver creates)

**Request Body:**

```json
{
  "startLocation": "Banani, Dhaka",
  "endLocation": "Airport, Dhaka",
  "date": "2026-03-20",
  "startTime": "18:00",
  "fare": 800
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Return ride created successfully",
  "data": {
    "_id": "64a8f9e2b1234567890abce1",
    "driver": "64a8f9c2b1234567890abcd2",
    "startLocation": "Banani, Dhaka",
    "endLocation": "Airport, Dhaka",
    "date": "2026-03-20",
    "startTime": "18:00",
    "fare": 800,
    "status": "AVAILABLE",
    "bookedPassengers": [],
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** ✅ Driver

---

### 2. Get All Return Rides (GET)

**Endpoint:** `GET /v1/return-trip/`

**Access:** ✅ Authenticated users

**Query Parameters:**

- `date` (optional) - Filter by date
- `startLocation` (optional) - Filter by start location
- `endLocation` (optional) - Filter by destination

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Return rides fetched successfully",
  "data": [
    {
      "_id": "64a8f9e2b1234567890abce1",
      "driver": {
        "_id": "64a8f9c2b1234567890abcd2",
        "name": "Rahul Islam",
        "rating": 4.8
      },
      "startLocation": "Banani, Dhaka",
      "endLocation": "Airport, Dhaka",
      "date": "2026-03-20",
      "startTime": "18:00",
      "fare": 800,
      "status": "AVAILABLE",
      "availableSeats": 3
    }
  ],
  "meta": {
    "total": 25,
    "page": 1
  }
}
```

**Roles:** ✅ Passengers (browse)

---

### 3. Get Return Ride by ID (GET)

**Endpoint:** `GET /v1/return-trip/:id`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Return ride fetched successfully",
  "data": {
    "_id": "64a8f9e2b1234567890abce1",
    "driver": {
      "_id": "64a8f9c2b1234567890abcd2",
      "name": "Rahul Islam",
      "phoneNumber": "+8801912345678",
      "rating": 4.8
    },
    "car": {
      "_id": "64a8f9d2b1234567890abcde",
      "carName": "Honda Civic",
      "model": "2020",
      "seatCapacity": 4
    },
    "startLocation": "Banani, Dhaka",
    "endLocation": "Airport, Dhaka",
    "date": "2026-03-20",
    "startTime": "18:00",
    "fare": 800,
    "status": "AVAILABLE",
    "bookedPassengers": [],
    "availableSeats": 4
  }
}
```

**Roles:** ✅ Passengers

---

### 4. Book Return Ride (POST)

**Endpoint:** `POST /v1/return-trip/:id/book`

**Access:** ✅ Authenticated users (Passenger)

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Return ride booked successfully",
  "data": {
    "_id": "64a8f9e2b1234567890abce1",
    "startLocation": "Banani, Dhaka",
    "endLocation": "Airport, Dhaka",
    "fare": 800,
    "status": "BOOKED",
    "bookedPassengers": [
      {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Karim Ahmed"
      }
    ],
    "paymentRequired": true,
    "paymentDetails": {
      "amount": 800,
      "paymentFor": "RETURN",
      "instructions": "Complete payment to confirm your booking"
    }
  }
}
```

**Roles:** ✅ Passenger

---

## Share Vehicle APIs

### 1. Create Share Vehicle (POST)

**Endpoint:** `POST /v1/share-vehicle/`

**Access:** ✅ Authenticated users + 🚗 Car owner

**Request Body:**

```json
{
  "carId": "64a8f9d2b1234567890abcde",
  "fromLocation": "Dhaka",
  "toLocation": "Chittagong",
  "departureDate": "2026-03-25",
  "departureTime": "08:00",
  "availableSeats": 3,
  "perSeatPrice": 400
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Share vehicle created successfully",
  "data": {
    "_id": "64a8f9f2b1234567890abce2",
    "driver": "64a8f9c2b1234567890abcd2",
    "car": {
      "_id": "64a8f9d2b1234567890abcde",
      "carName": "Honda Civic"
    },
    "fromLocation": "Dhaka",
    "toLocation": "Chittagong",
    "departureDate": "2026-03-25",
    "departureTime": "08:00",
    "availableSeats": 3,
    "perSeatPrice": 400,
    "status": "ACTIVE",
    "bookedPassengers": [],
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** 🚗 Car owner (driver)

---

### 2. Get Driver's Share Vehicles (GET)

**Endpoint:** `GET /v1/share-vehicle/driver`

**Access:** ✅ Authenticated users + 🚗 Car owner

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Share vehicles fetched successfully",
  "data": [
    {
      "_id": "64a8f9f2b1234567890abce2",
      "car": {
        "carName": "Honda Civic"
      },
      "fromLocation": "Dhaka",
      "toLocation": "Chittagong",
      "departureDate": "2026-03-25",
      "departureTime": "08:00",
      "availableSeats": 3,
      "perSeatPrice": 400,
      "status": "ACTIVE"
    }
  ]
}
```

**Roles:** 🚗 Car owner

---

### 3. Get Available Share Vehicles (GET)

**Endpoint:** `GET /v1/share-vehicle/available`

**Access:** Public (No authentication)

**Query Parameters:**

- `date` (optional) - Filter by date

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Share vehicles fetched successfully",
  "data": [
    {
      "_id": "64a8f9f2b1234567890abce2",
      "driver": {
        "_id": "64a8f9c2b1234567890abcd2",
        "name": "Rahul Islam",
        "rating": 4.8
      },
      "car": {
        "carName": "Honda Civic",
        "model": "2020"
      },
      "fromLocation": "Dhaka",
      "toLocation": "Chittagong",
      "departureDate": "2026-03-25",
      "departureTime": "08:00",
      "availableSeats": 3,
      "perSeatPrice": 400,
      "status": "ACTIVE"
    }
  ]
}
```

**Roles:** Public

---

### 4. Get Share Vehicle by ID (GET)

**Endpoint:** `GET /v1/share-vehicle/:id`

**Access:** Public (No authentication)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Share vehicle fetched successfully",
  "data": {
    "_id": "64a8f9f2b1234567890abce2",
    "driver": {
      "_id": "64a8f9c2b1234567890abcd2",
      "name": "Rahul Islam",
      "phoneNumber": "+8801912345678",
      "rating": 4.8
    },
    "car": {
      "carName": "Honda Civic",
      "model": "2020",
      "features": {
        "seatCapacity": 4,
        "fuelType": "petrol"
      }
    },
    "fromLocation": "Dhaka",
    "toLocation": "Chittagong",
    "departureDate": "2026-03-25",
    "departureTime": "08:00",
    "availableSeats": 3,
    "perSeatPrice": 400,
    "totalRevenue": 1200,
    "status": "ACTIVE"
  }
}
```

**Roles:** Public

---

## Share Vehicle Booking APIs

### 1. Create Booking (POST)

**Endpoint:** `POST /v1/share-vehicle-booking/`

**Access:** ✅ Authenticated users (Passenger)

**Request Body:**

```json
{
  "shareVehicleId": "64a8f9f2b1234567890abce2",
  "numberOfSeats": 1,
  "totalPrice": 400
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Booking created successfully",
  "data": {
    "_id": "64a8fa02b1234567890abce3",
    "passenger": "64a8f9c2b1234567890abcd1",
    "shareVehicle": "64a8f9f2b1234567890abce2",
    "numberOfSeats": 1,
    "totalPrice": 400,
    "status": "PENDING",
    "createdAt": "2024-03-09T10:45:00Z"
  }
}
```

**Roles:** ✅ Passenger

---

### 2. Get User Bookings (GET)

**Endpoint:** `GET /v1/share-vehicle-booking/my-bookings`

**Access:** ✅ Authenticated users + 🔒 Admin

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User bookings fetched successfully",
  "data": [
    {
      "_id": "64a8fa02b1234567890abce3",
      "shareVehicle": {
        "_id": "64a8f9f2b1234567890abce2",
        "driver": {
          "name": "Rahul Islam"
        },
        "fromLocation": "Dhaka",
        "toLocation": "Chittagong",
        "departureDate": "2026-03-25"
      },
      "numberOfSeats": 1,
      "totalPrice": 400,
      "status": "PENDING"
    }
  ]
}
```

**Roles:** ✅ User (own bookings) / 🔒 Admin

---

### 3. Get Active User Bookings (GET)

**Endpoint:** `GET /v1/share-vehicle-booking/my-active-bookings`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Active bookings fetched successfully",
  "data": [
    {
      "_id": "64a8fa02b1234567890abce3",
      "shareVehicle": {
        "fromLocation": "Dhaka",
        "toLocation": "Chittagong",
        "departureDate": "2026-03-25",
        "departureTime": "08:00"
      },
      "numberOfSeats": 1,
      "totalPrice": 400,
      "status": "CONFIRMED"
    }
  ]
}
```

**Roles:** ✅ User

---

### 4. Get Vehicle Bookings (GET)

**Endpoint:** `GET /v1/share-vehicle-booking/vehicle/:shareVehicleId`

**Access:** ✅ Authenticated users + 🚗 Car owner

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vehicle bookings fetched successfully",
  "data": [
    {
      "_id": "64a8fa02b1234567890abce3",
      "passenger": {
        "_id": "64a8f9c2b1234567890abcd1",
        "name": "Karim Ahmed",
        "phoneNumber": "+8801712345678"
      },
      "numberOfSeats": 1,
      "totalPrice": 400,
      "status": "PENDING"
    }
  ]
}
```

**Roles:** 🚗 Car owner (own vehicle)

---

### 5. Get Confirmed Bookings (GET)

**Endpoint:** `GET /v1/share-vehicle-booking/vehicle/:shareVehicleId/confirmed`

**Access:** ✅ Authenticated users + 🚗 Car owner

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Confirmed bookings fetched successfully",
  "data": [
    {
      "_id": "64a8fa02b1234567890abce3",
      "passenger": {
        "name": "Karim Ahmed",
        "phoneNumber": "+8801712345678"
      },
      "numberOfSeats": 1,
      "totalPrice": 400,
      "status": "CONFIRMED"
    }
  ]
}
```

**Roles:** 🚗 Car owner

---

### 6. Get Booking by ID (GET)

**Endpoint:** `GET /v1/share-vehicle-booking/:id`

**Access:** Public (No authentication)

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking fetched successfully",
  "data": {
    "_id": "64a8fa02b1234567890abce3",
    "passenger": {
      "_id": "64a8f9c2b1234567890abcd1",
      "name": "Karim Ahmed"
    },
    "shareVehicle": {
      "fromLocation": "Dhaka",
      "toLocation": "Chittagong",
      "departureDate": "2026-03-25"
    },
    "numberOfSeats": 1,
    "totalPrice": 400,
    "totalFare": 400,
    "status": "PENDING"
  }
}
```

**Roles:** Public

---

### 7. Confirm Booking (PATCH)

**Endpoint:** `PATCH /v1/share-vehicle-booking/:id/confirm`

**Access:** ✅ Authenticated users + 🔒 Admin

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking confirmed successfully",
  "data": {
    "booking": {
      "_id": "64a8fa02b1234567890abce3",
      "status": "CONFIRMED"
    },
    "paymentRequired": true,
    "paymentDetails": {
      "amount": 400,
      "paymentFor": "SHARE_VEHICLE",
      "message": "Please proceed to payment to confirm your booking"
    }
  }
}
```

**Roles:** 🔒 Admin

---

### 8. Cancel Booking (PATCH)

**Endpoint:** `PATCH /v1/share-vehicle-booking/:id/cancel`

**Access:** ✅ Authenticated users

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "64a8fa02b1234567890abce3",
    "status": "CANCELLED",
    "cancelledAt": "2024-03-09T11:00:00Z"
  }
}
```

**Roles:** ✅ User (own booking)

---

## Share Vehicle Fare Config APIs

### 1. Get All Fare Configurations (GET)

**Endpoint:** `GET /v1/share-vehicle-fare/`

**Access:** ✅ Authenticated users + 🔒 Admin

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fare configurations retrieved successfully",
  "data": [
    {
      "_id": "64a8fa12b1234567890abce4",
      "fromLocation": "Dhaka",
      "toLocation": "Chittagong",
      "perSeatFare": 400,
      "createdAt": "2024-02-01T10:00:00Z"
    },
    {
      "_id": "64a8fa12b1234567890abce5",
      "fromLocation": "Dhaka",
      "toLocation": "Sylhet",
      "perSeatFare": 500,
      "createdAt": "2024-02-01T10:00:00Z"
    }
  ]
}
```

**Roles:** 🔒 Admin

---

### 2. Create Fare Configuration (POST)

**Endpoint:** `POST /v1/share-vehicle-fare/`

**Access:** ✅ Authenticated users + 🔒 Admin

**Request Body:**

```json
{
  "fromLocation": "Dhaka",
  "toLocation": "Khulna",
  "perSeatFare": 350
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fare configuration set successfully",
  "data": {
    "_id": "64a8fa12b1234567890abce6",
    "fromLocation": "Dhaka",
    "toLocation": "Khulna",
    "perSeatFare": 350,
    "createdAt": "2024-03-09T10:30:00Z"
  }
}
```

**Roles:** 🔒 Admin

---

### 3. Get Fare by Route (GET)

**Endpoint:** `GET /v1/share-vehicle-fare/:fromLocation/:toLocation`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fare retrieved successfully",
  "data": {
    "perSeatFare": 400
  }
}
```

**Roles:** ✅ Authenticated users

---

### 4. Get Locations List (GET)

**Endpoint:** `GET /v1/share-vehicle-fare/locations-list`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Locations list retrieved successfully",
  "data": ["Dhaka", "Chittagong", "Sylhet", "Khulna", "Barishal", "Rajshahi"]
}
```

**Roles:** ✅ Authenticated users

---

### 5. Update Fare Configuration (PUT)

**Endpoint:** `PUT /v1/share-vehicle-fare/:id`

**Access:** ✅ Authenticated users + 🔒 Admin

**Request Body:**

```json
{
  "fromLocation": "Dhaka",
  "toLocation": "Khulna",
  "perSeatFare": 380
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fare configuration updated successfully",
  "data": {
    "_id": "64a8fa12b1234567890abce6",
    "fromLocation": "Dhaka",
    "toLocation": "Khulna",
    "perSeatFare": 380,
    "updatedAt": "2024-03-09T11:30:00Z"
  }
}
```

**Roles:** 🔒 Admin

---

### 6. Delete Fare Configuration (DELETE)

**Endpoint:** `DELETE /v1/share-vehicle-fare/:id`

**Access:** ✅ Authenticated users + 🔒 Admin

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fare configuration deleted successfully",
  "data": null
}
```

**Roles:** 🔒 Admin

---

## Payment APIs

### 1. Submit Payment (POST)

**Endpoint:** `POST /v1/payment/submit`

**Access:** ✅ Authenticated users

**Request Body (For Ride):**

```json
{
  "rideId": "64a8f9c2b1234567890abcde",
  "transactionId": "TXN123456789"
}
```

**Request Body (For Return Trip):**

```json
{
  "returnId": "64a8f9e2b1234567890abce1",
  "transactionId": "TXN123456789"
}
```

**Request Body (For Share Vehicle Booking):**

```json
{
  "shareVehicleBookingId": "64a8fa02b1234567890abce3",
  "transactionId": "TXN123456789"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment submitted successfully",
  "data": {
    "payment": {
      "_id": "64a8fa22b1234567890abce7",
      "transactionId": "TXN123456789",
      "amount": 500,
      "paymentMethod": "bkash",
      "status": "PENDING",
      "submittedAt": "2024-03-09T12:30:00Z"
    },
    "paymentDetails": {
      "amount": 500,
      "paymentFor": "RIDE"
    }
  }
}
```

**Roles:** ✅ User (passenger)

---

### 2. Approve/Reject Payment (POST)

**Endpoint:** `POST /v1/payment/approve/:paymentId`

**Access:** ✅ Authenticated users + 🔒 Admin

**Request Body:**

```json
{
  "approved": true,
  "rejectionReason": null
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment approved successfully",
  "data": {
    "_id": "64a8fa22b1234567890abce7",
    "transactionId": "TXN123456789",
    "amount": 500,
    "status": "APPROVED",
    "approvedAt": "2024-03-09T12:45:00Z",
    "approvedBy": "admin@example.com"
  }
}
```

**Response for Rejection:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "64a8fa22b1234567890abce7",
    "transactionId": "TXN123456789",
    "amount": 500,
    "status": "REJECTED",
    "rejectionReason": "Transaction ID not found",
    "rejectedAt": "2024-03-09T12:45:00Z"
  }
}
```

**Roles:** 🔒 Admin

---

### 3. Get All Pending Payments (GET)

**Endpoint:** `GET /v1/payment/pending/all`

**Access:** ✅ Authenticated users + 🔒 Admin

**Response (Success - 200):**

```json
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
        "name": "Rahul Islam"
      },
      "rideDetails": {
        "startLocation": "Dhaka",
        "endLocation": "Chittagong",
        "fare": 500
      },
      "payment": {
        "_id": "64a8fa22b1234567890abce7",
        "transactionId": "TXN123456789",
        "amount": 500,
        "status": "PENDING",
        "submittedAt": "2024-03-09T12:30:00Z"
      }
    }
  ]
}
```

**Roles:** 🔒 Admin

---

### 4. Get Pending Payments by Type (GET)

**Endpoint:** `GET /v1/payment/pending/:paymentFor`

**Access:** ✅ Authenticated users + 🔒 Admin

**URL Params:** `paymentFor` = "RIDE" | "RETURN" | "SHARE_VEHICLE"

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pending payments of type RIDE fetched successfully",
  "data": [
    {
      "_id": "64a8f9c2b1234567890abcde",
      "payment": {
        "_id": "64a8fa22b1234567890abce7",
        "status": "PENDING",
        "amount": 500
      }
    }
  ]
}
```

**Roles:** 🔒 Admin

---

## Notification APIs

### 1. Get User Notifications (GET)

**Endpoint:** `GET /v1/notification/` or `GET /v1/notification`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User notifications fetched successfully",
  "data": [
    {
      "_id": "64a8fa32b1234567890abce8",
      "user": "64a8f9c2b1234567890abcd1",
      "title": "Proposal Submitted",
      "message": "Rahul Islam submitted a proposal of 500 BDT for your ride",
      "type": "PROPOSAL",
      "isRead": false,
      "createdAt": "2024-03-09T10:45:00Z"
    },
    {
      "_id": "64a8fa32b1234567890abce9",
      "user": "64a8f9c2b1234567890abcd1",
      "title": "Payment Approved",
      "message": "Your payment of 500 BDT has been approved",
      "type": "PAYMENT",
      "isRead": false,
      "createdAt": "2024-03-09T12:45:00Z"
    }
  ]
}
```

**Roles:** ✅ User (own notifications)

---

### 2. Get Unread Count (GET)

**Endpoint:** `GET /v1/notification/unread-count`

**Access:** ✅ Authenticated users

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unread count fetched successfully",
  "data": {
    "unreadCount": 5
  }
}
```

**Roles:** ✅ User

---

### 3. Mark Notification as Read (PATCH)

**Endpoint:** `PATCH /v1/notification/mark-as-read/:id`

**Access:** ✅ Authenticated users

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification marked as read successfully",
  "data": {
    "_id": "64a8fa32b1234567890abce8",
    "isRead": true,
    "readAt": "2024-03-09T13:00:00Z"
  }
}
```

**Roles:** ✅ User

---

### 4. Mark All Notifications as Read (PATCH)

**Endpoint:** `PATCH /v1/notification/mark-all-as-read`

**Access:** ✅ Authenticated users

**Request Body:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All notifications marked as read successfully",
  "data": {
    "modifiedCount": 5
  }
}
```

**Roles:** ✅ User

---

## Error Response Format

All endpoints follow this error response format:

**Response (Error - 400/401/403/404/500):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descriptive error message",
  "data": null
}
```

---

## Authentication Notes

- **Access Token:** JWT token received after sign-in. Valid for ~1 hour.
- **Refresh Token:** Used to get new access token. Valid for ~30 days.
- **Bearer Token Format:** `Authorization: Bearer <accessToken>`
- **OTP Verification:** Temporary verify token sent via email during registration.

---

## Role-Based Access Summary

| Role          | Permissions                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| **Public**    | Browse cars, share vehicles, verify app features                                |
| **User**      | Request rides, book return trips, submit payments, view notifications           |
| **Car Owner** | Register car, submit proposals, create return trips, manage bookings            |
| **Admin**     | Approve/reject cars, approve/reject payments, manage users, manage fare configs |

---

## Common Status Values

**Ride Status:** REQUESTED → PENDING → ACCEPTED → COMPLETED
**Car Status:** PENDING → APPROVED / REJECTED
**Payment Status:** PENDING → APPROVED / REJECTED
**Booking Status:** PENDING → CONFIRMED → COMPLETED / CANCELLED

---

**Document Created:** 2024-03-09
**API Version:** v1
**Base URL:** `/api/v1`
