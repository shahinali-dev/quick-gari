# QuickGari API Documentation

## Base URL

```
{{BASE_URL}} = http://localhost:5000 (development) | https://api.quickgari.com (production)
```

---

# 1. Authentication Module

## 1.1 User Registration

**Endpoint**

```
POST {{BASE_URL}}/api/v1/user/register
```

**Headers**

```
Content-Type: multipart/form-data (for avatar upload)
x-client-type: web | mobile (optional, affects token delivery method)
```

**Form Data**

```
{
  name: string;           // required, minimum 1 character
  email: string;          // required, must be a valid email
  password: string;       // required, minimum 8 characters
  gender: "male" | "female";  // required (only these 2 options available)
  phoneNumber?: string;   // optional
  avatar?: File;          // optional, image file for upload
}
```

**Request Body Example**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "gender": "male",
  "phoneNumber": "+8801712345678",
  "avatar": "<file>"
}
```

**Response (Success - 201)**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary-url.com/avatar.jpg",
    "role": "user",
    "isCarOwner": false,
    "isVerified": false,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:30:00Z"
  }
}
```

**Process Flow**

1. User submits registration form
2. Avatar is uploaded to Cloudinary (if provided)
3. User account created with `isVerified: false`
4. OTP sent to registered email
5. If client is "web": verification token sent in HTTP-only cookie
6. User must verify OTP before login

**Validation Rules**

- Email must be unique
- Password minimum 8 characters
- Gender must be either "male" or "female"
- Rate limiting: Maximum registrations per IP (configured in `registrationLimiter`)

---

## 1.2 OTP Verification

**Endpoint**

```
POST {{BASE_URL}}/api/v1/auth/verify-otp
```

**Headers**

```
Content-Type: application/json
Authorization: Bearer <verifyToken> (from registration or cookies)
```

**Request Payload**

```json
{
  "otp": "123456" // 6-digit OTP sent to email
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully",
  "data": {
    "email": "john@example.com",
    "isVerified": true
  }
}
```

**Error Response Examples**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP format. Must be 6 digits"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "OTP has expired. Please request a new one"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP. 2 attempts remaining"
}
```

**Security Features**

- OTP is hashed - not stored in plain text
- Device fingerprinting: OTP must be verified from same device
- Max 5 attempts allowed
- 30-minute account block after 5 failed attempts
- OTP expiry: 15 minutes
- Timing-safe comparison to prevent timing attacks

**OTP Configuration**

```
Max Attempts: 5
Block Duration: 30 minutes
Expiry Duration: 15 minutes
OTP Length: 6 digits
Resend Cooldown: 60 seconds
```

---

## 1.3 Resend OTP

**Endpoint**

```
POST {{BASE_URL}}/api/v1/auth/resend-otp
```

**Headers**

```
Content-Type: application/json
Authorization: Bearer <verifyToken>
```

**Request Payload**

```json
{} // No body required
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent successfully",
  "data": {
    "email": "john@example.com"
  }
}
```

**Error Response Examples**

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Please wait 45 seconds before requesting another OTP"
}
```

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Account temporarily blocked. Try again after 28 minutes"
}
```

**Important Notes**

- Resend cooldown: 60 seconds between requests
- Cannot resend if already verified
- Respects device fingerprinting rules
- Rate limited via `otpResendLimiter` middleware

---

## 1.4 User Login

**Endpoint**

```
POST {{BASE_URL}}/api/v1/auth/signin
```

**Headers**

```
Content-Type: application/json
```

**Request Payload**

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary-url.com/avatar.jpg",
    "role": "user",
    "isCarOwner": false,
    "isVerified": true,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  },
  "token": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid email"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid email or password"
}
```

**Prerequisites**

- User must have registered previously
- Email must be verified (OTP verified)
- Account must not be blocked

**Token Information**

- Access Token: Used for API requests
- Refresh Token: Used to get new access token when expired
- Both are JWT tokens
- Store tokens securely on client

---

## 1.5 Get Authenticated User Info

**Endpoint**

