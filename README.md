# The Stacks — Personal Content Download Portal

A catalog/download portal for content you personally own or have written
permission to distribute. The site **never** hosts, uploads, or streams
media — it only stores metadata and links to files on external storage you
control, and every click is routed through an authenticated, rate-limited
redirect endpoint so downloads are logged and links can be disabled instantly.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, PostgreSQL,
Prisma, Redis, and Auth.js (NextAuth v5).

---

## What's actually implemented (real, working code — not mocks)

- **Data model** (`prisma/schema.prisma`) covering content, categories, tags,
  download links, users/roles, favorites, download history, comments,
  reports, notifications, audit log, and settings.
- **Auth**: email/password registration + login (bcrypt, 12 rounds),
  forgot/reset password flow, JWT sessions, role-based access (`USER`,
  `ADMIN`, `SUPER_ADMIN`).
- **Public site**: homepage (featured/recent/popular rails), browse page
  with search + category/type filters + sort + pagination, content detail
  pages with JSON-LD (`CreativeWork` + `BreadcrumbList`), full Open Graph/
  Twitter Card metadata, favorites, reporting, view/download counters.
- **Secure downloads**: links are never exposed as raw `href`s — every
  download goes through `/api/download/[linkId]`, which checks the link is
  `ACTIVE`, rate-limits by IP, logs a `DownloadEvent`, increments counters,
  and only then 302-redirects to your external URL.
- **Admin dashboard**: content CRUD (create/edit/delete, drafts, scheduled
  publishing, dynamic download-link rows with provider/size/version/
  quality/language/notes/status), categories, tags, users (role + ban
  management, gated to `SUPER_ADMIN` for role changes), comment moderation,
  report triage, analytics (top content, top providers, 14-day download
  trend), site settings, and JSON-based catalog backup/restore.
- **SEO**: per-page metadata + canonical URLs, dynamic `sitemap.xml`,
  `robots.txt`, RSS feed at `/rss.xml`, JSON-LD, GA4 snippet (env-gated),
  Search Console verification meta tag support.
- **Security**: CSRF-style origin checking + security headers in
  `middleware.ts`, Zod validation on every API input, Redis-backed rate
  limiting on auth/report/comment/download endpoints (fails open if Redis
  is down so an outage never takes the site offline), audit logging on all
  admin mutations, role checks on every admin route (not just admin pages),
  generic error messages on auth endpoints to avoid account enumeration.
- **Performance**: Redis cache-aside on hot read paths (homepage rails,
  categories), ISR (`revalidate`) on content pages, `next/image` throughout,
  standalone Docker output for small runtime images.
- **Design**: a deliberate "library index card" visual system (custom
  Tailwind v4 tokens in `globals.css`, `Fraunces`/`Inter`/`JetBrains Mono`)
  rather than a generic dashboard template — see `.index-card` and `.stamp`
  utility classes.

## What's scaffolded but intentionally left for you to finish

These need product decisions or third-party accounts I don't have, so I
stubbed them cleanly rather than guessing:

- **Transactional email** (password reset currently logs the token to the
  server console in dev). Wire up Resend/SES/Postmark in
  `src/app/api/forgot-password/route.ts` — the TODO is marked.
- **Image uploads**: the admin form takes poster/thumbnail as URLs (i.e.
  you paste a link to an image already on your storage). If you want
  direct upload from the admin UI, add an S3/R2/Cloudinary signed-upload
  route — the DB fields (`posterUrl`, `thumbnailUrl`, `galleryUrls`) are
  already there.
- **Notifications**: the data model, API-safe pattern, and UI page exist;
  nothing currently *creates* a notification yet (e.g. "new content in a
  category you favorited"). Add that trigger where it makes sense for your
  workflow (e.g. inside the admin publish action).
- **OAuth providers** (Google/GitHub login): only credentials auth is wired
  up. Auth.js makes adding a provider a few lines in `src/lib/auth.ts` if
  you want it.

## Project structure

```
prisma/schema.prisma       Full data model
prisma/seed.ts              Creates a SUPER_ADMIN user + a default category
src/lib/                    prisma, redis, auth, rate-limit, validations,
                             audit, api-guard, content queries
src/middleware.ts           Security headers + origin check
src/app/                    Public site, account area, admin dashboard,
                             and all API routes (App Router)
src/components/             UI components (admin/ subfolder for dashboard)
```

## Local setup

```bash
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, etc.
npm install                 # also runs `prisma generate` via postinstall
npm run db:migrate:dev      # creates tables from the schema
npm run db:seed             # creates a SUPER_ADMIN (see .env for creds)
npm run dev
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

Log in with the seeded admin account, then rotate that password immediately.

### One thing I could not verify in this sandbox

I built and reviewed this end-to-end, but the sandbox I generated it in
blocks outbound network access to `binaries.prisma.sh`, which `prisma
generate` needs to download its query engine. Every TypeScript error I saw
when running `tsc --noEmit` here traced back to that single missing
generated client (nothing else) — once you run `npm install` on a machine
with normal internet access, `postinstall` will fetch the engine and those
errors resolve. Please run `npm run build` once yourself before deploying
and let me know if anything unexpected turns up (I'd be surprised, but I
want to be upfront that I couldn't execute that final check myself).

## Deployment

### Vercel
`vercel.json` is included. Connect the repo, set the env vars from
`.env.example` (use a managed Postgres like Neon/Supabase and a managed
Redis like Upstash), and deploy. Vercel's Node.js functions support
Prisma + ioredis natively.

### Railway / a VPS / Docker
```bash
docker compose up -d --build
docker compose exec web npm run db:migrate
docker compose exec web npm run db:seed
```
`docker-compose.yml` runs the app, Postgres, and Redis together. For a bare
VPS without Docker, build with `npm run build` and run
`node .next/standalone/server.js` behind Nginx/Caddy with TLS.

### Netlify / Cloudflare Pages — important caveat
These platforms run on edge/serverless runtimes that don't support raw TCP
connections the way `ioredis` and Prisma's default (non-Data-Proxy) client
need. To deploy there you'd swap: Prisma → **Prisma Accelerate** (or Neon's
HTTP driver), and `ioredis` → **Upstash Redis's REST client**. I didn't
make that swap here because it changes `src/lib/prisma.ts` and
`src/lib/redis.ts` in ways that assume a specific provider — happy to do it
if you tell me which one you want to use. Vercel, Railway, a VPS, or Docker
all work as-is with the code in this repo.

## Security notes

- Rotate `AUTH_SECRET` and the seeded admin password immediately.
- `next.config.ts` currently allows images from any HTTPS host
  (`remotePatterns: [{ hostname: "**" }]`) since posters can come from
  wherever your storage lives — tighten this to your actual storage
  domain(s) before launch.
- The DMCA/Terms/Privacy pages are placeholders — replace with real policy
  text and a real designated-agent contact before going live.

## License / content responsibility

This codebase distributes nothing itself. You are responsible for only
indexing content you own or are licensed to distribute, and for responding
to the DMCA page's copyright process in good faith.
