# Pulse Backend

Express + MongoDB API server with JWT auth, video upload/processing, and Socket.io real-time updates.

## Setup

```bash
cp .env.example .env   # then edit JWT_SECRET
npm install
npm run dev            # starts with nodemon
```

## Environment Variables

| Variable       | Default                                    | Description             |
|----------------|--------------------------------------------|-------------------------|
| `NODE_ENV`     | `development`                              | App environment         |
| `PORT`         | `5000`                                     | Server port             |
| `MONGODB_URI`  | `mongodb://127.0.0.1:27017/pulse_db`       | MongoDB connection URI  |
| `JWT_SECRET`   | `change-this-in-production`                | JWT signing secret      |

## API Endpoints

| Method | Route                    | Auth   | Role            | Description         |
|--------|--------------------------|--------|-----------------|---------------------|
| GET    | `/api/health`            | —      | —               | Health check        |
| POST   | `/api/auth/register`     | —      | —               | Register user       |
| POST   | `/api/auth/login`        | —      | —               | Login user          |
| GET    | `/api/protected`         | Bearer | Any             | Auth test           |
| GET    | `/api/admin`             | Bearer | admin           | Admin test          |
| GET    | `/api/videos`            | Bearer | Any             | List user's videos  |
| POST   | `/api/videos/upload`     | Bearer | editor, admin   | Upload video        |
| GET    | `/api/videos/:id`        | Bearer | Owner or admin  | Video metadata      |
| GET    | `/api/videos/stream/:id` | Bearer | Owner or admin  | Stream video file   |

## Socket Events

- `processingProgress` → `{ videoId, progress, stage }`

## Project Layout

```
config/       — DB connection & env config
controllers/  — Route handlers (auth, video, health)
middleware/   — Auth, error handler, upload (multer)
models/       — Mongoose schemas (User, Video)
routes/       — Express route definitions
services/     — Video processing pipeline
sockets/      — Socket.io initialization
uploads/      — Stored video files
utils/        — AppError class
```