```
GET {{BASE_URL}}/api/v1/auth/user-info
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User info fetched successfully",
  "data": {
    "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary-url.com/avatar.jpg",
    "role": "user",
    "isCarOwner": false,
    "isVerified": true,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  }
}
```

---

## 1.6 Refresh Access Token

**Endpoint**

```
POST {{BASE_URL}}/api/v1/auth/refresh
```

**Headers**

```
Content-Type: application/json
```

**Request Payload**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Refresh token is required"
}
```

```json
{
  "success": false,
  "statusCode": 401,
  "message": "User not found. Please login again"
}
```

---

# 2. User Management Module

## 2.1 Get User by ID

**Endpoint**

```
GET {{BASE_URL}}/api/v1/user/:id
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully",
  "data": {
    "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "phoneNumber": "+8801712345678",
    "avatar": "https://cloudinary-url.com/avatar.jpg",
    "role": "user",
    "isCarOwner": false,
    "isVerified": true,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  }
}
```

**Access Control**

- Admin: Can fetch any user
- User: Can only fetch their own profile

---

## 2.2 Get All Users (Admin Only)

**Endpoint**

```
GET {{BASE_URL}}/api/v1/user/users
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
```

**Query Parameters**

```
page?: number         // default: 1
limit?: number        // default: 10
sort?: string         // field to sort by
search?: string       // search by name or email
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All users fetched successfully",
  "data": [
    {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "name": "John Doe",
      "email": "john@example.com",
      "gender": "male",
      "role": "user",
      "isCarOwner": false,
      "isVerified": true,
      "createdAt": "2024-04-10T10:30:00Z"
    },
    {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "gender": "female",
      "role": "car_owner",
      "isCarOwner": true,
      "isVerified": true,
      "createdAt": "2024-04-09T15:20:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPage": 1
  }
}
```

---

## 2.3 User Roles

The system has three roles:

| Role          | Description   | Permissions                                       |
| ------------- | ------------- | ------------------------------------------------- |
| **user**      | Regular user  | Can request rides, use share vehicles             |
| **car_owner** | Car owner     | Can register & manage cars, submit ride proposals |
| **admin**     | Administrator | Full access, approve cars, manage payments        |

---

# 3. Car Module

## 3.1 Register Car

**Endpoint**

```
POST {{BASE_URL}}/api/v1/car
```

**Headers**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Form Data Structure**

```
data: JSON string (see below)
images: Array of files (1-5 car photos)
taxTokenPhoto: Single file
registrationCardPhoto: Single file
drivingLicensePhoto: Single file
```

**Request Body (data field - JSON string)**

```json
{
  "carName": "My Toyota Corolla 2022",
  "features": {
    "vehicleType": "Sedan",
    "model": "Corolla",
    "brand": "Toyota",
    "fuelType": "Petrol",
    "gearType": "Automatic",
    "seatCapacity": 5,
    "manufactureYear": 2022
  },
  "vehicleRegistration": {
    "registrationNumber": "DHAKA-02-4567",
    "registration": 2022
  }
}
```

**Response (Success - 201)**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Car registered successfully",
  "data": {
    "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
    "carName": "My Toyota Corolla 2022",
    "features": {
      "vehicleType": "Sedan",
      "model": "Corolla",
      "brand": "Toyota",
      "fuelType": "Petrol",
      "gearType": "Automatic",
      "seatCapacity": 5,
      "manufactureYear": 2022,
      "images": [
        "https://cloudinary.com/car1.jpg",
        "https://cloudinary.com/car2.jpg"
      ]
    },
    "vehicleRegistration": {
      "registrationNumber": "DHAKA-02-4567",
      "registration": 2022,
      "taxTokenPhoto": "https://cloudinary.com/tax.jpg",
      "registrationCardPhoto": "https://cloudinary.com/reg.jpg"
    },
    "drivingLicensePhoto": "https://cloudinary.com/license.jpg",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "isApproved": false,
    "isDeleted": false,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:30:00Z"
  }
}
```

**Validation Rules**

- At least 1 car image required (max 5)
- Tax token photo required
- Registration card photo required
- Driving license photo required
- All years cannot exceed current year (2026)
- Manufacture year minimum: 1900
- Registration year minimum: 1900

