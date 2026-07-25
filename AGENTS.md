# SyncWire UI — Agent Instructions

This is the web dashboard for the SyncWire notification relay. Read this whole file before touching anything. The repo is one of three that make up the product.

---

## 0. The three-repo ecosystem

SyncWire is a notification relay. The Android app listens to system notifications on a phone and forwards them to a NestJS server; this UI is the web dashboard where users view their feed, manage devices, and configure the system.

| Repo | Path | Role | Stack |
|---|---|---|---|
| `syncwire-server` | `C:\Users\Mohsin\Projects\syncwire-server` | API + Postgres + EMQX broker | NestJS 11, Prisma 7, Postgres 18, Docker |
| `syncwire-app` | `C:\Users\Mohsin\AndroidStudioProjects\syncwire` | Android listener + tiny settings UI | Kotlin 2.2, Compose, OkHttp, NotificationListenerService |
| **`syncwire-ui`** | `C:\Users\Mohsin\Projects\syncwire-ui` (this repo) | Web dashboard | **Next.js 16, React 19, MUI, anime.js** |

All three are private (UNLICENSED). `bitspark-solutions` org on GitHub.

**Rule:** if you change a server endpoint, the UI must follow in the same change-set. The server's `.plan/` and `.progress/` are the source of truth for the data model. The UI's `src/lib/api/` mirrors the server's `src/notifications/` and (forthcoming) `src/auth/`, `src/devices/`.

---

## 1. ⚠️ This is NOT the Next.js you know

> <!-- BEGIN:nextjs-agent-rules -->
> This is Next.js **16.2.11** with React 19. APIs, conventions, and file structure may differ from your training data. Before writing any code, **read the relevant guide in `node_modules/next/dist/docs/`** and pay attention to deprecation notices. The auto-generated `AGENTS.md` warning that came with `create-next-app` is preserved for a reason.
> <!-- END:nextjs-agent-rules -->

Practical implications:
- `next/link`, `next/image`, `next/navigation`, `next/font` APIs may have changed
- Server Components / Client Components boundaries are stricter
- `next.config.ts` is the new default over `next.config.js`
- Typed routes are enabled — see `next-env.d.ts` (imports `./.next/types/routes.d.ts`)
- App Router is the only supported router (no `pages/`)
- `next dev` and `next build` are the only scripts; don't add custom webpack unless you must

