# 🛡️ Aproxy — Smart Anti-Proxy Attendance & Biometric Verification System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.21-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.9-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**Aproxy** is a full-stack, enterprise-grade classroom attendance verification engine engineered to completely eliminate proxy attendance, buddy-punching, and remote credential sharing using **cryptographically signed ephemeral dynamic QR codes (HMAC-SHA256)** and **client-side biometric facial descriptor verification with active eye-blink liveness detection**.

---

## 📌 Executive Summary

Traditional QR-code attendance systems fail because students easily take screenshots or record videos and send them over messaging apps like WhatsApp or Telegram to absent friends.

**Aproxy solves proxy attendance through a multi-layered security stack:**
1. **1-Second Dynamic Ephemeral QR Codes**: QR codes rotate every 1,000ms via WebSockets. Each payload contains a cryptographic HMAC-SHA256 signature, millisecond timestamp, and single-use nonce. Screenshots sent to friends expire within 1–2 seconds.
2. **Client-Side Biometric Verification**: Extracts 128-dimensional Float32 facial embeddings using `@vladmandic/face-api` locally in the browser — no raw facial photos are ever transmitted or stored on the server (zero-knowledge privacy).
3. **Active Liveness Detection**: Optical eye aspect ratio (EAR) blink validation and head movement challenges reject static photos, printed paper, and phone screen replays.
4. **Real-Time WebSocket Roster**: Sub-50ms live broadcast pipeline delivering instant student check-in counters, attendance rings, and verification alerts to the teacher's dashboard.

---

## ✨ Key Engineering Highlights

| Feature | Description | Technical Implementation |
| :--- | :--- | :--- |
| ⚡ **1s Dynamic QR Rotation** | Rotates dynamic QR payload every 1000ms over Socket.IO WebSockets | HMAC-SHA256 signature, millisecond timestamp, single-use nonce |
| 👁️ **Biometric Face Verification** | 128-dimensional Float32 facial descriptor extraction | `@vladmandic/face-api`, Cosine Distance matching threshold (<0.45) |
| 🛑 **Active Liveness Check** | Rejects photos, printed papers, and video playback attacks | Eye Aspect Ratio (EAR) blink tracking & head pose challenge |
| 📡 **Real-Time Live Command Center** | Sub-50ms WebSocket broadcast pipeline to teacher dashboard | Instant roster updates, status alerts, and live attendance rings |
| 📅 **Smart Schedule Engine** | Automatic current class detection based on local time | Schedule conflict validation and room resource mapping |
| ✍️ **Audit-Logged Overrides** | Manual attendance adjustments with mandatory reason codes | Immutable `AuditLog` database collection with IP tracking |
| 📊 **Compliance & Exports** | Instant PDF & CSV attendance reports for institution records | Built using `pdfkit` & `fast-csv` with low-attendance warnings (<75%) |
| 🎨 **Vercel-Grade UI** | Fluid dark/light theme, glassmorphic UI, smooth micro-interactions | React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, Sonner |

---

## 🏗️ Architecture & Security Workflow

```
                                  +---------------------------+
                                  |   Teacher Launches Class  |
                                  +---------------------------+
                                                |
                                                v
                          +-------------------------------------------+
                          |   WebSocket Pushes Signed Ephemeral QR    |
                          |   Payload: { sessionId, token, nonce,     |
                          |              timestamp, HMAC-SHA256 }     |
                          |         (Rotates every 1000ms)            |
                          +-------------------------------------------+
                                                |
                 +------------------------------+------------------------------+
                 |                                                             |
                 v                                                             v
   +---------------------------+                                 +---------------------------+
   |    Student Face ID Check  |                                 |   Student Camera QR Scan  |
   |    Active Blink Liveness  | ---> [Biometric Verified] ------>|   Captures dynamic token  |
   |   128D Vector Match <0.45 |                                 |   Sends to verify endpoint|
   +---------------------------+                                 +---------------------------+
                                                                               |
                                                                               v
                                                                 +---------------------------+
                                                                 |     Backend Validation    |
                                                                 |   Verify HMAC signature   |
                                                                 |   Timestamp drift < 2000ms|
                                                                 |   Atomic single-use nonce |
                                                                 |   Idempotent DB upsert    |
                                                                 +---------------------------+
                                                                               |
                                                                               v
                                                                 +---------------------------+
                                                                 |  WebSocket Instant Push   |
                                                                 |  Teacher Roster: +1 Count |
                                                                 +---------------------------+
```

---

## 🛠️ Tech Stack

### Frontend Application
- **Core**: React 18 (Vite) + TypeScript
- **Styling**: Tailwind CSS + Custom Design System (Glassmorphism, CSS Tokens)
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Vision & Biometrics**: `@vladmandic/face-api` + HTML5 WebCam API
- **QR Generation & Scanning**: `qrcode.react` + `html5-qrcode`
- **Data Visualization**: Recharts
- **UI Components & Feedback**: Lucide Icons + Sonner (Toasts) + Canvas Confetti

### Backend Engine
- **Runtime**: Node.js + Express.js (TypeScript)
- **Database & ODM**: MongoDB + Mongoose
- **Real-Time Communication**: Socket.IO WebSockets
- **Security & Cryptography**: Node.js native `crypto` (HMAC-SHA256), JWT, bcryptjs
- **Validation**: Zod Schema Validation
- **Reporting**: PDFKit & Fast-CSV

---

## 📁 Repository Structure

