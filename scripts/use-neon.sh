#!/usr/bin/env bash
# Wire a Neon DATABASE_URL into the monorepo, migrate, and seed.
# Usage:
#   ./scripts/use-neon.sh "postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${1:-${DATABASE_URL:-}}"

if [[ -z "$URL" ]]; then
  echo "Usage: ./scripts/use-neon.sh \"<neon-pooled-connection-string>\""
  echo "Or:    DATABASE_URL=... ./scripts/use-neon.sh"
  exit 1
fi

if [[ "$URL" != *"sslmode="* ]]; then
  if [[ "$URL" == *"?"* ]]; then
    URL="${URL}&sslmode=require"
  else
    URL="${URL}?sslmode=require"
  fi
fi

write_env() {
  local file="$1"
  if [[ -f "$file" ]]; then
    if grep -q '^DATABASE_URL=' "$file"; then
      # portable in-place replace
      awk -v url="$URL" '
        BEGIN { done=0 }
        /^DATABASE_URL=/ { print "DATABASE_URL=" url; done=1; next }
        { print }
        END { if (!done) print "DATABASE_URL=" url }
      ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    else
      printf '\nDATABASE_URL=%s\n' "$URL" >> "$file"
    fi
  else
    printf 'DATABASE_URL=%s\n' "$URL" > "$file"
  fi
}

write_env "$ROOT/.env"
write_env "$ROOT/packages/database/.env"
write_env "$ROOT/apps/api/.env"

# Keep other required vars present in api/.env
if ! grep -q '^JWT_SECRET=' "$ROOT/apps/api/.env"; then
  echo 'JWT_SECRET=ethio-project-manager-dev-secret-change-me' >> "$ROOT/apps/api/.env"
fi
if ! grep -q '^PORT=' "$ROOT/apps/api/.env"; then
  echo 'PORT=4000' >> "$ROOT/apps/api/.env"
fi
if ! grep -q '^FRONTEND_URL=' "$ROOT/apps/api/.env"; then
  echo 'FRONTEND_URL=http://localhost:3000' >> "$ROOT/apps/api/.env"
fi
if ! grep -q '^APP_URL=' "$ROOT/apps/api/.env"; then
  echo 'APP_URL=http://localhost:3000' >> "$ROOT/apps/api/.env"
fi

mkdir -p "$ROOT/apps/web"
if [[ ! -f "$ROOT/apps/web/.env.local" ]]; then
  echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' > "$ROOT/apps/web/.env.local"
fi

echo "→ DATABASE_URL written to .env, packages/database/.env, apps/api/.env"
echo "→ Running migrate deploy + seed against Neon…"

cd "$ROOT"
npm run db:deploy
npm run db:seed

echo ""
echo "Neon is ready."
echo "  Restart API:  npm run dev:api"
echo "  Web:          npm run dev:web"
echo "  Login:        admin@ethiotelecom.et / password123"