If something you write doesn't compile, the docs in `node_modules/next/dist/docs/` are the first place to check — not web search, not training data.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2.11 | App Router only, TS, RSC by default |
| UI runtime | React 19.2.4 | Server components default; `'use client'` when needed |
| Language | TypeScript ^5 | `strict: true`, `paths: { "@/*": ["./src/*"] }` |
| Component lib | **Material UI (MUI)** | `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` |
| Animations (imperative) | **animejs v3+** | Lightweight, JS-driven. Default for hovers, micro-interactions, list staggers, loaders. |
| Animations (declarative) | **motion.dev** (`motion` npm package, formerly Framer Motion) | Use when you need React-component-driven motion: AnimatePresence, layout animations, scroll-linked, gestures. Not the legacy `framer-motion` package. |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` | (planned for M2) |
| Data fetching | Server Components + `fetch`; client uses TanStack Query for mutations | (planned) |
| Auth | Auth0 via `@auth0/nextjs-auth0` | (planned for M4) |
| Lint | `eslint-config-next` 16.2.11 (vitals + typescript) | |
| Fonts | `next/font/google` — `Geist` + `Geist Mono` (already wired in `layout.tsx`) | |

**Do NOT add**: Tailwind, the legacy `framer-motion` package (use `motion` from motion.dev), styled-components, Chakra, shadcn. The user has chosen MUI + anime.js + motion.dev. Respect that.

---

## 3. Design language: "very smooth and futuristic"

This is not a generic dashboard. The bar is high.

### 3.1 Visual direction

- **Dark mode is the default.** No light-mode toggle in M1; if you must support both, dark comes first.
- **Glassmorphism** — frosted cards (`backdrop-filter: blur()`, low-opacity background) over subtle gradient orbs in the background.
- **Gradient accents** — purple-to-cyan or blue-to-magenta on key surfaces (CTAs, active states, brand mark).
- **Generous spacing** — 16/24/32 px rhythm, never <8 px between elements.
- **Geist font** everywhere (already configured). Tight letter-spacing on headings (-0.02em), normal on body.
- **Iconography** — `lucide-react` for line icons, MUI icons as fallback. No emoji in UI.

### 3.2 Motion principles

We have two motion libraries, by design. Pick the right one for the job.

**anime.js** (imperative, JS-driven) — default for small things:
- **Page enter** — fade + 12 px translateY up, 400 ms, `easeOutQuart`. Stagger children 60 ms.
- **List items** — stagger in 40 ms, opacity 0→1 + translateY 8 px → 0, 320 ms, `easeOutCubic`.
- **Hover** — scale 1 → 1.02 + brightness +8%, 180 ms, `easeOutQuad`.
- **Button press** — scale 0.97 for 80 ms then back, 160 ms total.
- **Number tickers** — `animate({ targets, textContent: [0, value], round: 1, duration: 800, ease: 'easeOutExpo' })`.
- **Skeleton loaders** — animated gradient sweep via `animate({ targets, translateX: [-100, 100], ... })`, infinite loop.
- **Toast / snackbar** — slide up 24 px + fade, 280 ms; auto-dismiss 4 s with reverse 200 ms.

**motion.dev** (declarative, React-component-driven) — when you need:
- **`<AnimatePresence>`** for exit animations (route changes, modal dismiss, list removal)
- **Layout animations** — items moving/resizing when their position changes (Kanban, drag-and-drop, sidebar collapse)
- **Scroll-linked motion** — `useScroll`, `useTransform` for parallax and progress indicators
- **Gestures** — `whileHover`, `whileTap`, `whileDrag` for tactile interactions
- **SVG path morphing** via `motion.path`

Never CSS-only transitions for anything user-visible. Never the legacy `framer-motion` package — install `motion` instead (`npm i motion`).

**Reduced motion**: respect `prefers-reduced-motion: reduce` — short-circuit anime.js to a 0 ms duration or opacity-only fade; with motion.dev use `useReducedMotion()` and skip transforms.

```ts
// anime.js — imperative, no React
import { animate, stagger } from 'animejs';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
animate('.list-item', {
  opacity: [0, 1],
  translateY: [8, 0],
  delay: stagger(reduced ? 0 : 40),
  duration: reduced ? 0 : 320,
  ease: 'outCubic',
});
```

```tsx
// motion.dev — declarative, React component
'use client';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export function FadeIn({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.4, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

anime.js v3 is modular: `import { animate } from 'animejs'` is the modern API. Don't use the legacy `anime({...})` global.

### 3.3 Components — MUI first, custom second

- Default to MUI: `Box`, `Stack`, `Typography`, `Button`, `Card`, `TextField`, `Chip`, `Avatar`, `IconButton`, `Dialog`, `Snackbar`, `Skeleton`, `Tooltip`.
- Use `sx` prop for one-off styling. Theme via `createTheme`/`ThemeProvider` in `src/theme/`.
- Custom components go in `src/components/`. Name as `PascalCase.tsx` for components, `useKebab-case.ts` for hooks.
- Every interactive surface needs hover + focus-visible + active states. No dead pixels.

### 3.4 Theme

`src/theme/theme.ts` owns the theme. Use `mode: 'dark'` by default. Token names follow MUI v6 conventions: `palette.primary.main`, `palette.background.default`, `palette.surface.elevated` (custom), `shape.borderRadius` (default 12), `transitions.duration.*`.

---

## 4. Project layout

```
syncwire-ui/
├── public/                         # static assets (favicons, OG images)
├── src/
│   ├── app/                        # App Router
│   │   ├── layout.tsx              # root layout (Geist, MUI ThemeProvider, <body>)
│   │   ├── page.tsx                # landing / dashboard entry
│   │   ├── globals.css             # CSS reset, body background, font vars
│   │   ├── page.module.css         # remove once we ditch the create-next-app template
│   │   └── ...routes               # /notifications, /devices, /settings, etc. (planned)
│   ├── components/                 # shared UI (MUI customizations + composites)
│   │   ├── NavRail.tsx
│   │   ├── NotificationCard.tsx
│   │   └── ...
│   ├── theme/                      # MUI theme + design tokens
│   │   └── theme.ts
│   ├── lib/
│   │   ├── api/                    # typed wrappers around the server API
│   │   │   ├── client.ts           # fetch wrapper, base URL, error handling
│   │   │   ├── notifications.ts
│   │   │   ├── devices.ts
│   │   │   └── auth.ts
│   │   └── motion/                 # anime.js helpers, stagger presets, reduced-motion check
│   │       └── presets.ts
│   └── types/                      # shared types — MUST match the server's Prisma models
│       ├── notification.ts
│       ├── device.ts
│       └── user.ts
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── package.json
├── .env.local                      # NEXT_PUBLIC_API_URL etc. (gitignored)
└── README.md
```

**Removed in v0**: `src/app/page.module.css` (template styling) once the landing page is real. Keep `globals.css` minimal — most styling goes through MUI `sx` or the theme.

---

## 5. Server contract (the API the UI consumes)

Source of truth: `C:\Users\Mohsin\Projects\syncwire-server\src\notifications\notifications.controller.ts` and (soon) `src/auth/`, `src/devices/`.

Base URL: `process.env.NEXT_PUBLIC_API_URL` (e.g. `http://127.0.0.1:18080/api` for local dev).

### M1 (current)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + DB probe (UI doesn't need this, but good for a status pill) |
| `POST` | `/notifications` | Create. Body: `id`, `deviceId`, `sourceType`, `sender`, `content`, `timestamp` (ms), `packageName` |
| `GET` | `/notifications?deviceId=...&limit=...` | List, newest-first. Default limit 50, max 200 |
| `GET` | `/notifications/:id` | Fetch one. 404 if missing |
| `DELETE` | `/notifications` | Clear all (dev only) |

### Planned

| Method | Path | Status |
|---|---|---|
| `POST` | `/auth/register` `POST` `/auth/login` `POST` `/auth/refresh` `POST` `/auth/logout` | M2 |
| `GET` `/devices` `POST` `/devices` `DELETE` `/devices/:id` | device registration per user | M2 |
| `GET /notifications?userId=...` (after auth) | M4 (multi-tenant swap-in) | M4 |
| Server-Sent Events `/notifications/stream` | realtime push (replace polling) | M3 |

**Types** in `src/types/notification.ts` MUST match the server's `NotificationRecord` in `src/notifications/notifications.service.ts`. When the server changes a type, both files change in the same commit. If the server is `master` ahead, run `npm run check:types` (TBD) to catch drift.

---

## 6. Build / dev / lint

Prerequisites: Node 24+ (matches the server's runtime), npm 10+.

```bash
# install
npm install

# dev (hot reload)
npm run dev
# → http://localhost:3000

# prod build
npm run build
npm run start

# lint
npm run lint
```

`.env.local` (gitignored) — example:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:18080/api
```

The server's `app` service is reachable from the UI at `http://localhost:18080/api` (same host, no `10.0.2.2` magic — that's an emulator-only thing for the Android app).

---

## 7. Code conventions

- **TypeScript strict** — no `any`, no `as unknown as X` without a comment.
- **Imports** — `@/...` alias for everything inside `src/`. No relative `../../` chains.
- **Server vs Client components** — default to Server Components. Add `'use client'` only when you need state, effects, browser APIs, anime.js, or motion.dev. **Both animation libs touch the DOM, so any file that imports them must be a client component.**
- **Data fetching** — RSC `fetch` with `next: { revalidate: N }` for read paths; client-side TanStack Query for mutations and optimistic updates.
- **Errors** — never swallow. Surface via MUI `Snackbar` with severity + anime.js slide-in. Log to `console.error` in dev only.
- **Accessibility** — every interactive element has a real `aria-label` or visible text. Focus rings are not optional. Use MUI's built-in focus-visible.
- **Naming**: components `PascalCase.tsx`, hooks `useThing.ts`, utilities `kebab-case.ts`, types in `PascalCase`.
- **No barrel files** for now (`index.ts` re-exports). Direct imports only — keeps the build fast and tree-shaking honest.

---

## 8. Roadmap (the UI half)

| Milestone | What the UI ships |
|---|---|
| **M1 (current)** | Landing page with hero + "powered by" + link to docs. Status pill wired to `/api/health`. Polished, smooth, futuristic — the brand impression. |
| M2 | `/login`, `/register` (Auth0). `/devices` — list + register + revoke. Top nav with user avatar. |
| M3 | `/notifications` feed (real-time via SSE). Filters: by device, by date, by app. Detail drawer. |
| M4 | Multi-tenant scoping — `userId` everywhere. Sharing settings between paired devices. |
| M5 | Theme toggle, profile, billing teaser, marketing polish. |

The M1 landing page is the highest-priority work item right now. It must look **premium** — gradient orbs in the background, glassmorphic hero card, animated KPI tiles (active devices, notifications today, uptime), animated logo mark, and subtle background motion via anime.js (gradient orbs that drift slowly).

---

## 9. Cross-repo coordination rules

- **Server is the contract owner.** If the server changes a payload shape, the UI follows. Don't unilaterally rename fields in the UI and hope the server follows.
- **Server tests are the contract test.** When adding a new endpoint server-side, also add it to the UI's typed API client (`src/lib/api/`) in the same change.
- **Shared types** — until we have a shared package, the UI's `src/types/` mirrors the server's `NotificationRecord` etc. by hand. Mark with a comment `// Mirror of syncwire-server/src/notifications/notifications.service.ts:NotificationRecord`.
- **When reviewing server PRs**, check that the UI doesn't break. When reviewing UI PRs, check the server can fulfill it.
- **The Android app is the source of notifications.** If a feature implies a new field, the app generates it. Don't add a field the app can't send.

---

## 10. User preferences (memory)

These are facts about the user that affect every task:

- **Short responses.** Don't pad. Get to the point.
- **Don't commit or push without explicit ask.** Same rule as the other two repos. Always `git status` and ask before staging/committing/pushing.
- **English is the working language** unless the user switches to Bengali. The UI strings should still default to English in M1.

---

## 11. Common gotchas

- **Next.js 16 + React 19**: don't trust your training data. If `next/link` complains, `next/image` fails, or an RSC boundary error pops up, check `node_modules/next/dist/docs/`.
- **anime.js v3** uses ESM imports; if you see `window.anime is not a function`, you're loading the v2 build by accident. Fix the import. The package is `animejs` on npm: `npm i animejs`.
- **motion.dev v12+** is published as `motion` on npm (not `framer-motion`): `npm i motion`. Import paths are `motion/react` for React hooks/components, `motion/dom` for vanilla DOM. The old `framer-motion` package is unmaintained.
- **MUI + RSC**: `ThemeProvider`, `CssBaseline`, and any component that uses portals (Dialog, Menu, Popover) need to be inside a client component. Put the provider in `src/app/providers.tsx` with `'use client'`, import that into the root layout.
- **Emotion cache** for MUI in App Router: configure `createCache` in `src/theme/EmotionCache.tsx` and wrap children with `<CacheProvider>` in the providers component. Otherwise the first paint shows unstyled HTML.
- **`.env.local` is read at build time** for `NEXT_PUBLIC_*` vars. Bounce the dev server after changing it.
- **The `next-env.d.ts` is auto-generated** — never edit it.
- **The `page.module.css` in `src/app/` is create-next-app boilerplate**. Delete it once the real landing page lands.

---

## 12. Where to look first

1. `src/app/layout.tsx` — root layout, fonts, where ThemeProvider goes
2. `src/app/page.tsx` — landing page (currently the create-next-app template; replace)
3. `src/theme/` — does NOT exist yet. Create it: `theme.ts` + `EmotionCache.tsx`
4. `src/lib/api/` — does NOT exist yet. Create `client.ts` first, then `notifications.ts`
5. `node_modules/next/dist/docs/` — for any Next.js 16 question
6. The server's `src/notifications/notifications.service.ts` — for the wire format

When in doubt about the contract, the server is the source of truth.
