# EthioTelecom Project Manager

Full-stack **project management** system for Ethio Telecom — NestJS API, Next.js UI, Prisma, and Neon/PostgreSQL.

Projects contain tasks. When **every task is `DONE`**, the project is **auto-completed** by the API.

## Monorepo layout

```
apps/
  web/          # Next.js 16 frontend (deploy this folder)
  api/          # NestJS backend (deploy this folder)
packages/
  database/     # Prisma schema, migrations, seed
```

| Deploy target | Path | Port |
|---------------|------|------|
| Frontend | [`apps/web`](apps/web) | `3000` |
| Backend | [`apps/api`](apps/api) | `4000` |

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, TanStack Table
- **Backend:** NestJS 11, Passport JWT, Swagger (`/api/docs`)
- **Database:** PostgreSQL via Prisma 7 (Neon-ready `DATABASE_URL`)
- **Extras:** Cloudinary uploads, Resend password reset, SSE notifications

## Quick start (local)

### 1. Environment

```bash
cp .env.example .env
cp .env packages/database/.env
cp .env apps/api/.env
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' > apps/web/.env.local
```

For **Neon** (recommended), see [`docs/NEON.md`](docs/NEON.md) or run:

```bash
./scripts/use-neon.sh "postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

### 2. Install & migrate

```bash
npm install
npm run db:deploy
npm run db:seed
```

Instructor walkthrough: [`docs/DEMO.md`](docs/DEMO.md)

### 3. Run API + Web

```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

**Windows note:** if you see `Cannot find module '../lightningcss.win32-x64-msvc.node'`, reinstall native CSS binaries from the repo root:

```powershell
Remove-Item -Recurse -Force apps\web\.next -ErrorAction SilentlyContinue
npm install
npm install lightningcss-win32-x64-msvc @tailwindcss/oxide-win32-x64-msvc -w @ethio/web
npm run dev:web
```

- Web: http://localhost:3000  
- API: http://localhost:4000/api  
- Swagger: http://localhost:4000/api/docs  

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@ethiotelecom.et` | `password123` | ADMIN |
| `staff1@ethiotelecom.et` | `password123` | USER (project owner) |
| `staff2@ethiotelecom.et` | `password123` | USER (member) |

## Core product rules

- Users belong to many projects via `ProjectMember` (`OWNER` | `MEMBER`)
- Global roles: `USER` | `ADMIN`
- Task statuses: `TODO` | `IN_PROGRESS` | `DONE`
- Project statuses: `ACTIVE` | `COMPLETED`
- Completing the last remaining task sets the project to `COMPLETED` and writes `PROJECT_AUTO_COMPLETED`
- Reopening a task on a completed project sets it back to `ACTIVE`

## Features

- Project list with **progress rings** and overdue warnings
- Project detail: members invite, **Kanban** + table toggle, activity
- Task detail: comments, @mentions, images, activity timeline
- Dashboard analytics (Recharts)
- Admin: users, divisions, Swagger link
- Notifications (SSE with polling fallback)

## Deploy separately

### Backend (`apps/api`)

```bash
docker build -f apps/api/Dockerfile -t ethio-pm-api .
docker run -p 4000:4000 --env-file .env ethio-pm-api
```

Required env: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `APP_URL`

### Frontend (`apps/web`)

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=https://your-api.example.com/api \
  -t ethio-pm-web .
docker run -p 3000:3000 ethio-pm-web
```

Or use `docker compose up --build` for local Postgres + api + web.

## Instructor demo checklist

1. Sign in as admin → open Dashboard charts  
2. Open **Projects** → show progress rings  
3. Open an ACTIVE project → Kanban → drag/mark remaining tasks `DONE`  
4. Watch project badge flip to **COMPLETED** automatically  
5. Invite a member / show OWNER vs MEMBER  
6. Open Swagger at `/api/docs` and authorize with JWT  
7. Show Admin divisions + users  

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Next.js dev server |
| `npm run dev:api` | NestJS watch mode |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:deploy` | Prisma migrate deploy |
| `npm run db:seed` | Seed demo data |
| `npm run build` | Build database, api, web |