```
Aproxy/
├── server/                       # Express Backend Service
│   ├── src/
│   │   ├── config/               # DB connection & environment variables
│   │   ├── controllers/          # Auth, Attendance, Timetable Controllers
│   │   ├── middleware/           # JWT Auth & Security Middleware
│   │   ├── models/               # Mongoose Schemas (User, Attendance, AuditLog, etc.)
│   │   ├── routes/               # API Router Definitions
│   │   ├── schemas/              # Zod Validation Schemas
│   │   ├── services/             # HMAC, QR Engine & Biometric Logic
│   │   ├── socket/               # Socket.IO WebSocket Namespace Handlers
│   │   ├── utils/                # PDF & CSV Export Utilities
│   │   ├── server.ts             # Server Entry Point
│   │   └── test-*.ts             # End-to-End Integration & Unit Test Scripts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── src/                          # Vite + React Frontend Client
│   ├── components/               # UI Components
│   │   ├── attendance/           # Dynamic QR Broadcaster, Command Center, Overrides
│   │   ├── auth/                 # Login & Registration Modals
│   │   ├── biometrics/           # Face Enrollment & Liveness Check Components
│   │   ├── dashboard/            # Teacher & Student Sidebar / Navigation Layouts
│   │   └── timetable/            # Schedule Builder & Conflict Viewers
│   ├── pages/                    # Multi-Role Application Views
│   │   ├── teacher/              # Live Sessions, Analytics, Roster, History, Settings
│   │   ├── student/              # Face ID Verification, Scanner, Overview, Stats
│   │   ├── AuthPage.tsx          # Unified Authentication Portal
│   │   ├── ArchitecturePage.tsx  # Interactive Security Architecture View
│   │   └── DemoPage.tsx          # Interactive System Walkthrough
│   ├── services/                 # Axios HTTP & Socket.IO Client API Services
│   ├── store/                    # Zustand Global App State Stores
│   ├── types/                    # Shared TypeScript Interface Definitions
│   └── index.css                 # Core CSS Tokens & Glassmorphic Utilities
├── index.html
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` OR a MongoDB Atlas connection string.

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/jaanvichouhan34/Aproxy.git
cd Aproxy
```

---

### Step 2: Configure & Start Backend Server

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory (you can copy `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aproxy
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend in development mode:

```bash
npm run dev
```

The backend server will run at `http://localhost:5000` with WebSocket support on namespace `/attendance-session`.

---

### Step 3: Configure & Start Frontend Application

In a **new terminal window**, navigate to the project root directory:

```bash
# From the project root (Aproxy/)
npm install
npm run dev
```

Open your browser and navigate to:
👉 `http://localhost:5173`

---

## 🧪 Testing Backend Services & Cryptography

The backend includes standalone unit & integration test suites built to verify security contracts:

```bash
cd server

# 🔑 Test JWT Authentication & Refresh Token Pipeline
npx tsx src/test-auth.ts

# 📅 Test Timetable & Schedule Conflict Detection Engine
npx tsx src/test-timetable.ts

# ⚡ Test 1s Dynamic Ephemeral QR & HMAC Signature Validation
npx tsx src/test-session-e2e.ts

# 🛡️ Test Nonce Replay Attacks & Atomic Attendance Upserts
npx tsx src/test-attendance.ts

# 👁️ Test 128D Facial Vector Cosine Distance Matching
npx tsx src/test-biometrics.ts

# 📑 Test Audit Logs & PDF / CSV Export Engine
npx tsx src/test-phase6.ts
```

---

## 📡 API Endpoint Reference

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new Student or Teacher account | Public |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh access token using HTTP-only cookie | Public |
| `POST` | `/api/auth/logout` | Revoke tokens and clear cookie session | Auth Required |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Auth Required |

### Attendance & Sessions (`/api/attendance`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance/session/start` | Launch new attendance session for class | Teacher Only |
| `POST` | `/api/attendance/session/end` | Close active session and lock records | Teacher Only |
| `POST` | `/api/attendance/verify` | Submit scanned QR payload & face embedding | Student Only |
| `GET` | `/api/attendance/session/:id/roster` | Fetch live classroom attendance roster | Teacher Only |
| `POST` | `/api/attendance/override` | Teacher manual attendance adjustment | Teacher Only |
| `GET` | `/api/attendance/export/pdf` | Export session attendance report as PDF | Teacher Only |
| `GET` | `/api/attendance/export/csv` | Export session attendance report as CSV | Teacher Only |

### Timetable & Class Schedules (`/api/timetable`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/timetable/active` | Detect currently active class session | Auth Required |
| `GET` | `/api/timetable` | List weekly schedule for user | Auth Required |
| `POST` | `/api/timetable` | Create new schedule entry with conflict check | Teacher Only |

---

## 🔒 Security Architecture Details

1. **HMAC-SHA256 Signed Payloads**:
   - `Payload = Base64(SessionID:Timestamp:Nonce)`
   - `Signature = HMAC-SHA256(Payload, SecretKey)`
   - Prevents payload forgery and tampered timestamps.

2. **Replay Protection**:
   - Single-use nonces are stored in memory/Redis cache during their active life window.
   - Any attempt to reuse a scanned QR payload is immediately blocked with `409 Conflict (Nonce Reused)`.

3. **Drift Window Enforcement**:
   - Millisecond timestamps are validated against server clock: `|T_server - T_payload| <= 2000ms`.
   - Screenshots shared via messaging apps arrive too late and fail timestamp drift checks.

4. **Zero-Knowledge Facial Embeddings**:
   - Client extracts `Float32Array(128)` facial feature vector locally.
   - Server computes Cosine Similarity against enrolled vector: `Cosine Distance < 0.45`.
   - Raw video feeds and images never leave the user's browser.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Developed with ❤️ by <a href="https://github.com/jaanvichouhan34">Jaanvi Chouhan</a>
</p>
