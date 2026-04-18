# Nexus Tasks — MERN Task Management

Full-stack task management with JWT authentication, role-based access (admin vs user), PDF attachments (up to three per task, enforced server-side), and a React dashboard with filters.

## Stack

- **Server** (`/server`): Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Multer  
- **Client** (`/client`): React (Vite), Tailwind CSS, Redux Toolkit  
- **Ops**: Docker Compose + Dockerfiles for client and server

## Prerequisites

- Node.js 20+ (recommended)  
- npm  
- MongoDB Atlas URI (already referenced in `server/.env` for this assignment)  
- Docker Desktop (optional, for containerized run)

## Environment

`server/.env` is included with:

- `PORT=5001`  
- `MONGO_URI` — MongoDB Atlas connection string  
- `JWT_SECRET` — signing secret for access tokens  
- `ADMIN_EMAIL` — optional. If set (e.g. `you@example.com`), the **first registration** using that exact email receives the `admin` role; everyone else registers as `user`.

**Security note:** Treat database credentials and `JWT_SECRET` as secrets. Do not commit real `.env` files to public repositories; rotate credentials if they are exposed.

## Local development

### 1. API server (port **5001**)

```bash
cd server
npm install
npm run dev
```

`npm run dev` uses Node’s built-in `--watch` flag. Use `npm start` for a non-watching process.

### 2. Web client (port **5173**)

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:5001`, so the browser calls same-origin `/api/...` during development.

Then open **http://localhost:5173** — register, sign in, manage tasks, and (if your account is `admin`) open **Admin** for all users and tasks.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (JSON: name, email, password) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET | `/api/tasks` | List tasks (`?status=&priority=`). User: own only. Admin: all. |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/attachments` | Multipart field `pdfs` (PDF only). **Max 3 files per task total** (Multer + controller). |
| DELETE | `/api/tasks/:id/attachments/:filename` | Remove one attachment |
| GET | `/api/tasks/:id/attachments/:filename` | Download PDF |
| GET | `/api/admin/users` | Admin only — list users |
| GET | `/api/admin/tasks` | Admin only — all tasks (`?status=&priority=&owner=userId`) |

## Docker

Build and run both services (API on host **5001**, static UI on host **5173** mapped to nginx **80**):

```bash
docker compose up --build
```

The client container proxies `/api` to the `server` service. Uploaded PDFs persist in the `task_uploads` volume.

## Project layout

```
server/src          Express app, models, routes, controllers, middleware
client/src          React app, Redux slices, pages, API client
docker-compose.yml  server + client + volume for uploads
```

## Assignment checklist

- [x] MERN backend with Mongoose models for users and tasks  
- [x] JWT register/login and bcrypt password hashing  
- [x] Task CRUD with title, description, status, priority, due date  
- [x] Multer PDF uploads, **hard limit of 3 PDFs per task** (route + controller)  
- [x] Admin sees all users/tasks; users see only their tasks  
- [x] React + Vite + Tailwind + Redux Toolkit  
- [x] Login, Register, Dashboard (filters), Admin panel  
- [x] Vite dev proxy `/api` → `http://localhost:5001`  
- [x] Dockerfiles and `docker-compose.yml`  
- [x] README with setup and run instructions  

---

Built for coursework — extend with tests, validation libraries, and production hardening as needed.
# Indika-AI-privte-limited-assignment
