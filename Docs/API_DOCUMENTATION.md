# FlowGateX API Documentation

Complete API reference for FlowGateX Event Management Platform

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Events API](#events-api)
4. [Booking API](#booking-api)
5. [Payment API](#payment-api)
6. [User API](#user-api)
7. [IoT Devices API](#iot-devices-api)
8. [Analytics API](#analytics-api)
9. [Admin API](#admin-api)
10. [Webhooks](#webhooks)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## 🎯 Overview

### Base URL

```
Development: http://localhost:3000/api
Production: https://flowgatex.vercel.app/api
```

### Request Format

All API requests should include:

```http
Content-Type: application/json
Authorization: Bearer <firebase_id_token>
```

### Response Format

Success response:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

Error response:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error details */ }
  }
}
```

---

## 🔐 Authentication

### Get Firebase ID Token

```typescript
// Client-side
import { auth } from '@/lib/firebase';

const idToken = await auth.currentUser?.getIdToken();
```

### Verify Token (Server-side)

```typescript
import { auth as adminAuth } from 'firebase-admin';

async function verifyToken(req: Request) {
  const token = req.headers.get('authorization')?.split('Bearer ')[1];
  const decodedToken = await adminAuth().verifyIdToken(token);
  return decodedToken;
}
```

### Login

```http
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "firebase_user_id",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "user",
      "photoURL": "https://..."
    },
    "token": "firebase_id_token"
  }
}
```

### Register

```http
POST /auth/register
```

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "displayName": "Jane Doe",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "firebase_user_id",
    "email": "newuser@example.com",
    "displayName": "Jane Doe"
  },
  "message": "Registration successful. Please verify your email."
}
```

### Google OAuth

```http
POST /auth/google
```

**Request:**
```json
{
  "idToken": "google_id_token"
}
```

### Logout

```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

---

## 🎫 Events API

### Get All Events

```http
GET /events
```

**Query Parameters:**
```
category: string (optional) - Filter by category
search: string (optional) - Search in title/description
city: string (optional) - Filter by city
minPrice: number (optional) - Minimum ticket price
maxPrice: number (optional) - Maximum ticket price
startDate: ISO date (optional) - Events after this date
endDate: ISO date (optional) - Events before this date
limit: number (default: 20) - Results per page
page: number (default: 1) - Page number
sortBy: string (default: 'createdAt') - Sort field
sortOrder: 'asc' | 'desc' (default: 'desc')
```

**Example Request:**
```http
GET /events?category=music&city=Mumbai&limit=10&page=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123",
        "title": "Summer Music Festival 2026",
        "description": "Annual music festival...",
        "category": "music",
        "organizerId": "user_456",
        "organizerName": "Event Company Ltd",
        "venue": {
          "name": "Mumbai Arena",
          "address": "123 Main St, Mumbai",
          "city": "Mumbai",
          "state": "Maharashtra",
          "coordinates": {
            "lat": 19.0760,
            "lng": 72.8777
          },
          "capacity": 5000
        },
        "dates": {
          "start": "2026-06-15T18:00:00Z",
          "end": "2026-06-15T23:00:00Z",
          "registrationDeadline": "2026-06-14T23:59:59Z"
        },
        "ticketTiers": [
          {
            "id": "tier_1",
            "name": "General Admission",
            "price": 500,
            "currency": "INR",
            "quantity": 3000,
            "sold": 1250,
            "available": 1750
          },
          {
            "id": "tier_2",
            "name": "VIP",
            "price": 1500,
            "currency": "INR",
            "quantity": 500,
            "sold": 320,
            "available": 180
          }
        ],
        "images": [
          "https://storage.googleapis.com/flowgatex/events/event_123/banner.jpg"
        ],
        "status": "published",
        "featured": true,
        "tags": ["music", "festival", "outdoor"],
        "createdAt": "2026-01-15T10:00:00Z",
        "updatedAt": "2026-02-01T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Event by ID

```http
GET /events/:eventId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event": { /* full event object */ },
    "relatedEvents": [ /* array of similar events */ ]
  }
}
```

### Create Event (Organizer/Admin only)

```http
POST /events
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Tech Conference 2026",
  "description": "Annual technology conference featuring industry leaders...",
  "category": "conference",
  "venue": {
    "name": "Convention Center",
    "address": "456 Tech Park, Bangalore",
    "city": "Bangalore",
    "state": "Karnataka",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    },
    "capacity": 2000
  },
  "dates": {
    "start": "2026-08-20T09:00:00Z",
    "end": "2026-08-22T18:00:00Z",
    "registrationDeadline": "2026-08-18T23:59:59Z"
  },
  "ticketTiers": [
    {
      "name": "Early Bird",
      "price": 2000,
      "quantity": 500,
      "description": "Limited early bird pricing",
      "benefits": ["Conference access", "Workshop tickets", "Lunch included"]
    },
    {
      "name": "Regular",
      "price": 3000,
      "quantity": 1000,
      "description": "Standard ticket",
      "benefits": ["Conference access", "Lunch included"]
    }
  ],
  "features": [
    "Free WiFi",
    "Parking available",
    "Live streaming",
    "Networking sessions"
  ],
  "tags": ["technology", "conference", "networking"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "event_789",
    "message": "Event created successfully"
  }
}
```

### Update Event

```http
PUT /events/:eventId
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Request:** (Same structure as create, partial updates allowed)

### Delete Event

```http
DELETE /events/:eventId
```

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### Upload Event Images

```http
POST /events/:eventId/images
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
  images: File[] (max 5 images, 5MB each)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "urls": [
      "https://storage.googleapis.com/flowgatex/events/event_123/image1.jpg",
      "https://storage.googleapis.com/flowgatex/events/event_123/image2.jpg"
    ]
  }
}
```

---

## 🎟️ Booking API

### Create Booking

```http
POST /bookings
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Request:**
```json
{
  "eventId": "event_123",
  "tickets": [
    {
      "tierId": "tier_1",
      "quantity": 2
    },
    {
      "tierId": "tier_2",
      "quantity": 1
    }
  ],
  "attendees": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+919876543211"
    }
  ],
  "discountCode": "SUMMER20" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_456",
    "orderId": "order_789",
    "totalAmount": 2000,
    "discount": 400,
    "finalAmount": 1600,
    "currency": "INR",
    "status": "pending",
    "expiresAt": "2026-02-03T15:30:00Z"
  }
}
```

