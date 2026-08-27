# ??? Aproxy — Smart Anti-Proxy Attendance & Biometric Verification System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Aproxy** is a full-stack, enterprise-grade classroom attendance verification engine that completely eliminates proxy attendance, buddy-punching, and remote credential sharing using **cryptographically signed ephemeral rotating QR codes (HMAC-SHA256)** and **client-side biometric facial descriptor verification with active liveness detection**.

---

## ?? Key Engineering Highlights

- ? **1-Second Dynamic Ephemeral QR Codes**: QR codes rotate every 1000ms via WebSockets. Each payload contains a cryptographic HMAC-SHA256 signature, millisecond timestamp, and single-use nonce. Screenshots sent via chat apps become invalid within 2 seconds.
- ??? **Client-Side Biometric Verification**: Extracts 128-dimensional Float32 facial embeddings using \@vladmandic/face-api\ without transmitting raw biometric photos to the server (zero-knowledge privacy).
- ??? **Active Liveness Detection**: Optical eye aspect ratio (EAR) and head pose challenge reject static photos, printed paper, and phone screen replays.
- ?? **Real-Time Live Classroom Roster**: Sub-50ms WebSocket broadcast pipeline delivering instant attendance tallies, live attendance rings, and status alerts to the teacher dashboard.
- ?? **Smart Timetable & Active Class Detection**: Automatically highlights currently active class sessions based on local time with schedule conflict validation.
- ?? **Tamper-Evident Teacher Overrides & Audit Trail**: Manual attendance adjustments require structured reason codes and are permanently tracked in an immutable \AuditLog\.
- ?? **Analytics & Compliance Reporting**: Instant one-click PDF and CSV report generation for institutional accreditation and attendance compliance (< 75% alerts).
- ?? **Linear/Vercel-Grade Design System**: Fluid dark/light theme, glassmorphic UI, smooth Framer Motion micro-interactions, and keyboard navigation.

---

## ??? Architecture & Security Workflow

\\\
                                  +---------------------------+
                                  ¦   Teacher Launches Class  ¦
                                  +---------------------------+
                                                ¦
                                                ?
                          +-------------------------------------------+
                          ¦   WebSocket Pushes Signed Ephemeral QR    ¦
                          ¦   Payload: { sessionId, token, nonce,     ¦
                          ¦              timestamp, HMAC-SHA256 }     ¦
                          ¦         (Rotates every 1000ms)            ¦
                          +-------------------------------------------+
                                                ¦
                 +-------------------------------------------------------------+
                 ?                                                             ?
   +---------------------------+                                 +---------------------------+
   ¦    Student Face ID Check  ¦                                 ¦   Student Camera QR Scan  ¦
   ¦  • Active Blink Liveness  ¦ --? [Biometric Verified] ------?¦  • Captures dynamic token ¦
   ¦  • 128D Vector Match <0.45¦                                 ¦  • Sends to verify endpoint¦
   +---------------------------+                                 +---------------------------+
                                                                               ¦
                                                                               ?
                                                                 +---------------------------+
                                                                 ¦     Backend Validation    ¦
                                                                 ¦ • Verify HMAC signature   ¦
                                                                 ¦ • Timestamp drift < 2000ms¦
                                                                 ¦ • Atomic single-use nonce ¦
                                                                 ¦ • Idempotent DB upsert    ¦
                                                                 +---------------------------+
                                                                               ¦
                                                                               ?
                                                                 +---------------------------+
                                                                 ¦  WebSocket Instant Broadcast¦
                                                                 ¦  Teacher Live Roster: +1  ¦
                                                                 +---------------------------+
\\\

---

## ??? Tech Stack

### Frontend
- **Framework**: React 18 (Vite) + TypeScript
- **Styling**: Tailwind CSS + CSS Variables (Dark / Light mode)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Biometrics & Vision**: \@vladmandic/face-api\ + WebCam API
- **QR Engine**: \qrcode.react\ + \html5-qrcode\
- **State Management**: Zustand
- **Charts & Feedback**: Recharts + Sonner (Toasts) + Canvas Confetti

### Backend
- **Runtime**: Node.js + Express (TypeScript)
- **Database**: MongoDB + Mongoose ODM
- **Real-Time**: Socket.IO WebSockets
- **Cryptography**: Node.js \crypto\ (HMAC-SHA256) + JWT + bcryptjs
- **Validation**: Zod
- **Report Generation**: PDFKit + Fast-CSV

---

## ?? Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally on port 27017 or MongoDB Atlas URI)

### 2. Clone the Repository
\\\ash
git clone https://github.com/your-username/aproxy.git
cd aproxy
\\\

### 3. Backend Setup
\\\ash
cd server
npm install
\\\
Copy \.env.example\ to \.env\ and configure your settings:
\\\ash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aproxy
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
\\\

Start the backend server:
\\\ash
npm run dev
\\\

### 4. Frontend Setup
In a new terminal (root directory):
\\\ash
npm install
npm run dev
\\\

Open your browser at \http://localhost:5173\.

---

## ?? Testing Backend Services & Cryptography

The backend includes test scripts for verifying security layers:
\\\ash
cd server
npx tsx src/test-auth.ts          # Test JWT & Auth Pipeline
npx tsx src/test-timetable.ts     # Test Schedule & Conflict Engine
npx tsx src/test-session-e2e.ts   # Test 1s Ephemeral QR & HMAC Signature
npx tsx src/test-attendance.ts    # Test Nonce Replay & Atomic Upserts
npx tsx src/test-biometrics.ts    # Test 128D Embedding Cosine Similarity
npx tsx src/test-phase6.ts        # Test Audit Logs & PDF/CSV Export
\\\

---

## ?? License
MIT License. Built for production reliability and anti-fraud classroom attendance.
