#!/usr/bin/env bash
# Start the full Ameer Kisaan stack natively (no Docker):
#   moto_server :5055  (stands in for DynamoDB + S3)
#   FastAPI     :8000  (src/Backend, fake AI providers)
#   React dev   :3000  (CRA, proxies /api -> :8000)
# Run from the repo root. Logs + pids go to .claude/skills/run-ameer-kisaan/out/.
set -euo pipefail
SK="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$SK/../../.." && pwd)"
OUT="$SK/out"; VENV="$SK/.venv"; mkdir -p "$OUT"

if [ ! -x "$VENV/bin/uvicorn" ]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q -r "$ROOT/src/Backend/requirements-dev.txt" "moto[server]==5.2.5" playwright
fi
[ -d "$ROOT/node_modules" ] || (cd "$ROOT" && npm install)

"$VENV/bin/moto_server" -p 5055 > "$OUT/moto.log" 2>&1 & echo $! > "$OUT/moto.pid"

JWT=$("$VENV/bin/python" -c "import secrets;print(secrets.token_urlsafe(48))")
FEK=$("$VENV/bin/python" -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())")
( cd "$ROOT/src/Backend" && env APP_ENV=local JWT_SECRET="$JWT" FIELD_ENCRYPTION_KEY="$FEK" \
    COOKIE_SECURE=false CORS_ORIGINS=http://localhost:3000 \
    DYNAMODB_ENDPOINT_URL=http://127.0.0.1:5055 S3_ENDPOINT_URL=http://127.0.0.1:5055 \
    S3_PUBLIC_ENDPOINT_URL=http://127.0.0.1:5055 AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local \
    AWS_REGION=ap-south-1 LLM_PROVIDER=fake EMBEDDINGS_PROVIDER=fake INDEX_CACHE_DIR="$OUT/index" \
    "$VENV/bin/uvicorn" app.main:app --port 8000 > "$OUT/backend.log" 2>&1 & echo $! > "$OUT/backend.pid" )
for i in $(seq 60); do curl -sf localhost:8000/docs >/dev/null && break; sleep 1; done
curl -sf localhost:8000/docs >/dev/null || { echo "backend failed"; tail -30 "$OUT/backend.log"; exit 1; }
echo "backend up :8000"

( cd "$ROOT" && BROWSER=none PORT=3000 npm start > "$OUT/frontend.log" 2>&1 & echo $! > "$OUT/frontend.pid" )
for i in $(seq 150); do grep -qE "webpack compiled|Failed to compile" "$OUT/frontend.log" && break; sleep 2; done
grep -q "Failed to compile" "$OUT/frontend.log" && { tail -40 "$OUT/frontend.log"; exit 1; }
echo "frontend up :3000"

# Seed a test user (409/400 on re-run is fine).
curl -s -XPOST localhost:8000/api/v1/auth/register -H 'content-type: application/json' \
  -d '{"username":"Test Farmer","email":"farmer@example.com","phoneNumber":"9876543210","password":"Str0ng-Passw0rd!x"}' >/dev/null || true
echo "seeded farmer@example.com / Str0ng-Passw0rd!x"