### Get User Bookings

```http
GET /bookings
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Query Parameters:**
```
status: 'pending' | 'confirmed' | 'cancelled' (optional)
limit: number (default: 20)
page: number (default: 1)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_456",
        "eventId": "event_123",
        "eventTitle": "Summer Music Festival 2026",
        "eventDate": "2026-06-15T18:00:00Z",
        "tickets": [
          {
            "tierId": "tier_1",
            "tierName": "General Admission",
            "quantity": 2,
            "price": 500,
            "qrCodes": ["QR_CODE_1", "QR_CODE_2"]
          }
        ],
        "totalAmount": 1600,
        "status": "confirmed",
        "paymentId": "pay_123",
        "bookingDate": "2026-02-03T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 20
    }
  }
}
```

### Get Booking Details

```http
GET /bookings/:bookingId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_456",
      "event": { /* full event details */ },
      "tickets": [ /* array of tickets with QR codes */ ],
      "attendees": [ /* attendee information */ ],
      "payment": {
        "id": "pay_123",
        "amount": 1600,
        "status": "success",
        "method": "UPI",
        "transactionId": "txn_789"
      },
      "status": "confirmed",
      "createdAt": "2026-02-03T10:00:00Z"
    }
  }
}
```

### Cancel Booking

```http
POST /bookings/:bookingId/cancel
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_456",
    "status": "cancelled",
    "refundAmount": 1600,
    "refundStatus": "processing",
    "estimatedRefundDate": "2026-02-10T00:00:00Z"
  }
}
```

### Download Ticket

```http
GET /bookings/:bookingId/tickets/download
```

**Query Parameters:**
```
format: 'pdf' | 'png' (default: 'pdf')
```

**Response:** Binary file (PDF or PNG)

---

## 💳 Payment API

### Create Payment Order

```http
POST /payment/create-order
```

**Request:**
```json
{
  "bookingId": "booking_456",
  "amount": 1600,
  "currency": "INR",
  "gateway": "razorpay" // or "cashfree"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789",
    "amount": 1600,
    "currency": "INR",
    "gateway": "razorpay",
    "key": "rzp_test_xxxxx", // Gateway public key
    "notes": {
      "bookingId": "booking_456"
    }
  }
}
```

### Verify Payment

```http
POST /payment/verify
```

**Request:**
```json
{
  "orderId": "order_789",
  "paymentId": "pay_razorpay_123",
  "signature": "signature_hash",
  "gateway": "razorpay"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "bookingId": "booking_456",
    "status": "confirmed",
    "tickets": [
      {
        "id": "ticket_1",
        "qrCode": "QR_CODE_BASE64_STRING"
      }
    ]
  }
}
```

### Get Payment Status

```http
GET /payment/:paymentId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123",
    "orderId": "order_789",
    "bookingId": "booking_456",
    "amount": 1600,
    "currency": "INR",
    "status": "captured",
    "method": "upi",
    "gateway": "razorpay",
    "transactionId": "txn_razorpay_789",
    "createdAt": "2026-02-03T10:15:00Z",
    "capturedAt": "2026-02-03T10:15:30Z"
  }
}
```

### Initiate Refund

```http
POST /payment/:paymentId/refund
```

**Request:**
```json
{
  "amount": 1600, // optional, full refund if not specified
  "reason": "Event cancelled"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "rfnd_123",
    "paymentId": "pay_123",
    "amount": 1600,
    "status": "processing",
    "estimatedDate": "2026-02-10T00:00:00Z"
  }
}
```

---

## 👤 User API

### Get User Profile

```http
GET /users/profile
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "user_123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "phone": "+919876543210",
      "photoURL": "https://...",
      "role": "user",
      "preferences": {
        "categories": ["music", "sports"],
        "cities": ["Mumbai", "Bangalore"]
      },
      "stats": {
        "totalBookings": 15,
        "upcomingEvents": 3,
        "totalSpent": 25000
      },
      "createdAt": "2025-01-10T10:00:00Z"
    }
  }
}
```

### Update User Profile

```http
PUT /users/profile
```

**Request:**
```json
{
  "displayName": "John Smith",
  "phone": "+919876543210",
  "preferences": {
    "categories": ["music", "technology"],
    "cities": ["Mumbai"]
  }
}
```

### Upload Profile Photo

```http
POST /users/profile/photo
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
  photo: File (max 2MB)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photoURL": "https://storage.googleapis.com/flowgatex/users/user_123/photo.jpg"
  }
}
```

### Get User Statistics

```http
GET /users/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": {
      "total": 15,
      "upcoming": 3,
      "past": 12,
      "cancelled": 0
    },
    "spending": {
      "total": 25000,
      "thisMonth": 3000,
      "lastMonth": 2500
    },
    "favorites": {
      "events": 8,
      "organizers": 3
    },
    "recentActivity": [
      {
        "type": "booking_created",
        "eventId": "event_123",
        "eventTitle": "Summer Music Festival",
        "timestamp": "2026-02-03T10:00:00Z"
      }
    ]
  }
}
```

---

## 🌐 IoT Devices API

### Register Device (Organizer/Admin only)

```http
POST /iot/devices
```

**Request:**
```json
{
  "name": "Main Entrance Gate 1",
  "type": "access_gate",
  "eventId": "event_123",
  "location": {
    "venue": "Mumbai Arena",
    "zone": "Main Entrance"
  },
  "capabilities": ["qr_scan", "nfc_read"],
  "configuration": {
    "scanTimeout": 5,
    "offlineMode": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "device_456",
    "apiKey": "device_api_key_secret",
    "syncEndpoint": "wss://flowgatex.com/iot/sync"
  }
}
```

### Get Event Devices

```http
GET /iot/devices?eventId=event_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device_456",
        "name": "Main Entrance Gate 1",
        "type": "access_gate",
        "status": "online",
        "location": {
          "venue": "Mumbai Arena",
          "zone": "Main Entrance"
        },
        "metrics": {
          "scansToday": 1250,
          "errorRate": 0.02,
          "uptime": 99.8,
          "lastSync": "2026-02-03T14:30:00Z"
        },
        "lastActivity": "2026-02-03T14:29:55Z"
      }
    ]
  }
}
```

### Validate Ticket QR

```http
POST /iot/validate-ticket
```

**Headers:**
```
X-Device-API-Key: device_api_key_secret
```

**Request:**
```json
{
  "deviceId": "device_456",
  "qrCode": "TICKET_QR_CODE_STRING",
  "timestamp": "2026-02-03T14:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "ticket": {
      "id": "ticket_789",
      "attendeeName": "John Doe",
      "ticketTier": "VIP",
      "eventId": "event_123",
      "seatNumber": "A-15"
    },
    "checkInTime": "2026-02-03T14:30:00Z",
    "message": "Access granted"
  }
}
```

**Invalid Ticket Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TICKET",
    "message": "Ticket already used",
    "details": {
      "previousScanTime": "2026-02-03T14:25:00Z",
      "scannedBy": "device_456"
    }
  }
}
```

