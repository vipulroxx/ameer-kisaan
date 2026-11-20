# Free production hosting

Ameer Kisaan runs in production on free tiers that need **no payment card**:

| Part | Service | Free allowance (checked Nov 2026) |
|---|---|---|
| Web app + API (one service, one origin) | [Render](https://render.com) free web service | 750 instance-hours/month, 512 MB RAM |
| Database | [Supabase](https://supabase.com) Postgres | 500 MB |
| Report photos | Supabase Storage (S3 protocol) | 1 GB |
| Kisaan AI answers | [Groq](https://console.groq.com) (OpenAI-compatible) | per-model daily request caps |
| Knowledge-base search embeddings | [Google AI Studio](https://aistudio.google.com) Gemini embeddings | per-minute/day caps |

Free terms change; check each provider's pricing page.

## How it fits together

- `Dockerfile.render` builds the React app and bundles it with the FastAPI API. The API serves the web
  app (`STATIC_DIR`) with the same security headers as `deploy/security-headers.conf`, so the browser and
  API share one origin and the `SameSite=Strict` refresh cookie works.
- With `DATABASE_URL` set, the API stores its tables in Postgres through `app/db/pgtable.py`, a
  DynamoDB-compatible layer. Route code is unchanged. The test suite runs against both backends, and
  `tests/test_pgtable.py` checks the two give identical results.
- `PHOTO_URL_MODE=proxy` serves private report photos through short-lived HMAC-signed links from the
  API, so any S3-compatible bucket works.
- `.github/workflows/keepalive.yml` pings `/health/ready` every 5 minutes. That keeps Render from
  sleeping (it sleeps after 15 idle minutes) and Supabase from pausing (it pauses after 7 idle days).
  It needs the repository variable `PRODUCTION_URL`. GitHub disables scheduled workflows after 60 days
  without repository activity; re-enable it in the Actions tab if that happens.

The AWS stack in `infra/terraform` is still available for paid, highly available hosting.

## Deploy

1. Create the four free accounts and fill in `~/.config/ameer-kisaan/prod.env` (Supabase database URL
   and S3 keys, Groq key, Gemini key, Render API key).
2. Create the Render web service from `render.yaml` (Blueprint), or with the Render API using the same
   settings, and set the `sync: false` variables. Generate `FIELD_ENCRYPTION_KEY` once with
   `python3 -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())"`. Keep it forever,
   because it decrypts stored Aadhaar/PAN numbers.
3. Create the private bucket `ameer-kisaan-uploads` in Supabase Storage.
4. Every push to `main` redeploys automatically.

## Client IP behind Render

Rate limits and audit logs need the visitor's real IP. On Render, Cloudflare sets `CF-Connecting-IP` and rejects
requests that try to forge it, while `X-Forwarded-For` keeps whatever the client sent. So production uses
`CLIENT_IP_HEADER=cf-connecting-ip`. This was verified by sending forged headers to the live service.

## Limits to know

- One small instance (less than 1 CPU, 512 MB). Fine for a launch, but slows down under heavy concurrent use.
- Groq and Gemini free tiers cap requests per minute and per day. Past the cap, Kisaan AI answers
  "temporarily unavailable" until the window resets; the rest of the app is unaffected.
- On the Gemini free tier, Google may use requests (knowledge-base text and farmers' questions, which
  are embedded for search) to improve its products. Switch to a paid key to opt out.
