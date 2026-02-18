# FlowGateX API & Architecture Documentation

Complete reference for FlowGateX Event Management Platform's architecture, data models, and API endpoints.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Data Models (Firestore)](#data-models-firestore)
   - [Users](#users-collection)
   - [Events](#events-collection)
   - [Bookings](#bookings-collection)
   - [Transactions](#transactions-collection)
   - [IoT Devices](#iot-devices-collection)
4. [Backend REST API](#backend-rest-api)
   - [Payments (Cashfree)](#payments-api)
   - [Analytics](#analytics-api)
5. [Client-Side Integrations](#client-side-integrations)

---

## 🏗️ Architecture Overview

FlowGateX employs a **Hybrid Architecture** combining Serverless (Firebase) and Backend Services.

### 1. Client-Side Operations (Firebase)
The frontend communicates directly with **Firebase Services** for core functionality:
- **Authentication**: Firebase Auth (Email/Password, Google, Facebook).
- **Data Storage**: Cloud Firestore (NoSQL Database).
- **File Storage**: Firebase Storage (Images, Documents).
- **Realtime Updates**: Firestore Listeners (Live availability, IoT status).

### 2. Backend Operations (REST API)
A dedicated backend service handles sensitive or complex logic:
- **Payment Processing**: Server-side order creation (Cashfree).
- **Analytics Aggregation**: Complex queries and data aggregation.
- **Base URL**: `/api` (Proxied in development, separate service in production).

---

## 🔐 Authentication

Authentication is handled via **Firebase Auth SDK**.

### Client-Side Flow
1. User logs in via frontend (`signInWithEmailAndPassword` / `signInWithPopup`).
2. Firebase returns an ID Token.
3. This token is attached to REST API requests as a Bearer Token.

```typescript
// Header Format for Backend Calls
Authorization: Bearer <firebase_id_token>
```

---

## 🗄️ Data Models (Firestore)

Since the frontend interacts directly with Firestore, the "API" for these resources is the Data Schema.

### Users Collection
**Path:** `users/{userId}`

| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Unique User ID (matches Auth UID) |
| `role` | string | `user` \| `organizer` \| `org_admin` \| `admin` \| `superadmin` |
| `profile` | map | Nested details: `fullName`, `email`, `phone`, `avatarUrl` |
| `accountStatus` | string | `active` \| `suspended` \| `deleted` |
| `preferences` | map | User setting: `currency`, `language`, `notifications` |
| `organizationId` | string | (Optional) ID of organization for organizers |

### Events Collection
**Path:** `events/{eventId}`

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Event Title |
| `description` | string | Full HTML/Markdown description |
| `organizerId` | string | Reference to User ID |
| `venue` | map | `name`, `address`, `coordinates` (`lat`, `lng`) |
| `dates` | map | `start`, `end`, `registrationDeadline` (ISO Strings) |
| `ticketTiers` | array | List of tiers: `name`, `price`, `quantity`, `available` |
| `status` | string | `published` \| `draft` \| `cancelled` \| `completed` |
| `images` | array | List of image URLs (Storage paths) |

### Bookings Collection
**Path:** `bookings/{bookingId}`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Reference to User ID |
| `eventId` | string | Reference to Event ID |
| `status` | string | `pending` \| `confirmed` \| `cancelled` |
| `totalAmount` | number | Final transaction amount |
| `tickets` | array | List of tickets: `tierId`, `quantity`, `qrCodes` |
| `attendees` | array | List of attendee details |
| `paymentId` | string | Reference to external payment ID |

### Transactions Collection
**Path:** `transactions/{transactionId}`

| Field | Type | Description |
|-------|------|-------------|
| `bookingId` | string | Reference to Booking ID |
| `amountPaid` | number | Amount in currency units |
| `paymentMethod` | string | `razorpay` \| `cashfree` \| `stripe` |
| `status` | string | `success` \| `failed` \| `refunded` |
| `timestamp` | timestamp | Server timestamp |

### IoT Devices Collection
**Path:** `devices/{deviceId}`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Device Name (e.g., "Main Gate 1") |
| `eventId` | string | Assigned Event ID |
| `status` | string | `online` \| `offline` |
| `config` | map | `scanMode`, `offlineSync`, `allowedTiers` |

---

## 🚀 Backend REST API

For operations requiring server-side processing.

### Request Format
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <firebase_token>`

### Payments API

#### 1. Create Cashfree Order
Initiates a payment session on the backend.

- **Endpoint**: `POST /payments/cashfree/create-order`
- **Body**:
  ```json
  {
    "orderAmount": 100,
    "orderCurrency": "INR",
    "customerEmail": "user@example.com",
    "customerPhone": "9999999999",
    "orderNote": "Booking #123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "paymentLink": "https://payments.cashfree.com/...",
    "orderId": "order_12345"
  }
  ```

#### 2. Verify Cashfree Payment
Verifies the payment status after redirection.

- **Endpoint**: `GET /payments/cashfree/verify/{orderId}`
- **Response**:
  ```json
  {
    "success": true,
    "status": "PAID",
    "message": "Transaction successful"
  }
  ```

### Analytics API

#### 1. Get Overview Analytics
Returns aggregated platform or user stats.

- **Endpoint**: `GET /analytics/overview`
- **Response**:
  ```json
  {
    "totalRevenue": 50000,
    "totalBookings": 120,
    "activeEvents": 5
  }
  ```

#### 2. Get Revenue Data
Returns time-series revenue data for charts.

- **Endpoint**: `GET /analytics/revenue`
- **Query Params**: `period` (e.g., `30d`, `1y`)
- **Response**: Array of `{ date: "2024-01-01", amount: 1000 }`

#### 3. Get Attendance Data
Returns check-in stats for a specific event.

- **Endpoint**: `GET /analytics/attendance/{eventId}`
- **Response**: Array of `{ time: "10:00 AM", checkins: 45 }`

---

## 🔌 Client-Side Integrations

### Razorpay (Client-Side)
Razorpay is currently implemented using the **Client-Side Standard Checkout**.

1. **Frontend**: Calls `useCheckout`.
2. **Action**: `createBooking` creates a `pending` booking in Firestore.
3. **Payment**: Opens Razorpay Modal (`window.Razorpay`).
4. **Success**: On success callback, frontend updates Booking to `confirmed` and creates a `Transaction` record directly in Firestore.

### IoT & QR Validation
QR Validation is currently mocked or handled via client-side logic in `iotService.ts`.
- **Validation**: Checks QR format or queries Firestore.
- **Sync**: Realtime listeners on Firestore `devices` collection.
