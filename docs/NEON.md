# Neon setup (EthioTelecom Project Manager)

## 1. Create a Neon project

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign in
2. **New Project** → name it e.g. `ethio-project-manager`
3. Copy the **pooled** connection string (host contains `-pooler`)

It looks like:

```text
postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

## 2. Wire it into this repo

From the repo root:

```bash
chmod +x scripts/use-neon.sh
./scripts/use-neon.sh "postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
```

This will:

- write `DATABASE_URL` into `.env`, `packages/database/.env`, and `apps/api/.env`
- run `prisma migrate deploy`
- seed demo users/projects/tasks

## 3. Restart the API

```bash
npm run dev:api
npm run dev:web
```

Login: `admin@ethiotelecom.et` / `password123`

## Manual alternative

```bash
# put the Neon URL in all three places
export DATABASE_URL='postgresql://...@ep-xxxx-pooler....neon.tech/neondb?sslmode=require'
printf 'DATABASE_URL=%s\n' "$DATABASE_URL" | tee .env packages/database/.env apps/api/.env

npm run db:deploy
npm run db:seed
```

## Notes for your instructor

- App uses **Prisma + `pg` driver adapter** against Neon Postgres
- Prefer the **pooled** connection string for the NestJS API runtime
- `sslmode=require` is appended automatically by `scripts/use-neon.sh` if missing
