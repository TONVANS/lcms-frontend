This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment & backend

Copy `.env.example` to `.env.local` and adjust. Note that `.env.local` overrides `.env.example` and is gitignored for local user overrides.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | App name shown in the UI (`LCMS`). |
| `NEXT_PUBLIC_API_MODE` | `mock` runs an in-browser mock API (axios-mock-adapter, no backend needed); `live` calls the real backend. |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL including `/api`. Local backend: `http://localhost:3001/api`. The UAT URL (a Cloudflare tunnel) is in the comment in `.env.example`; the tunnel URL changes — ask the backend team. |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | Client-side upload size limit in MB (default 25). |
| `SESSION_COOKIE_NAME` | Cookie name read by `src/proxy.ts` (`lcms_session`). |

`NEXT_PUBLIC_*` values are inlined at build time, so restart `pnpm dev` (or rebuild) after changing them.

### Mock vs live

- **Mock** (`NEXT_PUBLIC_API_MODE=mock`): all requests are answered in the browser with the same envelope and error shape as the backend. Use it for development, unit tests and e2e.
- **Live** (`NEXT_PUBLIC_API_MODE=live`): the app logs in with a Bearer JWT stored in the `lcms_session` cookie and calls `NEXT_PUBLIC_API_BASE_URL`. The backend must allow the frontend origin and the `Authorization` header (CORS).

### Live smoke test

`pnpm smoke:live` logs in to the backend, calls one page of every list, dashboard and dropdown endpoint, and records each endpoint's HTTP status and response shape (keys and types, with short string samples). Tokens, passwords and secrets are redacted. Use it to verify the frontend mappers against the real backend.

```bash
LCMS_API=http://localhost:3001/api LCMS_USER=<username> LCMS_PASS=<password> pnpm smoke:live
```

In PowerShell, set `$env:LCMS_API`, `$env:LCMS_USER` and `$env:LCMS_PASS` first. Output: `docs/backend/live-shapes.json`.

### Mock-mode test users

The password for every account is `password`.

| Username | Access |
|---|---|
| `admin` | Everything, including the admin pages (users, audit logs, contract types, departments). |
| `gc.user`, `gc.editor`, `gc.viewer` | General contracts (`/contracts`) plus common pages. Main user has all permissions, editor can view/upload/edit/delete (no download), viewer is view-only. |
| `legal.user`, `legal.editor`, `legal.viewer` | Legal documents and cases (`/legal`), same permission levels. |
| `ppa.user` | Power contracts and notifications (`/ppa`). |
| `none.user` | Departments and support only; lands on `/support`. |

### Tests

`pnpm test --run` (unit), `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm e2e` (Playwright against a production build on port 3100).