**Vehicle Types Available**

```
Sedan, SUV, Hatchback, Convertible, Coupe, Pickup,
Minivan, Crossover, Van, Truck, Bus
```

**Fuel Types Available**

```
Petrol, Diesel, Hybrid, Electric
```

**Gear Types Available**

```
Manual, Automatic
```

**Important Notes**

- Car starts with `isApproved: false`
- Admin must approve car before it's available for rides
- Owner must be verified user
- All document uploads go to Cloudinary

---

## 3.2 Approve Car (Admin Only)

**Endpoint**

```
PATCH {{BASE_URL}}/api/v1/car/:id/approve
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car approved successfully",
  "data": {
    "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
    "carName": "My Toyota Corolla 2022",
    "features": { ... },
    "vehicleRegistration": { ... },
    "drivingLicensePhoto": "...",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "isApproved": true,
    "isDeleted": false,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  }
}
```

---

## 3.3 Get Approved Cars

**Endpoint**

```
GET {{BASE_URL}}/api/v1/car/approved
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Approved cars fetched successfully",
  "data": [
    {
      "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
      "carName": "My Toyota Corolla 2022",
      "features": { ... },
      "vehicleRegistration": { ... },
      "drivingLicensePhoto": "...",
      "user": {
        "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "isApproved": true,
      "isDeleted": false
    }
  ]
}
```

---

## 3.4 Get Car by ID

**Endpoint**

```
GET {{BASE_URL}}/api/v1/car/:id
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Car fetched successfully",
  "data": {
    "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
    "carName": "My Toyota Corolla 2022",
    "features": { ... },
    "vehicleRegistration": { ... },
    "drivingLicensePhoto": "...",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "isApproved": true,
    "isDeleted": false,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  }
}
```

---

## 3.5 Get All Cars (Admin Only)

**Endpoint**

```
GET {{BASE_URL}}/api/v1/car
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
```

**Query Parameters**

```
page?: number
limit?: number
sort?: string
search?: string
isApproved?: boolean
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All cars fetched successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPage": 3
  }
}
```

---

# 4. Ride Module

## 4.1 Complete Ride Workflow

```
1. User creates ride request (POST /ride)
2. Car owners receive notification
3. Car owners view available rides (GET /ride/requested)
4. Car owners submit proposals/bids (POST /ride/proposal)
5. User views all proposals (GET /ride/:rideId/proposals)
6. User accepts one proposal (POST /ride/accept-proposal)
   - Ride moves to PENDING state
   - Selected driver & car assigned
   - Other proposals auto-rejected
7. User submits payment (POST /payment/submit)
   - User transfers via bKash
   - Submits transaction ID
8. Payment status: PENDING → APPROVED (Admin verification)
   - Ride status: PENDING → ACCEPTED
   - Driver can start ride
9. Ride completed
```

---

## 4.2 Create Ride Request

**Endpoint**

```
POST {{BASE_URL}}/api/v1/ride
```

**Headers**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Payload**

```json
{
  "startLocation": "Gulshan, Dhaka",
  "endLocation": "Mirpur, Dhaka",
  "date": "2024-04-15",
  "startTime": "10:30",
  "distance": 12
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ride requested successfully",
  "data": {
    "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "startLocation": "Gulshan, Dhaka",
    "endLocation": "Mirpur, Dhaka",
    "distance": 12,
    "date": "2024-04-15T00:00:00Z",
    "startTime": "2024-04-15T10:30:00Z",
    "proposals": [],
    "status": "REQUESTED",
    "payment": null,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:30:00Z"
  }
}
```

**Validation Rules**

- Start location required (min 1 character)
- End location required (min 1 character)
- Date required (ISO format)
- Start time required (ISO format)
- Cannot request ride in the past
- Same user cannot request duplicate ride (same date & time)

**Ride Status Transitions**

```
REQUESTED → PENDING (when proposal accepted)
PENDING → ACCEPTED (when payment approved)
ACCEPTED → COMPLETED (when ride completes)
PENDING/ACCEPTED → CANCELLED (user cancels)
REQUESTED → REJECTED (no drivers interested)
```

