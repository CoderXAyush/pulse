# Pulse Frontend

Minimal React + Vite frontend for the video upload, processing, and streaming platform.

## Features

- Authentication (Register/Login) with JWT storage
- Dashboard with video list + safe/flagged filter
- Upload page with upload progress and real-time processing progress (Socket.io)
- Video player page with secure backend stream integration
- Clean Tailwind UI (minimal, neutral, responsive)

## Tech Stack

- React + Vite
- Tailwind CSS
- Axios
- Socket.io-client
- React Router

## Project Structure

```txt
src/
 ├── pages/
 ├── components/
 ├── services/
 ├── hooks/
 ├── context/
```

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB running locally (or via Docker)
- Backend available at `http://localhost:5000`

## Environment Setup

Create env file:

```bash
cp .env.example .env
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Backend Setup (Required)

From `backend/`:

```bash
cp .env.example .env
npm install
npm run dev
```

Recommended `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pulse_db
JWT_SECRET=replace-with-a-strong-secret
```

## Run Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Login and Role Setup (Important)

By default, newly registered users get role `viewer`.
`viewer` users can login and view data, but **cannot upload** videos.

To test upload/processing, update user role to `editor` or `admin` in MongoDB.

Mongo shell example:

```javascript
use pulse_db
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

Then login again.

## API/Socket Connection Check

- API base URL used by frontend: `VITE_API_BASE_URL`
- Socket server URL used by frontend: `VITE_SOCKET_URL`
- Ensure backend CORS is enabled (already configured in backend)
- Ensure backend Socket.io server is running on same host/port as API

## Main API Endpoints Used by Frontend

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/videos`
- `POST /api/videos/upload`
- `GET /api/videos/:id`
- `GET /api/videos/stream/:id`

Socket event:

- `processingProgress` payload:
  - `videoId`
  - `progress`
  - `stage`

## Quick End-to-End Test

1. Start backend (`npm run dev` in `backend/`)
2. Start frontend (`npm run dev` in `frontend/`)
3. Register user
4. Promote role to `editor` or `admin` in DB
5. Login
6. Upload `.mp4/.mov/.avi` from Upload page
7. Watch processing progress update in real-time
8. Open Dashboard and play video in Video Player page

## Build

```bash
npm run build
npm run preview
```
