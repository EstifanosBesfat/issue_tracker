# Deploy: Vercel (API) + Vercel (Web)

Target setup:

| App | Host | Source |
|-----|------|--------|
| NestJS API | **Vercel** (serverless) | Root Directory = `apps/api` |
| Next.js UI | **Vercel** | Root Directory = `apps/web` |
| Postgres | **Neon** (`ethio_pm`) | already migrated |

---

## 1) Deploy API on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo
2. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/api` |
| Framework | Other / Nest (uses `apps/api/vercel.json`) |
| Install / Build | from `apps/api/vercel.json` |

3. **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon pooled URL for `ethio_pm` (`?sslmode=require`) |
| `JWT_SECRET` | long random string |
| `FRONTEND_URL` | your web Vercel URL, e.g. `https://teletasksync.vercel.app` |
| `APP_URL` | same as `FRONTEND_URL` |
| `NODE_ENV` | `production` |

Optional: `RESEND_API_KEY`, `EMAIL_FROM`, Cloudinary vars.

4. Deploy and copy the API URL, e.g. `https://ethio-pm-api.vercel.app`
5. Confirm health: open `https://<api-vercel-domain>/api/docs`

> Run migrations against Neon separately when schema changes:  
> `npm run db:deploy` (from repo root, with `DATABASE_URL` set).

### Local API (serverless-style)

```bash
# Classic Nest watch (recommended while developing)
npm run dev:api

# Or simulate Vercel serverless locally (from apps/api)
cd apps/api && npx vercel dev --listen 4000
```

---

## 2) Deploy Web on Vercel

1. **Add New Project** → same GitHub repo (second Vercel project)
2. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `apps/web` |
| Framework | Next.js (auto) |
| Install / Build | from `apps/web/vercel.json` |

3. **Environment Variables** (recommended even if `.env.production` exists):

| Variable | Value | Environments |
|----------|-------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://teleprojectmanager-three.vercel.app/api` | Production, Preview |

4. Deploy and copy the web URL (e.g. `https://teletasksync.vercel.app`)

> `apps/web/.env.production` already defaults to the Vercel API URL above.  
> Setting the same value in the Vercel dashboard overrides it and is clearer for Previews.

---

## 3) Connect them (important)

Current production pair:

| App | URL |
|-----|-----|
| Web | `https://teletasksync.vercel.app` |
| API | `https://teleprojectmanager-three.vercel.app` |

On the **API** Vercel project, set:

```text
FRONTEND_URL=https://teletasksync.vercel.app
APP_URL=https://teletasksync.vercel.app
```

On the **Web** Vercel project, set:

```text
NEXT_PUBLIC_API_URL=https://teleprojectmanager-three.vercel.app/api
```

Redeploy **both** after changing env vars (web must rebuild so `NEXT_PUBLIC_*` is baked in).

If you use a custom domain later, put both origins comma-separated on the API:

```text
FRONTEND_URL=https://app.example.com,https://teletasksync.vercel.app
```

---

## 4) Smoke test production

1. Open web Vercel URL → sign in  
   `admin@ethiotelecom.et` / `password123`
2. Dashboard loads
3. Projects → open a project → mark tasks Done → project auto-completes
4. Open `https://<api-vercel>/api/docs` → Swagger works

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | `FRONTEND_URL` on the API project must exactly match the web origin (https, no trailing slash) |
| API 500 on Vercel | Check function logs; confirm `DATABASE_URL` points to `ethio_pm` pooled Neon URL |
| Vercel build fails on workspaces | Root Directory must be `apps/api` or `apps/web`; installCommand uses repo root |
| Login works but data empty | Wrong Neon DB — must be `ethio_pm`, not `neondb` |
| SSE notifications drop | Expected on serverless; UI falls back to polling |
| Images / reset email | Set Cloudinary / Resend env vars (optional) |

---

## Neon URL reminder

Use the **pooled** connection string database **`ethio_pm`**:

```text
postgresql://neondb_owner:***@ep-xxxx-pooler....neon.tech/ethio_pm?sslmode=require
```