### Get Device Activity Logs

```http
GET /iot/devices/:deviceId/logs
```

**Query Parameters:**
```
startDate: ISO date
endDate: ISO date
limit: number (default: 100)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "deviceId": "device_456",
        "type": "ticket_scan",
        "status": "success",
        "ticketId": "ticket_789",
        "timestamp": "2026-02-03T14:30:00Z",
        "metadata": {
          "scanDuration": 0.5,
          "attendeeName": "John Doe"
        }
      },
      {
        "id": "log_124",
        "deviceId": "device_456",
        "type": "ticket_scan",
        "status": "error",
        "error": "Ticket already used",
        "timestamp": "2026-02-03T14:31:00Z"
      }
    ]
  }
}
```

### Update Device Status

```http
PUT /iot/devices/:deviceId/status
```

**Request:**
```json
{
  "status": "online",
  "metrics": {
    "uptime": 99.8,
    "errorRate": 0.02
  }
}
```

---

## 📊 Analytics API

### Get Organizer Analytics

```http
GET /analytics/organizer
```

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Query Parameters:**
```
eventId: string (optional) - Specific event analytics
startDate: ISO date
endDate: ISO date
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalEvents": 25,
      "activeEvents": 8,
      "totalRevenue": 1250000,
      "totalAttendees": 15000
    },
    "revenue": {
      "byMonth": [
        { "month": "2026-01", "amount": 450000 },
        { "month": "2026-02", "amount": 350000 }
      ],
      "byEvent": [
        { "eventId": "event_123", "title": "Summer Festival", "revenue": 250000 }
      ],
      "byTicketTier": [
        { "tier": "VIP", "revenue": 600000, "percentage": 48 },
        { "tier": "General", "revenue": 650000, "percentage": 52 }
      ]
    },
    "tickets": {
      "totalSold": 15000,
      "byEvent": [
        { "eventId": "event_123", "sold": 4500, "available": 500 }
      ],
      "conversionRate": 65.5
    },
    "attendance": {
      "totalCheckedIn": 14250,
      "checkInRate": 95,
      "peakHours": [
        { "hour": "18:00", "count": 1250 }
      ]
    },
    "topEvents": [
      {
        "eventId": "event_123",
        "title": "Summer Music Festival",
        "revenue": 250000,
        "attendees": 4500,
        "rating": 4.8
      }
    ]
  }
}
```

