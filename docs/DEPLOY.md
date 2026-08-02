# Deploy: Railway (API) + Vercel (Web)

Target setup:

| App | Host | Source |
|-----|------|--------|
| NestJS API | **Railway** | repo root + `apps/api/Dockerfile` |
| Next.js UI | **Vercel** | Root Directory = `apps/web` |
| Postgres | **Neon** (`ethio_pm`) | already migrated |

---

## 0) Clean up the old issue-tracker Railway service

You do **not** need the previous Railway Postgres anymore. This app uses **Neon** (`ethio_pm`).

In Railway:
1. Open the old **Postgres** service (from the issue tracker)
2. Disconnect it from the API service (remove variable references if linked)
3. **Delete** the Postgres service (or leave it stopped — do not use its `DATABASE_URL`)
4. On the API service, set `DATABASE_URL` to your **Neon** `ethio_pm` pooled URL only

Do **not** keep both Railway Postgres and Neon `DATABASE_URL`s — only Neon.

### Clear old Pre-deploy Command (common “predeploy command failed”)

The old issue tracker often had a Railway **Pre-deploy Command** like:

```bash
npx prisma migrate deploy
```

That path no longer exists in the monorepo, so Railway reports **predeploy command failed**.

Fix:
1. Open your **API service** → **Settings** → **Deploy**
2. Find **Custom Pre-deploy Command** / **Pre-deploy Command**
3. **Delete / clear it** (leave empty)
4. Also clear any custom **Start Command** so the Dockerfile `CMD` is used  
   (Dockerfile already runs `npm run db:deploy && npm run start:prod -w @ethio/api`)
5. Redeploy

---

## 1) Deploy API on Railway

1. Go to [railway.app](https://railway.app) → open your existing API service (or **New Project** → **Deploy from GitHub repo**)
2. Select `EstifanosBesfat/issue_tracker` (branch `master`)
3. Railway should pick up [`railway.toml`](../railway.toml) (Docker build)
4. Open the service → **Variables** → add/replace:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon pooled URL for `ethio_pm` (`?sslmode=require`) |
| `JWT_SECRET` | long random string |
| `PORT` | `4000` (or leave Railway default; Nest reads `PORT`) |
| `FRONTEND_URL` | your Vercel URL later, e.g. `https://xxx.vercel.app` |
| `APP_URL` | same as `FRONTEND_URL` |
| `NODE_ENV` | `production` |

Optional: `RESEND_API_KEY`, `EMAIL_FROM`, Cloudinary vars.

5. **Settings → Networking → Generate Domain**  
   Copy URL, e.g. `https://ethio-pm-api.up.railway.app`
6. Confirm health: open `https://<railway-domain>/api/docs`

> First boot runs `prisma migrate deploy` then starts Nest.

---

## 2) Deploy Web on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import same GitHub repo
2. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| Framework | Next.js (auto) |
| Install / Build | from `apps/web/vercel.json` |

3. **Environment Variables**:

| Variable | Value | Environments |
|----------|-------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://<railway-domain>/api` | Production, Preview |

4. Deploy
5. Copy the Vercel URL, e.g. `https://ethio-pm.vercel.app`

---

## 3) Connect them (important)

Update Railway variables:

```text
FRONTEND_URL=https://<your-vercel-app>.vercel.app
APP_URL=https://<your-vercel-app>.vercel.app
```

Redeploy Railway (or restart) so CORS allows the Vercel origin.

If you use a custom domain later, put both origins comma-separated:

```text
FRONTEND_URL=https://app.example.com,https://ethio-pm.vercel.app
```

---

## 4) Smoke test production

1. Open Vercel URL → sign in  
   `admin@ethiotelecom.et` / `password123`
2. Dashboard loads
3. Projects → open Fiber → mark tasks Done → project auto-completes
4. Open `https://<railway>/api/docs` → Swagger works

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | `FRONTEND_URL` on Railway must exactly match Vercel URL (https, no trailing slash) |
| API 502 on Railway | Check deploy logs; confirm `DATABASE_URL` points to `ethio_pm` |
| Vercel build fails on workspaces | Root Directory must be `apps/web`; installCommand uses repo root |
| Login works but data empty | Wrong Neon DB — must be `ethio_pm`, not `neondb` |
| Images / reset email | Set Cloudinary / Resend env vars (optional) |

---

## Neon URL reminder

Use the **pooled** connection string database **`ethio_pm`**:

```text
postgresql://neondb_owner:***@ep-xxxx-pooler....neon.tech/ethio_pm?sslmode=require
```