---

## 4.3 Get All Requested Rides (Car Owner / Admin)

**Endpoint**

```
GET {{BASE_URL}}/api/v1/ride/requested
```

**Headers**

```
Authorization: Bearer <carOwnerAccessToken> OR <adminAccessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Requested rides fetched successfully",
  "data": [
    {
      "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
      "user": {
        "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+8801712345678"
      },
      "startLocation": "Gulshan, Dhaka",
      "endLocation": "Mirpur, Dhaka",
      "distance": 12,
      "date": "2024-04-15T00:00:00Z",
      "startTime": "2024-04-15T10:30:00Z",
      "proposals": [],
      "status": "REQUESTED",
      "createdAt": "2024-04-10T10:30:00Z"
    }
  ]
}
```

**Use Case**

- Car owners check this to see available rides
- Filter for rides they can fulfill
- Decide whether to submit a proposal

---

## 4.4 Submit Proposal (Car Owner)

**Endpoint**

```
POST {{BASE_URL}}/api/v1/ride/proposal
```

**Headers**

```
Authorization: Bearer <carOwnerAccessToken>
Content-Type: application/json
```

**Request Payload**

```json
{
  "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
  "fare": 350
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal submitted successfully",
  "data": {
    "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "startLocation": "Gulshan, Dhaka",
    "endLocation": "Mirpur, Dhaka",
    "proposals": [
      {
        "_id": "64f5a4b2c3d4e5f6g7h8i9j0",
        "driver": "64f5a1b2c3d4e5f6g7h8i9j1",
        "car": "64f5a2b2c3d4e5f6g7h8i9j0",
        "fare": 350,
        "createdAt": "2024-04-10T10:35:00Z"
      }
    ],
    "status": "REQUESTED",
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:35:00Z"
  }
}
```

**Validation Rules**

- Ride must be in REQUESTED status
- Only car owners can submit
- Fare must be positive number
- One driver can submit only one proposal per ride

**Access Check**

- User must have role: car_owner
- User must have at least one approved car

---

## 4.5 Get Ride Proposals (User)

**Endpoint**

```
GET {{BASE_URL}}/api/v1/ride/:rideId/proposals
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposals fetched successfully",
  "data": [
    {
      "_id": "64f5a4b2c3d4e5f6g7h8i9j0",
      "driver": {
        "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
        "name": "Ahmed Hassan",
        "email": "ahmed@example.com"
      },
      "car": {
        "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
        "carName": "Toyota Corolla 2022",
        "features": {
          "brand": "Toyota",
          "model": "Corolla"
        }
      },
      "fare": 350,
      "createdAt": "2024-04-10T10:35:00Z"
    },
    {
      "_id": "64f5a4b2c3d4e5f6g7h8i9j1",
      "driver": {
        "_id": "64f5a1b2c3d4e5f6g7h8i9j2",
        "name": "Fatima Khan",
        "email": "fatima@example.com"
      },
      "car": {
        "_id": "64f5a2b2c3d4e5f6g7h8i9j1",
        "carName": "Honda Civic 2023",
        "features": {
          "brand": "Honda",
          "model": "Civic"
        }
      },
      "fare": 400,
      "createdAt": "2024-04-10T10:40:00Z"
    }
  ]
}
```

**Access Control**

- Only ride owner (user) can view proposals for their ride

---

## 4.6 Accept Proposal (User)

**Endpoint**

```
POST {{BASE_URL}}/api/v1/ride/accept-proposal
```

**Headers**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Payload**