### Get Event-Specific Analytics

```http
GET /analytics/events/:eventId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event_123",
      "title": "Summer Music Festival 2026"
    },
    "sales": {
      "totalRevenue": 250000,
      "totalTickets": 4500,
      "dailySales": [
        { "date": "2026-02-01", "tickets": 150, "revenue": 75000 }
      ],
      "salesTrend": "increasing"
    },
    "ticketTiers": [
      {
        "name": "VIP",
        "total": 500,
        "sold": 480,
        "available": 20,
        "revenue": 720000
      }
    ],
    "demographics": {
      "ageGroups": [
        { "range": "18-25", "percentage": 35 },
        { "range": "26-35", "percentage": 45 }
      ],
      "cities": [
        { "name": "Mumbai", "percentage": 60 },
        { "name": "Pune", "percentage": 25 }
      ]
    },
    "engagement": {
      "views": 15000,
      "favorites": 850,
      "shares": 320,
      "conversionRate": 30
    }
  }
}
```

### Get Platform Analytics (Admin only)

```http
GET /analytics/platform
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 50000,
      "newThisMonth": 2500,
      "active": 15000,
      "byRole": {
        "user": 48500,
        "organizer": 1400,
        "admin": 100
      }
    },
    "events": {
      "total": 2500,
      "published": 1800,
      "draft": 500,
      "completed": 200
    },
    "revenue": {
      "total": 15000000,
      "commission": 300000,
      "byCategory": [
        { "category": "music", "revenue": 6000000 },
        { "category": "technology", "revenue": 4500000 }
      ]
    },
    "bookings": {
      "total": 75000,
      "thisMonth": 5000,
      "averageValue": 2000
    },
    "systemHealth": {
      "uptime": 99.9,
      "apiResponseTime": 150,
      "errorRate": 0.1
    }
  }
}
```

---

## 🛡️ Admin API

