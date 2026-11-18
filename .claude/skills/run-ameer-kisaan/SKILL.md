---
name: run-ameer-kisaan
description: Run, start, launch, screenshot, or smoke-test the Ameer Kisaan app (React frontend + FastAPI backend) locally without Docker, log in, and drive tabs like Kisaan AI, Inventory, Forum, Issues in headless Chrome. Also how to run the backend pytest suite.
---

# Run Ameer Kisaan

The app is a CRA React frontend (repo root, port 3000) and a FastAPI backend
(`src/Backend` git submodule, port 8000) that sits on DynamoDB and S3.
`docker-compose.yml` is the documented way to run it. This skill runs it
**natively** instead: `moto_server` stands in for DynamoDB and S3, and the
backend's built-in `fake` LLM/embedding providers replace Ollama. You drive it
with a Playwright script in headless Chrome.

All paths are relative to the repo root. Verified on macOS (Darwin 25,
Python 3.13, Node with the repo's `node_modules`, Google Chrome installed).
It has not been verified in a Linux container.

## Prerequisites

- `python3` (3.13 used), `node`/`npm`, `curl`.
- Initialized submodules: `git submodule update --init` (`src/Backend` and `src/Components`).
- Google Chrome. Without it, run `.claude/skills/run-ameer-kisaan/.venv/bin/playwright install chromium` and the driver falls back to the bundled Chromium (that fallback is unverified).

## Run (agent path)

```bash
.claude/skills/run-ameer-kisaan/start.sh        # first run creates .venv + installs deps (~1-2 min)
.claude/skills/run-ameer-kisaan/.venv/bin/python .claude/skills/run-ameer-kisaan/driver.py
.claude/skills/run-ameer-kisaan/stop.sh
```

- `start.sh` starts moto (:5055), the backend (:8000, `/docs` works), and the dev server (:3000). It then seeds the user **`farmer@example.com` / `Str0ng-Passw0rd!x`**. Logs and pids go to `.claude/skills/run-ameer-kisaan/out/`.
- `driver.py [tab ...]` logs in through the UI and clicks each named tab (default: `"Kisaan AI" Inventory`). On Kisaan AI it asks a question and waits for a cited `[1]` source. It saves `out/<n>-<tab>.png` and exits 1 on unexpected console errors. Tab names are Weather, Crops, Recommendations, Issues, "Kisaan AI", Schemes, Inventory, "Community Forum".
- **Look at the PNGs** (Read tool). A login form in `1-home.png` means the login failed.
- To test only the API: `curl localhost:8000/api/v1/...` after logging in via `POST /api/v1/auth/login` (it returns an access token, which you send as a Bearer token).

## Test

```bash
cd src/Backend && ../../.claude/skills/run-ameer-kisaan/.venv/bin/python -m pytest   # 35 passed
```

## Run (human path)

`docker compose up --build` per `docker-compose.yml`. It needs Docker and pulls about 2.3 GB of Ollama models. It was not available or verified here.

## Gotchas

- **No Docker needed.** `app/main.py` creates the DynamoDB tables and the S3 bucket at startup when `APP_ENV=local`, so an empty moto server is enough. All data is in memory and gone after `stop.sh`, which is why `start.sh` re-seeds the user.
- **AI answers are fake.** `LLM_PROVIDER=fake` echoes the retrieved passages ("Based on the guides [1]: …"). Retrieval over `src/Backend/knowledge/` is real. For real answers, run `ollama serve`, pull `llama3.2:3b` and `nomic-embed-text`, and set `LLM_PROVIDER=ollama EMBEDDINGS_PROVIDER=ollama OLLAMA_BASE_URL=http://localhost:11434` in `start.sh`.
- **Secrets are generated per run** (`JWT_SECRET` ≥32 chars, `FIELD_ENCRYPTION_KEY` base64 of 32 bytes). Restarting the backend invalidates sessions.
- `COOKIE_SECURE=false` is required on plain http. Otherwise the refresh cookie is dropped and a reload logs you out.
- The frontend reaches the backend through the CRA `"proxy": "http://localhost:8000"` in `package.json`. The backend must be on 8000.
- Two console errors are expected and filtered by the driver: `401` from `POST /auth/refresh` on first load (no session yet) and `404` for `/service-worker.js` (the dev server doesn't serve it).
- In the login form, `get_by_label("Email")` matches two elements, because MUI tooltip buttons carry aria-labels. Use `input[name=email]` / `input[name=password]`.
- Killing the `npm start` pid leaves `node …/react-scripts/scripts/start.js` holding :3000. `stop.sh` pkills that pattern too.
- The dev build prints dozens of `no-unused-vars` lint warnings. These are normal and only "Failed to compile" matters.

## Troubleshooting

- `ModuleNotFoundError: No module named 'app'` from `.venv/bin/pytest`: use `python -m pytest` from `src/Backend`, which puts the cwd on `sys.path`.
- `could not connect to ollama server`: expected. This setup uses the fake providers and doesn't need Ollama.
- `backend failed` from `start.sh`: read `out/backend.log`. Usually port 8000 or 5055 is still taken by an earlier run, so run `stop.sh` first.