```json
{
  "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
  "proposalId": "64f5a4b2c3d4e5f6g7h8i9j0"
}
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Proposal accepted successfully",
  "data": {
    "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
    "user": "64f5a1b2c3d4e5f6g7h8i9j0",
    "driver": "64f5a1b2c3d4e5f6g7h8i9j1",
    "car": "64f5a2b2c3d4e5f6g7h8i9j0",
    "startLocation": "Gulshan, Dhaka",
    "endLocation": "Mirpur, Dhaka",
    "distance": 12,
    "date": "2024-04-15T00:00:00Z",
    "startTime": "2024-04-15T10:30:00Z",
    "fare": 350,
    "proposals": [
      {
        "_id": "64f5a4b2c3d4e5f6g7h8i9j0",
        "driver": "64f5a1b2c3d4e5f6g7h8i9j1",
        "car": "64f5a2b2c3d4e5f6g7h8i9j0",
        "fare": 350,
        "status": "ACCEPTED"
      }
    ],
    "status": "PENDING",
    "payment": null,
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:45:00Z"
  }
}
```

**What Happens**

- Ride status changes: REQUESTED → PENDING
- Driver & car assigned to ride
- Fare locked at proposed amount
- All other proposals auto-rejected
- Selected driver notified
- User can now proceed to payment

---

## 4.7 Get Ride Details

**Endpoint**

```
GET {{BASE_URL}}/api/v1/ride/:rideId
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ride fetched successfully",
  "data": {
    "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
    "user": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "driver": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com"
    },
    "car": {
      "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
      "carName": "Toyota Corolla 2022",
      "features": {
        "brand": "Toyota",
        "model": "Corolla",
        "seatCapacity": 5
      }
    },
    "startLocation": "Gulshan, Dhaka",
    "endLocation": "Mirpur, Dhaka",
    "distance": 12,
    "date": "2024-04-15T00:00:00Z",
    "startTime": "2024-04-15T10:30:00Z",
    "fare": 350,
    "status": "PENDING",
    "payment": {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
      "transactionId": "bkash123456",
      "amount": 350,
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:00:00Z"
    },
    "createdAt": "2024-04-10T10:30:00Z",
    "updatedAt": "2024-04-10T10:45:00Z"
  }
}
```

---

## 4.8 Get User Ride List

**Endpoint**

```
GET {{BASE_URL}}/api/v1/ride/list/user
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Rides fetched successfully",
  "data": [
    {
      "_id": "64f5a3b2c3d4e5f6g7h8i9j0",
      "startLocation": "Gulshan, Dhaka",
      "endLocation": "Mirpur, Dhaka",
      "distance": 12,
      "date": "2024-04-15T00:00:00Z",
      "startTime": "2024-04-15T10:30:00Z",
      "fare": 350,
      "status": "ACCEPTED",
      "driver": {
        "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
        "name": "Ahmed Hassan"
      },
      "car": {
        "_id": "64f5a2b2c3d4e5f6g7h8i9j0",
        "carName": "Toyota Corolla 2022"
      },
      "createdAt": "2024-04-10T10:30:00Z"
    }
  ]
}
```

**Use Case**

- User views history of all their rides
- Check status of current/past rides
- View driver & car details

---

# 5. Payment Module

## 5.1 Complete Payment Workflow

```
Flow for Ride Payment (similar for Return & Share Vehicle):

1. User accepts ride proposal
   - Ride status: PENDING
   - Payment: null

2. User initiates payment (POST /payment/submit)
   - User transfers exact fare via bKash (Send Money)
   - User gets transaction ID (receipt number)
   - Submits transaction ID to system
   - Payment created with status: PENDING

3. Admin receives notification
   - Views pending payments

4. Admin verifies bKash transaction
   - Checks transaction ID
   - Confirms amount & sender

5. Admin approves payment (POST /payment/approve/:paymentId)
   - Payment status: APPROVED
   - Ride status: PENDING → ACCEPTED
   - Driver notified to start journey

6. If admin rejects (fraudulent/mismatched):
   - Payment status: REJECTED
   - Ride resets (driver/car assignment cleared)
   - User must resubmit/retry
```

---

## 5.2 Submit Payment

**Endpoint**

```
POST {{BASE_URL}}/api/v1/payment/submit
```

**Headers**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Payload**

```json
{
  "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
  "transactionId": "TXN1234567890"
}
```

**OR (for return ride)**

```json
{
  "returnId": "64f5a3b2c3d4e5f6g7h8i9j1",
  "transactionId": "TXN1234567891"
}
```

**OR (for share vehicle booking)**