### Get All Users

```http
GET /admin/users
```

**Query Parameters:**
```
role: 'user' | 'organizer' | 'admin'
status: 'active' | 'suspended' | 'deleted'
search: string
limit: number
page: number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uid": "user_123",
        "email": "user@example.com",
        "displayName": "John Doe",
        "role": "user",
        "status": "active",
        "stats": {
          "totalBookings": 15,
          "totalSpent": 25000
        },
        "createdAt": "2025-01-10T10:00:00Z",
        "lastLogin": "2026-02-03T09:00:00Z"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### Update User Role

```http
PUT /admin/users/:userId/role
```

**Request:**
```json
{
  "role": "organizer"
}
```

### Suspend User

```http
POST /admin/users/:userId/suspend
```

**Request:**
```json
{
  "reason": "Violation of terms of service",
  "duration": "30d" // or "permanent"
}
```

### Get System Settings

```http
GET /admin/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "platformName": "FlowGateX",
      "supportEmail": "support@flowgatex.com",
      "maintenanceMode": false
    },
    "payments": {
      "defaultGateway": "razorpay",
      "commissionRate": 2.5,
      "minimumWithdrawal": 1000
    },
    "features": {
      "chatbotEnabled": true,
      "analyticsEnabled": true,
      "iotEnabled": true
    }
  }
}
```

### Update System Settings

```http
PUT /admin/settings
```

**Request:**
```json
{
  "payments": {
    "commissionRate": 3.0
  },
  "features": {
    "maintenanceMode": true
  }
}
```

---

## 🔔 Webhooks

### Webhook Events

FlowGateX sends webhooks for the following events:

| Event | Description |
|-------|-------------|
| `booking.created` | New booking created |
| `booking.confirmed` | Booking confirmed after payment |
| `booking.cancelled` | Booking cancelled |
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed |
| `event.published` | Event published |
| `event.updated` | Event details updated |
| `ticket.scanned` | Ticket scanned at venue |

### Webhook Payload

```json
{
  "id": "webhook_123",
  "event": "booking.confirmed",
  "timestamp": "2026-02-03T10:15:30Z",
  "data": {
    "bookingId": "booking_456",
    "eventId": "event_123",
    "userId": "user_789",
    "amount": 1600,
    "status": "confirmed"
  }
}
```

### Webhook Security

Verify webhook signature:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Register Webhook Endpoint

```http
POST /admin/webhooks
```

**Request:**
```json
{
  "url": "https://yourapp.com/webhooks/flowgatex",
  "events": ["booking.confirmed", "payment.success"],
  "secret": "your_webhook_secret"
}
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Error Handling Example

```typescript
try {
  const response = await api.post('/events', eventData);
  return response.data;
} catch (error) {
  if (error.response) {
    const { code, message } = error.response.data.error;
    
    switch (code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        router.push('/login');
        break;
      case 'VALIDATION_ERROR':
        // Show validation errors
        setErrors(error.response.data.error.details);
        break;
      default:
        // Show generic error
        toast.error(message);
    }
  }
}
```

---

## 🚦 Rate Limiting

### Rate Limits

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Authentication | 10 requests | 1 minute |
| Public Endpoints | 100 requests | 1 minute |
| Authenticated Endpoints | 1000 requests | 1 hour |
| Admin Endpoints | 500 requests | 1 hour |
| File Uploads | 10 uploads | 1 hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1675435200
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 3600,
      "limit": 1000,
      "window": "1 hour"
    }
  }
}
```

---

## 📚 SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://flowgatex.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Usage
const events = await api.get('/events', {
  params: { category: 'music', limit: 10 }
});
```

### Python

```python
import requests

class FlowGateXClient:
    def __init__(self, base_url, api_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def get_events(self, **params):
        response = requests.get(
            f'{self.base_url}/events',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
client = FlowGateXClient('https://flowgatex.vercel.app/api', 'your_token')
events = client.get_events(category='music', limit=10)
```

---

## 🔗 Additional Resources

- **OpenAPI Specification**: [Download OpenAPI 3.0 spec](https://flowgatex.com/api/openapi.json)
- **Postman Collection**: [Import collection](https://flowgatex.com/api/postman-collection.json)
- **GraphQL Playground**: [Explore GraphQL API](https://flowgatex.com/graphql) (Coming soon)

---

<div align="center">

**FlowGateX API Documentation v1.0**

For support, contact: api-support@flowgatex.com

</div>
