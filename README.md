# Pulse

**Pulse** is a full-stack web app for uploading videos, running a simple automated “safety” pass on the server, and watching them in the browser. It includes **multi-tenant organizations**, **role-based access (RBAC)**, **real-time processing updates** over WebSockets, and a **dashboard + in-player** experience.

---

## Features

| Area | What you get |
|------|----------------|
| **Auth** | Email/password (JWT) and optional **Google Sign-In** |
| **Multi-tenant** | Each user belongs to an **organization**; videos are scoped by `organizationId` |
| **RBAC** | **Viewer** (read-only, no upload), **Editor** (upload & manage own uploads), **Admin** (e.g. list org users) |
| **Upload** | MP4 / MOV / AVI, size limit (100 MB), validation on the server |
| **Pipeline** | Stages: validation → storage → sensitivity check (demo) → streaming prep → completed; progress emitted per org room |
| **Dashboard** | Table: **#**, name, description, format, size, **uploaded** date/time, sortable columns, open/delete (by role) |
| **Playback** | Split view: **mini playlist** + custom player (fullscreen, **← / →** skip 10s, **↑ / ↓** volume) |
| **API** | REST + **Socket.io**; range requests for streaming |

---

## Tech stack

| Layer | Stack |
|--------|--------|
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, Socket.io client, Google OAuth widget |
| **Backend** | Node.js, Express, Mongoose, Multer, JWT (bcryptjs), Socket.io, Google auth library |
| **Database** | MongoDB 7 |
| **Containers** | Docker Compose (API + MongoDB) |

---

## Project layout

```
Pulse/
├── backend/                 # Express API + Socket.io
│   ├── config/              # env, DB
│   ├── controllers/         # auth, videos
│   ├── middleware/          # JWT, roles, upload, errors
│   ├── models/              # User, Video, Organization
│   ├── routes/
│   ├── services/            # processing, tenant migration
│   ├── sockets/
│   └── uploads/             # stored files (gitignored contents)
├── frontend/                # Vite + React SPA
│   └── src/
│       ├── components/
│       ├── context/         # Auth
│       ├── hooks/
│       ├── pages/           # Login, Register, Dashboard, Upload, Video player
│       └── services/        # API client
├── docker-compose.yml
├── package.json             # root scripts (dev both apps)
└── README.md
```

---

## Prerequisites

- **Node.js** 20+
- **MongoDB** locally, **or** Docker for Mongo + API

---

## Quick start (local)

### 1. Clone and install

```bash
git clone https://github.com/CoderXAyush/pulse.git
cd pulse
npm run install:all
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit **`backend/.env`**

- Set a strong **`JWT_SECRET`**
- **`MONGODB_URI`** — default `mongodb://127.0.0.1:27017/pulse_db`
- **`PORT`** — default **`5001`** for local dev
- **`GOOGLE_CLIENT_ID`** — optional; required only if you use Google login

Edit **`frontend/.env`**

- **`VITE_API_BASE_URL`** — e.g. `http://localhost:5001/api` (must match backend `PORT`)
- **`VITE_SOCKET_URL`** — e.g. `http://localhost:5001` (no `/api`)
- **`VITE_GOOGLE_CLIENT_ID`** — same as backend if using Google

### 3. Run

```bash
npm run dev
```

- **App:** [http://localhost:5173](http://localhost:5173)  
- **API:** `http://localhost:<PORT>/api` (default **5001**)

Or run separately:

```bash
npm run dev:backend    # from repo root
npm run dev:frontend
```

---

## Docker

```bash
cp backend/.env.example backend/.env
# Set JWT_SECRET in backend/.env. For Compose, MONGODB_URI is overridden in docker-compose.yml.
docker compose up --build
```

Compose maps the API to **port 5000** and sets **`PORT=5000`** in the container so it matches the published port. If you call the API from a browser on the host, use **`http://localhost:5000/api`** and point the frontend env at that host/port when testing against Docker.

---

## Roles (RBAC)

| Role | Typical use |
|------|-------------|
| **viewer** | Dashboard + playback only; **no** upload |
| **editor** | Upload, delete own videos, full playback |
| **admin** | Editor capabilities + e.g. `GET /api/organization/users` |

New **email/password** and **Google** sign-ups get their **own organization** and **`editor`** so they can upload. Change roles in MongoDB if you need viewers or admins:

```bash
cd backend && node scripts/checkUserRole.js you@example.com
```

---

## API overview

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| POST | `/api/auth/register` | — | |
| POST | `/api/auth/login` | — | |
| POST | `/api/auth/google` | — | ID token from Google |
| GET | `/api/health` | — | |
| GET | `/api/videos` | Bearer | Org-scoped list |
| POST | `/api/videos/upload` | Bearer | **Editor / admin** only |
| GET | `/api/videos/:id` | Bearer | Metadata |
| GET | `/api/videos/stream/:id` | Bearer | Video bytes (range support) |
| DELETE | `/api/videos/:id` | Bearer | **Editor** (own) / **admin** |
| GET | `/api/organization/users` | Bearer | **Admin** only |

Base URL: `http://localhost:<PORT>/api` (see `.env`).

---

## Realtime (Socket.io)

- Clients can send **`auth: { token: "<JWT>" }`** on connect.
- Server joins the socket to **`org:<organizationId>`**.
- Event **`processingProgress`**: `{ videoId, progress, stage }` (org-scoped).

---

## Scripts (repo root)

| Script | Purpose |
|--------|---------|
| `npm run install:all` | `npm install` in `backend` and `frontend` |
| `npm run dev` | Backend + frontend together (requires `concurrently`) |
| `npm run dev:backend` | API only |
| `npm run dev:frontend` | Vite only |
| `npm run build` | Production build of the frontend |
| `npm start` | Start backend (`node server.js`) |
| `npm run lint` | ESLint (frontend) |

---

## Security notes

- Never commit **`.env`** files (they are gitignored).
- Use a long random **`JWT_SECRET`** in production.
- Restrict **CORS** and **Socket.io** origins in production.
- Uploaded files live under **`backend/uploads/`**; back up and scan as needed for real deployments.