```json
{
  "shareVehicleBookingId": "64f5a3b2c3d4e5f6g7h8i9j2",
  "transactionId": "TXN1234567892"
}
```

**Note**: Exactly ONE of `rideId`, `returnId`, or `shareVehicleBookingId` must be provided

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment submitted successfully",
  "data": {
    "payment": {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
      "transactionId": "TXN1234567890",
      "amount": 350,
      "paymentMethod": "bkash",
      "paymentFor": "RIDE",
      "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:00:00Z",
      "createdAt": "2024-04-10T11:00:00Z"
    },
    "paymentDetails": {
      "amount": 350,
      "paymentFor": "RIDE"
    }
  }
}
```

**Error Responses**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Ride not found"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "message": "One of rideId, returnId, or shareVehicleBookingId is required"
}
```

**Important Notes**

- User must transfer exact amount via bKash (Send Money)
- Transaction ID must match bKash receipt
- Payment status starts as PENDING (awaiting admin verification)
- Amount is auto-calculated from ride/booking fare

---

## 5.3 Admin Approve / Reject Payment

**Endpoint**

```
POST {{BASE_URL}}/api/v1/payment/approve/:paymentId
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
Content-Type: application/json
```

**Request Payload (Approve)**

```json
{
  "approved": true
}
```

**Request Payload (Reject)**

```json
{
  "approved": false,
  "rejectionReason": "Transaction ID doesn't match. Invalid bKash receipt."
}
```

**Response (Success - Approve)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment approved successfully",
  "data": {
    "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
    "transactionId": "TXN1234567890",
    "amount": 350,
    "paymentMethod": "bkash",
    "paymentFor": "RIDE",
    "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
    "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
    "status": "APPROVED",
    "submittedAt": "2024-04-10T11:00:00Z",
    "approvedAt": "2024-04-10T11:15:00Z",
    "approvedBy": "64f5a1b2c3d4e5f6g7h8i9j2"
  }
}
```

**Response (Success - Reject)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment rejected successfully",
  "data": {
    "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
    "transactionId": "TXN1234567890",
    "amount": 350,
    "paymentMethod": "bkash",
    "paymentFor": "RIDE",
    "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
    "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
    "status": "REJECTED",
    "submittedAt": "2024-04-10T11:00:00Z",
    "rejectionReason": "Transaction ID doesn't match. Invalid bKash receipt.",
    "approvedBy": "64f5a1b2c3d4e5f6g7h8i9j2"
  }
}
```

**What Happens on Approval**

- Payment status: PENDING → APPROVED
- For Ride payments:
  - Ride status: PENDING → ACCEPTED
  - Driver notified to start journey
- For Return/Share Vehicle: Similar updates

**What Happens on Rejection**

- Payment status: REJECTED
- For Ride payments:
  - Ride status: reverted to PENDING (driver/car assignment cleared)
  - User must refund bKash themselves
  - User can retry or choose different driver
- User can resubmit payment after correction

---

## 5.4 Get All Pending Payments (Admin)

**Endpoint**

```
GET {{BASE_URL}}/api/v1/payment/pending/all
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pending payments fetched successfully",
  "data": [
    {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
      "transactionId": "TXN1234567890",
      "amount": 350,
      "paymentMethod": "bkash",
      "paymentFor": "RIDE",
      "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:00:00Z"
    },
    {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j1",
      "transactionId": "TXN1234567891",
      "amount": 450,
      "paymentMethod": "bkash",
      "paymentFor": "SHARE_VEHICLE",
      "shareVehicleBookingId": "64f5a3b2c3d4e5f6g7h8i9j2",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j1",
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:05:00Z"
    }
  ]
}
```

---

## 5.5 Get Pending Payments by Type

**Endpoint**

```
GET {{BASE_URL}}/api/v1/payment/pending/:paymentFor
```

**Headers**

```
Authorization: Bearer <adminAccessToken>
```

**Possible Values for `:paymentFor`**

```
RIDE
RETURN
SHARE_VEHICLE
```

