# Free production hosting

Ameer Kisaan runs in production on free tiers that need **no payment card**:

| Part | Service | Free allowance (checked Nov 2026) |
|---|---|---|
| Web app + API (one service, one origin) | [Render](https://render.com) free web service | 750 instance-hours/month, 5 GB bandwidth/month, 512 MB RAM |
| Database | [Supabase](https://supabase.com) Postgres | 500 MB |
| Report photos | Supabase Storage (S3 protocol) | 1 GB |
| Kisaan AI answers | [Groq](https://console.groq.com) (OpenAI-compatible) | per-model daily request caps |
| Knowledge-base search embeddings | [Google AI Studio](https://aistudio.google.com) Gemini embeddings | per-minute/day caps |

Free terms change; check each provider's pricing page.

## Zero-cost rules (must stay ₹0)

Ameer Kisaan must never cost money. Free plans cannot bill you without a payment card, and when a
free limit runs out the affected part **pauses until it resets**; it never charges you. Keep it that way:

1. **Never add a payment card or billing** to Render, Supabase, Groq, Google AI Studio / Google Cloud,
   Firebase (stay on Spark) or GitHub. A card is what turns limits into bills.
2. **Never apply `infra/terraform`.** That AWS stack costs about $130-180/month. It refuses to plan or apply
   unless `accept_aws_charges = true`, and the AWS deploy workflow has been removed.
3. **Keep the GitHub repositories public.** Actions minutes are free only for public repos. Every workflow
   skips itself on a private repo, so making one private stops CI rather than billing it.
4. **One free Render service only.** The 750 free hours a month are shared across all free services, and this
   one uses about 744 when kept awake.
5. **Keep the app non-commercial.** Open-Meteo's free weather API is for non-commercial use.

The application enforces the AI limits itself: `AI_DAILY_CHAT_REQUESTS` (900), `AI_DAILY_CHAT_TOKENS`
(180,000) and `AI_DAILY_EMBED_REQUESTS` (900) cap calls to Groq and Gemini per UTC day, below their free
quotas. Past a cap, Kisaan AI tells farmers it is back tomorrow after 5:30 AM India time, and no request is
sent. So even a card added by mistake could not raise AI usage beyond the free allowance.

Bandwidth is the limit to watch: Render's free 5 GB covers a few thousand visits. The two landing-page
videos (~12 MB each) are the heaviest download. Moving them to YouTube would remove most of that load.

## How it fits together

- `Dockerfile.render` builds the React app and bundles it with the FastAPI API. The API serves the web
  app (`STATIC_DIR`) with the same security headers as `deploy/security-headers.conf`, so the browser and
  API share one origin and the `SameSite=Strict` refresh cookie works.
- With `DATABASE_URL` set, the API stores its tables in Postgres through `app/db/pgtable.py`, a
  DynamoDB-compatible layer. Route code is unchanged. The test suite runs against both backends, and
  `tests/test_pgtable.py` checks the two give identical results.
- `PHOTO_URL_MODE=proxy` serves private report photos through short-lived HMAC-signed links from the
  API, so any S3-compatible bucket works.
- Keep-awake: GitHub runs scheduled workflows far less often than asked (every few hours, not every 5
  minutes), so the reliable pinger is Supabase itself. Run once in the Supabase SQL Editor:
  `create extension if not exists pg_cron; create extension if not exists pg_net;
  select cron.schedule('keep-render-awake', '*/5 * * * *', $$ select net.http_get('https://ameer-kisaan.onrender.com/health/ready', timeout_milliseconds := 60000) $$);`
  Both extensions are included in the free plan.
- `.github/workflows/keepalive.yml` also pings `/health/ready` every 5 minutes. That keeps Render from
  sleeping (it sleeps after 15 idle minutes) and Supabase from pausing (it pauses after 7 idle days).
  It needs the repository variable `PRODUCTION_URL`. GitHub disables scheduled workflows after 60 days
  without repository activity; re-enable it in the Actions tab if that happens.

The AWS stack in `infra/terraform` is kept for reference only. It is paid (about $130-180/month) and is locked behind `accept_aws_charges`.

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
