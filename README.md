# Inbox Cleaner

Inbox Cleaner is a mobile-friendly web app for tidying up a Gmail inbox: connect your account with Google OAuth,
scan your mailbox, see who's filling it up, and archive or move email to Trash in bulk — safely and reversibly.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Auth.js (NextAuth v5), the Gmail REST API, and Zod.

## Table of contents

1. [How it works](#how-it-works)
2. [Security model](#security-model)
3. [Quick start (mock data, no Google setup)](#quick-start-mock-data-no-google-setup)
4. [Full setup with a real Gmail account](#full-setup-with-a-real-gmail-account)
5. [Environment variables](#environment-variables)
6. [The Gmail scan limit](#the-gmail-scan-limit)
7. [Project structure](#project-structure)
8. [Development scripts](#development-scripts)
9. [What's out of scope for this MVP](#whats-out-of-scope-for-this-mvp)

## How it works

1. **Connect Gmail** — sign in with Google OAuth. No password is ever requested by this app.
2. **Scan** — the app lists your inbox messages (up to a configurable limit), fetches only their headers
   (From, Subject, Date, List-Unsubscribe), and groups them by sender. Message bodies are never requested or stored.
3. **Review** — the dashboard shows each sender's display name, email, domain, message count, most recent email
   date, and whether an unsubscribe option was detected.
4. **Clean up** — archive or move to Trash a single sender (from its detail view) or many senders at once (via the
   sticky bulk-action bar), with a confirmation dialog before anything happens.
5. **Undo, if needed** — this app can archive or move mail to Trash, but it can never permanently delete anything.
   Anything sent to Trash is recoverable from Gmail's own Trash folder until Gmail's normal retention period expires.

## Security model

- **Google OAuth only.** The app never asks for, sees, or stores your Gmail password.
- **Minimal scope.** The app requests a single Gmail scope: `https://www.googleapis.com/auth/gmail.modify`, plus
  `openid`/`email`/`profile` for basic sign-in. That one scope is what's needed to list/search messages, read header
  metadata, and modify labels (archive + trash). It deliberately excludes `https://mail.google.com/`, the scope
  required for permanent deletion — so this app is incapable of permanently deleting your mail, not just configured
  not to.
- **Server-side secrets.** `GOOGLE_CLIENT_SECRET` and `NEXTAUTH_SECRET` are only ever read on the server
  (`lib/auth/auth.ts`, API routes). Nothing in `NEXT_PUBLIC_*` exposes them to the browser.
- **No message bodies.** Every Gmail API call in `lib/gmail/` requests `format=metadata` with an explicit
  `metadataHeaders` allowlist. The app never fetches or stores full email content.
- **No token logging.** Token refresh errors in `lib/auth/auth.ts` are caught and logged generically — access
  tokens, refresh tokens, and Gmail response bodies are never written to logs.
- **Trash over delete.** "Delete" in the UI always means Gmail Trash (`lib/gmail/actions.ts` adds the `TRASH` label
  and removes `INBOX`/`UNREAD` — the same effect as Gmail's own trash action), never permanent deletion.
- **Confirm before destructive actions.** Both single-sender and bulk actions go through `ConfirmDialog`
  (`components/ui/ConfirmDialog.tsx`), which shows the affected sender(s), the number of messages, and a reminder
  that Trash is recoverable.
- **Validated input.** Every API route validates its request body with Zod (`lib/validation/schemas.ts`) before
  touching Gmail.
- **Sanitized unsubscribe links.** Unsubscribe URLs are parsed from `List-Unsubscribe` headers and only rendered as
  clickable links if they're well-formed `http(s)` or `mailto:` targets (`lib/gmail/parse.ts`). Nothing is ever
  auto-submitted on your behalf.

## Quick start (mock data, no Google setup)

The app ships with a mock-data mode so you can run and click through the entire UI without a Google Cloud project.

```bash
# 1. Install Node.js 20+ (https://nodejs.org)
node --version

# 2. Install dependencies
npm install

# 3. Copy the example env file — the default already has mock mode on
cp .env.example .env.local
# then make sure this line is present in .env.local:
# NEXT_PUBLIC_USE_MOCK_DATA=true

# 4. Start the app
npm run dev
```

Open http://localhost:3000, click **Connect Gmail** (it skips straight to the dashboard in mock mode), and explore
scanning, searching, sorting, sender details, and archive/trash actions against realistic mock senders. Destructive
actions in mock mode only mutate an in-memory mock store — nothing real is touched.

## Full setup with a real Gmail account

### 1. Install Node.js

Install Node.js 20 or later from https://nodejs.org, then confirm:

```bash
node --version
npm --version
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Google Cloud project

1. Go to https://console.cloud.google.com/.
2. Click the project dropdown (top left) → **New Project**.
3. Name it (e.g. "Inbox Cleaner Dev") and click **Create**.

### 4. Enable the Gmail API

1. In your new project, go to **APIs & Services → Library**.
2. Search for "Gmail API" and click **Enable**.

### 5. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (unless you have a Google Workspace org and want **Internal**).
3. Fill in the app name ("Inbox Cleaner"), your support email, and developer contact email.
4. On the **Scopes** step, add the scope `https://www.googleapis.com/auth/gmail.modify`. Because this is a sensitive
   Gmail scope, Google will show a warning — that's expected for local development.
5. Save through the remaining steps.

### 6. Add test users (while the app is in "Testing" mode)

Sensitive Gmail scopes require **Google verification** before an OAuth app can be used by the general public. Until
your app is verified, it stays in **Testing** mode, where only explicitly added test users can sign in.

1. Go to **APIs & Services → OAuth consent screen → Audience** (or **Test users**, depending on the console version).
2. Click **Add users** and add the Google account(s) you'll use for local development.
3. This is sufficient for local development and personal use — verification is only required to remove the
   "unverified app" warning and allow arbitrary users to sign in.

### 7. Create a Web application OAuth client

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Name it (e.g. "Inbox Cleaner Local").

### 8. Configure authorized JavaScript origins

Add:

```
http://localhost:3000
```

### 9. Configure authorized redirect URIs

Add the exact callback URL Auth.js uses for the Google provider:

```
http://localhost:3000/api/auth/callback/google
```

### 10. Copy the client ID and client secret

After creating the client, copy the **Client ID** and **Client secret** shown by Google Cloud Console.

### 11. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill in:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=  # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GMAIL_SCAN_LIMIT=2000
NEXT_PUBLIC_USE_MOCK_DATA=false
```

`.env.local` is already covered by `.gitignore` — never commit it.

### 12. Start the app locally

```bash
npm run dev
```

Open http://localhost:3000, click **Connect Gmail**, sign in with a test user account, and approve the requested
Gmail permissions. You'll land on the dashboard once the first scan completes.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Yes (unless mock mode) | OAuth client ID from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Yes (unless mock mode) | OAuth client secret. Server-side only, never sent to the browser. |
| `NEXTAUTH_SECRET` | Yes | Random secret Auth.js uses to sign session tokens. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Base URL of the app. `http://localhost:3000` for local dev. |
| `GMAIL_SCAN_LIMIT` | No (default `2000`) | Maximum number of inbox messages a single scan retrieves. See below. |
| `NEXT_PUBLIC_USE_MOCK_DATA` | No (default `false`) | When `true`, the app uses mock senders instead of calling Gmail. |

See `.env.example` for a ready-to-copy template with placeholders (never real credentials).

## The Gmail scan limit

Scanning an entire large Gmail account on every load would be slow and could burn through Gmail API quota quickly.
`GMAIL_SCAN_LIMIT` (defined in `lib/env.ts`, default **2000**) caps how many of the most recent inbox messages a
single scan retrieves — and therefore how many messages are available for bulk archive/trash in one pass. If a
scan is capped before reaching senders you want to clean up, raise this value in `.env.local` (hard-capped at
**10000** regardless of what you set, to guard against typos). Larger values mean a slower scan, since each
message's headers are fetched individually (`lib/gmail/metadata.ts`, concurrency-limited to 15 in-flight requests)
rather than in one batched call — expect roughly 2–4 minutes for a scan in the thousands, depending on Gmail's
response times and any rate-limit backoff.

The dashboard shows how many messages were scanned and whether the limit was reached, so it's always clear when
the sender list doesn't yet represent your entire mailbox — in that case, use **Refresh scan** after archiving or
trashing a batch to pull in the next layer of messages.

## Project structure

```
app/                      Routes (App Router)
  api/auth/[...nextauth]/  Auth.js route handler
  api/scan/                GET: scans the mailbox, groups by sender
  api/senders/preview/     POST: fetches recent subject lines for one sender
  api/senders/actions/     POST: archives or trashes messages for one or more senders
  dashboard/               The signed-in dashboard page
  page.tsx                 Landing page
components/
  auth/                    Connect/sign-out buttons
  dashboard/               Dashboard shell, sender rows, search/sort, bulk action bar
  senders/                 Sender detail modal, unsubscribe button
  ui/                      Generic modal, confirm dialog, toast provider
lib/
  auth/                    Auth.js config, server-side session/access-token helpers
  gmail/                   Gmail service layer (see below) + mock data
  validation/              Zod schemas for API request bodies
  api/                     Shared API error mapping + typed client fetch helpers
types/                     Shared TypeScript types (Gmail domain types, Auth.js augmentation)
```

### Gmail service layer (`lib/gmail/`)

- `client.ts` — authenticated fetch wrapper with retry/backoff on 429 and 5xx responses.
- `list.ts` — lists inbox message ids (paginated, capped at the scan limit).
- `metadata.ts` — fetches header-only metadata for a batch of messages, bounded concurrency.
- `parse.ts` — parses `From` headers and `List-Unsubscribe`/`List-Unsubscribe-Post` headers.
- `group.ts` — groups parsed messages by normalized sender email.
- `scan.ts` — orchestrates list → metadata → group into a single scan result.
- `preview.ts` — fetches a handful of recent subject lines for the sender detail view.
- `actions.ts` — archive/trash via Gmail's `batchModify` endpoint, chunked and with per-chunk failure reporting.
- `mock.ts` — realistic in-memory mock senders used when `NEXT_PUBLIC_USE_MOCK_DATA=true`.

## Development scripts

```bash
npm run dev         # start the dev server
npm run build        # production build
npm run start         # run the production build
npm run lint          # ESLint
npm run typecheck    # TypeScript, no emit
npm run test           # Vitest unit tests
```

## What's out of scope for this MVP

- Automatically submitting unsubscribe forms or sending unsubscribe emails — the app only opens/links to the
  sender's own unsubscribe flow and requires you to complete it.
- Persisting scan results in a database — each scan is in-memory for the current session/request.
- Google OAuth app verification for public/production use (see step 6 above — this is a Google process, not
  something this codebase can automate).
- Gmail label management beyond Inbox/Archive/Trash (custom labels, filters, etc.).
- Multi-account support (one connected Gmail account per session).