**Response (Success - 200) - Example for RIDE**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Pending RIDE payments fetched successfully",
  "data": [
    {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
      "transactionId": "TXN1234567890",
      "amount": 350,
      "paymentMethod": "bkash",
      "paymentFor": "RIDE",
      "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:00:00Z"
    }
  ]
}
```

---

## 5.6 Get User Payments

**Endpoint**

```
GET {{BASE_URL}}/api/v1/payment/my-payments
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Your payments fetched successfully",
  "data": [
    {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
      "transactionId": "TXN1234567890",
      "amount": 350,
      "paymentMethod": "bkash",
      "paymentFor": "RIDE",
      "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
      "status": "APPROVED",
      "submittedAt": "2024-04-10T11:00:00Z",
      "approvedAt": "2024-04-10T11:15:00Z"
    },
    {
      "_id": "64f5a5b2c3d4e5f6g7h8i9j1",
      "transactionId": "TXN1234567891",
      "amount": 400,
      "paymentMethod": "bkash",
      "paymentFor": "RIDE",
      "rideId": "64f5a3b2c3d4e5f6g7h8i9j1",
      "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
      "status": "PENDING",
      "submittedAt": "2024-04-10T11:20:00Z"
    }
  ]
}
```

---

## 5.7 Get Payment by ID

**Endpoint**

```
GET {{BASE_URL}}/api/v1/payment/:paymentId
```

**Headers**

```
Authorization: Bearer <accessToken>
```

**Response (Success - 200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment fetched successfully",
  "data": {
    "_id": "64f5a5b2c3d4e5f6g7h8i9j0",
    "transactionId": "TXN1234567890",
    "amount": 350,
    "paymentMethod": "bkash",
    "paymentFor": "RIDE",
    "rideId": "64f5a3b2c3d4e5f6g7h8i9j0",
    "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
    "status": "APPROVED",
    "submittedAt": "2024-04-10T11:00:00Z",
    "approvedAt": "2024-04-10T11:15:00Z",
    "approvedBy": "64f5a1b2c3d4e5f6g7h8i9j2",
    "createdAt": "2024-04-10T11:00:00Z"
  }
}
```

---

# 6. General API Response Format

All API responses follow a standard format:

**Success Response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPage": 10
  }
}
```

**Error Response**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

**HTTP Status Codes**
| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error |

---

# 7. Authentication & Authorization

## 7.1 Access Control Levels

```
PUBLIC (No auth required):
  - POST /auth/signin
  - POST /user/register

USER (Verified user):
  - All GET endpoints (profile-related)
  - POST /ride (create ride request)
  - GET /ride/list/user
  - GET /car/approved
  - POST /payment/submit
  - GET /payment/my-payments

CAR_OWNER (User + Car owner):
  - All USER permissions
  - GET /ride/requested
  - POST /ride/proposal
  - GET /car/:id
  - Car management endpoints

ADMIN:
  - All endpoints
  - PATCH /car/:id/approve
  - GET /user/users
  - POST /payment/approve/:paymentId
  - GET /payment/pending/all
```

## 7.2 Token Management

**Access Token**

- Used for all API requests
- Bearer token in Authorization header
- Expires in short period (typically 1 hour)

**Refresh Token**

- Used to get new access token
- Sent in POST /auth/refresh body
- Longer expiry (typically 7 days)

**How to Use**

```
1. Login → Get accessToken & refreshToken
2. Use accessToken for API requests
3. When accessToken expires, use /auth/refresh
4. Get new accessToken
5. Continue with new token
```

---

# 8. Real-time Notifications

The system uses WebSocket for real-time notifications:

**Events Triggered**

```
ride:requested
  → Sent to: All car owners
  → Data: New ride details

proposal:submitted
  → Sent to: User who posted ride
  → Data: Driver & proposal details

proposal:accepted
  → Sent to: Selected driver
  → Data: Ride confirmation

payment:submitted
  → Sent to: All admins
  → Data: Payment details

payment:approved
  → Sent to: User who submitted payment
  → Data: Confirmation, ride can start

notification:new
  → General notification system
