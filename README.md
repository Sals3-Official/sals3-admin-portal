# Sals3 Admin Portal

Internal platform control plane for the Sals3 ecosystem. Separate from the
seller-facing `sals3-portal` and the customer-facing `sals3-ecommerce`.

**Current state: repository bootstrap only.** There is no employee
authentication, no permission model, no database schema, no policy
publication, and no ecosystem data in this build. The single page states that
plainly rather than rendering a placeholder dashboard.

## What this product is

Admin Portal governs platform-wide decisions that must apply consistently
across the Seller Portal and the storefront — market policy, seller-account
lifecycle, provider incident control, and (later) the domains listed in
`ADR-014`. The application holds global capability; no employee automatically
holds unrestricted access. Role, scope, approval, step-up authentication, and
immutable audit determine who may view, propose, approve, execute, or reverse
any given action.

It is **not** a second seller workspace, and it is **not** a cross-tenant
pricing editor. Merchant margins, product prices, category PIC assignments,
and merchant FX adjustments belong to Seller Portal (`ADR-015`).

## Requirements

- Node.js 20.6 or newer
- npm (the lockfile is `package-lock.json` — do not switch package managers)
- A sibling clone of `sals3-ecommerce`, whose `docs/Wiki/wiki/` holds the
  canonical operating rules `AGENTS.md` points at

## Setup

```bash
npm install
```

Copy the environment template. Nothing in this build reads it yet; it exists
so the next slice's configuration is visible in advance.

```bash
cp .env.example .env.local
```

## Running

```bash
npm run dev
```

Opens on <http://localhost:3002>. The port is fixed so all three Sals3 apps can
run at once: `sals3-ecommerce` uses 3000 and `sals3-portal` uses 3001.

Production build and serve:

```bash
npm run build
npm run start
```

## Verification

Run the full gate before reporting any code work complete:

```bash
npm run verify
```

That runs, in order: `lint`, `format:check`, `typecheck:clean`, `build`,
`test:run`, `test:e2e`. Individual commands:

| Command                   | What it checks                                           |
| ------------------------- | -------------------------------------------------------- |
| `npm run lint`            | ESLint (airbnb + next core-web-vitals + next/typescript) |
| `npm run format:check`    | Prettier                                                 |
| `npm run typecheck:clean` | `tsc --noEmit` with `.next` moved aside                  |
| `npm run build`           | Production build                                         |
| `npm run test:run`        | Vitest unit/component tests                              |
| `npm run test:e2e`        | Playwright, on port 3102                                 |

Also run the dependency audit:

```bash
npm audit --audit-level=high
```

`typecheck:clean` exists because generated types under `.next` otherwise leak
into `tsc` output; it swaps the directory aside on the same drive (a Windows
`EXDEV` constraint) and restores it afterwards.

## Project structure

```text
sals3-admin-portal/
├── e2e/                      Playwright end-to-end tests
├── scripts/                  Local automation used by npm commands
├── src/
│   ├── app/                  Next.js App Router routes, layout, global CSS
│   ├── components/admin/     Admin-specific components
│   └── lib/                  Utilities
├── test/                     Shared test setup
├── AGENTS.md                 Mandatory operating rules (read before editing)
└── CLAUDE.md                 Points at AGENTS.md
```

## Design system

Admin Portal reuses `sals3-portal`'s layout rhythm, radius scale, spacing
scale, typography (Plus Jakarta Sans + Outfit), focus-ring rule, and
reduced-motion rule unchanged. Only the **colour layer** differs: graphite/ink
surfaces, deep indigo navigation, and a restrained electric-violet accent, so
an Admin screen can never be mistaken for a seller workspace.

Every foreground/background pair in `src/app/globals.css` was checked against
WCAG 2.1 AA before adoption — 4.5:1 for text, 3:1 for UI and focus indicators.
Danger, warning, and success keep the same semantic meaning they have in
`sals3-portal`, and every status also carries a written label; colour is never
the only signal.

## Honest unavailable states

`src/components/admin/UnavailableNotice.tsx` is the only approved way to
render a capability that has no backing service. It distinguishes three
genuinely different problems:

| Reason                    | Meaning                                        | Who unblocks it               |
| ------------------------- | ---------------------------------------------- | ----------------------------- |
| `NOT_IMPLEMENTED`         | Approved plan exists, no code yet              | Engineering                   |
| `NOT_CONNECTED`           | Code exists, this deployment has no connection | Operations                    |
| `NO_AUTHORITATIVE_SOURCE` | Nothing in the ecosystem owns this data yet    | Product/architecture decision |

Fabricating a total, a seller count, or a "live" status instead is prohibited
by `ADR-014`. A test asserts the bootstrap page renders no digits at all.

## Known limitations

- No employee authentication or authorization exists. Nothing is protected
  because nothing is behind it.
- No database, schema, or migration exists. Admin Portal will own its **own**
  database; it must never read or write `sals3-portal` tables directly.
- No connection to `sals3-portal` or `sals3-ecommerce` exists.
- Drizzle ORM and Better Auth are intentionally **not** installed yet. They
  arrive with the first slice that actually uses them, so no unused dependency
  ships unverified.
- `shadcn/ui` primitives are not vendored yet. When the first component is
  added, `globals.css` will also need `@import 'shadcn/tailwind.css'` as in
  `sals3-portal`.
- The first approved end-to-end domain is versioned market governance: seller
  operating-country and buyer destination-country policy, independently
  versioned, with reason, approval, audit, publish, and rollback.
