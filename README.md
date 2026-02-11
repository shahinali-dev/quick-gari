# Quick-Gari API Reference

Base URL: https://quick-gari.vercel.app/

**Overview**

- This document lists available API endpoints, required authentication (if any), and example request payloads.

**Auth**

- **POST /api/v1/auth/signin**: Sign in
  - Auth: none
  - Content-Type: `application/json`
  - Example payload:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```

- **GET /api/v1/auth/user-info**: Get authenticated user info
  - Auth: Bearer token (access token)
  - Example: set header `Authorization: Bearer <accessToken>`

- **POST /api/v1/auth/verify-otp**: Verify OTP
  - Auth: verifies using a temporary verify token (cookie or header via middleware `isVerify`)
  - Content-Type: `application/json`
  - Example payload:
    ```json
    { "otp": "123456" }
    ```

- **POST /api/v1/auth/resend-otp**: Resend OTP
  - Auth: `isVerify` (temporary verify context)
  - No body required

**User**

- **POST /api/v1/user/register**: Register a new user
  - Auth: none
  - Content-Type: `multipart/form-data` (optional `avatar` file)
  - Fields (form-data):
    - `name` (string)
    - `email` (string)
    - `password` (string, min 8 chars)
    - `gender` ("male" | "female" | "other")
    - `phoneNumber` (optional)
    - `avatar` (optional file)
  - Example (JSON representation of form-data fields):
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "strongpassword",
      "gender": "male",
      "phoneNumber": "01710000000"
    }
    ```

- **GET /api/v1/user/users**: Get all users (admin only)
  - Auth: Bearer token (admin)

**Car**

- **POST /api/v1/car/**: Register a car
  - Auth: Bearer token (authenticated user)
  - Content-Type: `multipart/form-data`
  - Body: a form field named `data` containing a JSON string, plus files:
    - `images` (array of images, min 1, max 5)
    - `taxTokenPhoto` (file)
    - `registrationCardPhoto` (file)
    - `drivingLicensePhoto` (file)
  - `data` JSON structure:
    ```json
    {
      "carName": "My Sedan",
      "features": {
        "vehicleType": "car",
        "model": "Civic",
        "brand": "Honda",
        "fuelType": "petrol",
        "gearType": "manual",
        "seatCapacity": 4,
        "manufactureYear": 2018
      },
      "vehicleRegistration": {
        "registrationNumber": "ABC-1234",
        "registration": 2018
      }
    }
    ```

- **PATCH /api/v1/car/:id/approve**: Approve a car (admin)
  - Auth: Bearer token (admin)

- **GET /api/v1/car/**: Get all cars (admin)
  - Auth: Bearer token (admin)

- **GET /api/v1/car/approved**: Get approved cars (public)
  - Auth: none

- **GET /api/v1/car/:id**: Get car by ID (public)
  - Auth: Bearer token for extended details if required

- **GET /api/v1/car/admin/:id**: Get car by ID (admin)
  - Auth: Bearer token (admin)

- **PATCH /api/v1/car/:id**: Update car
  - Auth: Bearer token (authenticated user)
  - Content-Type: `multipart/form-data`
  - Body structure same as POST (send `data` JSON string and optional files)

- **DELETE /api/v1/car/:id**: Delete car (admin)
  - Auth: Bearer token (admin)

**Ride**

- **POST /api/v1/ride/**: Request a ride
  - Auth: Bearer token
  - Content-Type: `application/json`
  - Example payload:
    ```json
    {
      "startLocation": "Mirpur, Dhaka",
      "endLocation": "Gulshan, Dhaka",
      "date": "2026-03-01",
      "startTime": "09:00"
    }
    ```

- **POST /api/v1/ride/proposal**: Driver submits a proposal for a ride
  - Auth: Bearer token (driver)
  - Content-Type: `application/json`
  - Example payload:
    ```json
    {
      "rideId": "603d2f...",
      "fare": "500",
      "message": "I can pick you up at 09:00"
    }
    ```

- **POST /api/v1/ride/accept-proposal**: Accept a proposal
  - Auth: Bearer token (ride requester)
  - Content-Type: `application/json`
  - Example payload:
    ```json
    {
      "rideId": "603d2f...",
      "proposalId": "604a1b..."
    }
    ```

- **GET /api/v1/ride/:rideId/proposals**: Get proposals for a ride
  - Auth: Bearer token

- **GET /api/v1/ride/:rideId**: Get ride by ID
  - Auth: Bearer token

**Return-trip (Return rides)**

- **POST /api/v1/return-trip/**: Create a return ride (driver)
  - Auth: Bearer token
  - Content-Type: `application/json`
  - Example payload:
    ```json
    {
      "startLocation": "Banani, Dhaka",
      "endLocation": "Airport, Dhaka",
      "date": "2026-03-05",
      "startTime": "18:00",
      "fare": 800
    }
    ```

- **GET /api/v1/return-trip/**: List return rides (passengers browse)
  - Auth: Bearer token
  - Query params supported (filtered in service); pass as needed

- **GET /api/v1/return-trip/:id**: Get return ride by ID
  - Auth: Bearer token

- **POST /api/v1/return-trip/:id/book**: Book a return ride
  - Auth: Bearer token (passenger)
  - No body required

**Notes & Tips**

- Auth: The app issues JWT `accessToken` and `refreshToken` on successful sign-in. Use `Authorization: Bearer <accessToken>` for protected endpoints.
- File uploads: for car and user registration with files, use multipart/form-data. For car endpoints the `data` field must be a JSON string containing the car metadata.
- Validation: Many endpoints validate inputs using `zod`; follow the example payloads to satisfy required fields.

If you want, I can:

- add example responses for each endpoint,
- generate a Postman collection or OpenAPI spec from this list,
- or commit & push this README and run the project to verify.