```

---

# 9. Error Handling

**Common Error Scenarios**

| Error            | Status | Reason                       |
| ---------------- | ------ | ---------------------------- |
| Invalid OTP      | 400    | Wrong code or expired        |
| Account Blocked  | 403    | Too many failed OTP attempts |
| Unauthorized     | 401    | Missing/invalid token        |
| Car Not Approved | 403    | Can't use unapproved car     |
| Ride in Past     | 400    | Cannot request past ride     |
| Payment Failed   | 400    | Transaction ID invalid       |

---

# 10. Best Practices

**For Frontend Developers**

1. **Storage of Tokens**
   - Store accessToken in memory (not localStorage for security)
   - Store refreshToken in secure HTTP-only cookie or sessionStorage
   - Implement auto-refresh before expiry

2. **Error Handling**
   - Handle 401 errors by redirecting to login
   - Show user-friendly error messages
   - Log errors for debugging

3. **Rate Limiting**
   - OTP requests: Max 1 per 60 seconds
   - Registration: Check rate limiting from server
   - Payment: One payment per ride

4. **Sensitive Data**
   - Never log passwords
   - Don't expose user IDs if not needed
   - Use HTTPS in production

5. **File Uploads**
   - Validate file types on frontend
   - Compress images before upload
   - Show progress to user

---

# 11. Common Workflows

## 11.1 Complete Ride Booking Flow

```
1. User registers → Email verification (OTP)
2. User logs in → Gets tokens
3. User views approved cars (optional)
4. Car owner registers car → Admin approves
5. User creates ride request
6. Car owner views requested rides
7. Car owner submits proposal with fare
8. User reviews proposals
9. User accepts best proposal
   - Ride status: REQUESTED → PENDING
10. User initiates payment (bKash)
    - Transfers money to system
    - Submits transaction ID
11. Admin verifies & approves payment
    - Payment status: PENDING → APPROVED
    - Ride status: PENDING → ACCEPTED
12. Driver starts journey
13. Ride completed
```

## 11.2 Admin Payment Verification Flow

```
1. Admin views pending payments
   - GET /payment/pending/all
2. Admin checks each payment
   - GET /payment/:paymentId
3. Admin verifies bKash transaction
   - Check transaction ID
   - Verify amount matches
   - Check sender is user
4. Approve or reject
   - POST /payment/approve/:paymentId
5. Ride transitions accordingly
   - Approved: Ride moves to ACCEPTED
   - Rejected: Ride resets, user retries
```

---

# 12. Testing Endpoints

**Quick Test with cURL**

```bash
# Register user
curl -X POST http://localhost:5000/api/v1/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "gender": "male",
    "phoneNumber": "+8801712345678"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Get user info
curl -X GET http://localhost:5000/api/v1/auth/user-info \
  -H "Authorization: Bearer <accessToken>"
```

---

# 13. API Versioning

Current API Version: **v1**

All endpoints are prefixed with `/api/v1/`

Example: `{{BASE_URL}}/api/v1/user/register`

---

# 14. Pagination

Endpoints that return multiple items support pagination:

**Query Parameters**

```
page: number (default: 1)
limit: number (default: 10)
sort: string (default: -createdAt)
search: string (for text search)
```

**Response Meta**

```json
{
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPage": 10
  }
}
```

---

# 15. Important Notes for Implementation

✅ **Email Verification Mandatory**

- User cannot login until email is verified via OTP
- OTP expires after 15 minutes
- Can request new OTP after 60-second cooldown

✅ **Car Approval Required**

- Cars registered by users must be approved by admin
- Unapproved cars cannot be used for rides
- Only approved cars appear in GET /car/approved

✅ **Payment via bKash**

- User must transfer exact amount via bKash (Send Money)
- Admin manually verifies transaction
- Transaction ID must match bKash receipt

✅ **Ride Lifecycle**

- Once proposal accepted: Ride locked to that driver
- Fare is final and cannot be changed
- Payment must be approved before ride starts

✅ **Security**

- Device fingerprinting for OTP
- OTP hashing (not plain text stored)
- JWT tokens with expiration
- Rate limiting on sensitive endpoints

---

**Last Updated**: April 10, 2026
**API Version**: 1.0
**Status**: Production Ready
