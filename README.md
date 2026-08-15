# Sals3 Admin Portal

Internal platform control plane for the Sals3 ecosystem. Separate from the
seller-facing `sals3-portal` and the customer-facing `sals3-ecommerce`.

**Current state: identity and audit exist; almost everything else is still an
honest notice.** Employee sign-in, a server-side session store, and an
append-only audit trail are real and backed by this application's own
database. There is still no permission/role model, no step-up authentication,
and no policy publication pipe into `sals3-portal` or `sals3-ecommerce`. The
one exception is category governance (below): decisions are recorded for
real, but do not yet reach `sals3-portal` at all.

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

Copy the environment template and fill in a local Postgres `DATABASE_URL`
(see `.env.example` for the Gate 0 warning: it must never point at
`sals3-portal`'s database) and a `SESSION_SECRET`.

```bash
cp .env.example .env.local
npm run db:migrate
npm run create-employee
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
│   ├── components/catalog-governance/  Category-mapping picker, form, table
│   └── lib/                  Utilities
│       ├── audit/             Append-only audit trail (record, query, vocabulary)
│       ├── auth/               Employee sign-in and session
│       ├── catalog-governance/ CJ-category-to-Sals3-v1 mapping decisions
│       └── db/                  Drizzle schema and client
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

## Category governance (2026-08-15)

`Catalogue governance → Category mapping` records a curated decision mapping
one CJ supplier category to a real Sals3 Taxonomy v1 (Google Product
Taxonomy) category — ADR-014 assigns this platform-wide decision to this
application alone, since one decision reclassifies every product any seller
sources under that supplier category in `sals3-portal`. It reverses
`sals3-portal`'s 2026-08-14 "the supplier's own category IS the Sals3
category" auto-mirror decision.

Two honest gaps, stated on the page itself rather than hidden:

- No live queue of "CJ categories awaiting review" exists yet — that needs a
  read endpoint into `sals3-portal` this repository does not have. A reviewer
  records a decision today by typing in what they already observed there.
- A decision recorded here is real and durable in this application's own
  database, but does not yet reach `sals3-portal` at all — the publish/consume
  pipe between the two applications (Gate 0) is not built.

`src/lib/catalog-governance/sals3-taxonomy-v1.json` is a frozen copy of
`sals3-portal`'s own seed data (5,595 rows, 21 L1 departments), duplicated
here because Gate 0 forbids this application from reading `sals3-portal`'s
database directly.

## Known limitations

- No permission/role model or step-up authentication exists. Any signed-in
  employee may reach every capability this application has.
- No table beyond identity, audit, and category-mapping exists. Most
  ADR-014 domains (market governance, seller accounts, marketing, providers,
  policy publication, pricing) are still honest `UnavailableNotice` stubs with
  no backing schema.
- No publish/consume channel to `sals3-portal` or `sals3-ecommerce` exists for
  any domain yet, category mapping included.
- `shadcn/ui` primitives beyond `button`, `input`, `label`, `separator`,
  `sheet`, `sidebar`, `skeleton`, and `tooltip` are not vendored yet.
