# Araland API

Bun + Elysia, Prisma 6.19, PostgreSQL. API contract: [`../../docs/API-CONTRACT.md`](../../docs/API-CONTRACT.md).

From the repository root, after `bun install`:

```sh
bun run db:generate
bun run --filter @araland/db deploy
bun run db:seed
bun run dev:api
```

The checked-in initial SQL migration is deployable with `deploy`; `db:push` is a development shortcut. Run `bun run --filter @araland/api typecheck` and `bun run test`. Integration tests use configured PostgreSQL, create unique test identities and workspaces, and remove those records and uploaded files afterward. They do not call SMS or paid AI providers.

## Environment

Scripts load the root `.env`. Never commit real credentials.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection |
| `API_PORT` | Default `4000` |
| `API_HOST` | Default `0.0.0.0`, enabling LAN device development |
| `API_PUBLIC_URL` | Public origin of this API, used for image URLs; use the LAN hostname for physical phone testing |
| `CORS_ORIGINS` | Comma-separated web origins; defaults to localhost 3000 and Expo 8081 |
| `AUTH_SECRET` | Random server-only secret, at least 32 characters in production; stabilizes OTP hashes across restarts |
| `AUTH_DEV_MODE` | Explicit `true` reveals a random development OTP in the response; forbidden in production |
| `KAVENEGAR_API_KEY` | Server-side Kavenegar credential |
| `KAVENEGAR_TEMPLATE` | Approved verification template name, with `token` for OTP |
| `OPENAI_API_KEY` | Server-side credential; missing key returns 503 |
| `OPENAI_IMAGE_MODEL` | Defaults to `gpt-image-2`, configurable for account access |
| `STORAGE_PATH` | Local storage directory, default `../../.storage` relative to the API app; use an absolute persistent path in deployment |
| `TRUST_PROXY` | Set `true` only behind a trusted proxy that overwrites `X-Forwarded-For` |

Seed creates the sample site at `/s/madar-studio` for `09121234567`. Request its random development OTP through the UI. No fixed bypass code exists.

## Guarantees and boundaries

- Private operations require an unexpired random bearer session and workspace ownership. Session tokens and OTP codes are stored as hashes. OTPs expire after 180 seconds, allow five guesses, are consumed atomically, and are limited per phone and network address. Sessions expire after 30 days; `POST /api/auth/logout` revokes the current session.
- Site publishing copies content, template, name and SEO into an independent snapshot. Public responses never contain the actual draft or workspace identifiers. Forms and individually published blog posts are live resources and do not require another page publish.
- A member joins a published site using `POST /api/public/sites/:slug/join` after phone verification. Only that member's assigned phone can see and download its files; the owner can also download. Files use generated storage keys and forced attachment responses. Uploaded private documents are not exposed as static assets.
- Media accepts JPEG, PNG, AVIF and WebP, strips metadata, rotates according to orientation, resizes to a maximum 2000px edge and encodes WebP. Public media is deliberately public; do not upload private documents there. Images are limited to 12 MB and private attachments to 20 MB. `GET /api/sites/:id/media` lists the image library.
- Domain verification checks TXT at `_araland.example.com` for exactly `araland-verification=TOKEN`, where TOKEN is returned with the domain. Unverified domains never resolve through the public lookup endpoint. HTTPS certificate issuance, DNS A/CNAME setup and edge routing require deployment infrastructure.
- CORS accepts the explicit application origins and HTTPS origins of verified domains attached to published sites. Credentials are bearer tokens; cookies are not required. Origin checks use current database state so domain removal immediately removes access. Development also permits HTTP for verified domains.
- OpenAI Image API generates one landscape image per request, then passes it through the same optimization pipeline. The adapter follows the [official image guide](https://developers.openai.com/api/docs/guides/image-generation), reviewed 2026-09-06. SMS and AI failures do not fabricate successful delivery or imagery.
- Basic page-view counts are anonymous and rate limited; they are not unique-visitor or attribution analytics. The first release returns the newest 1,000 leads/members; production pagination is a follow-up.

Before multi-instance production deployment, move transient network limits to a shared store, add a background queue and metering for image generation, use persistent object storage with backups and scanning for private files, provision wildcard/custom-domain TLS, and schedule expired OTP/session cleanup. Verify real provider credentials and device builds separately. PostgreSQL constraints and OTP attempt/consumption state remain authoritative across processes.

Portal auth accepts optional `siteSlug`. Verified merchant browser origins force site-scoped sessions. Scoped sessions cannot list/create/manage sites or read another site's portal/files, and they cannot use owner overrides. A manager OTP cannot be redeemed from a merchant origin. Do not add merchant-controlled domains to `CORS_ORIGINS`; it is a trusted app-origin list, and verified merchants are recognized dynamically.
