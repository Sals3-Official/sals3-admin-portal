# Sals3 mandatory code rules

This repository shares the Sals3 tech stack and operating rules with `sals3-ecommerce` and `sals3-portal`. The canonical wiki lives in the `sals3-ecommerce` repository, which is a sibling clone of this one. Before any codebase edit, refactor, test change, configuration change, or package change, read and follow:

- `../sals3-ecommerce/docs/Wiki/wiki/hot.md`
- `../sals3-ecommerce/docs/Wiki/wiki/agent-operating-contract.md`
- `../sals3-ecommerce/docs/Wiki/wiki/nextjs-component-security-code-rules.md`
- `../sals3-ecommerce/docs/Wiki/wiki/project-structure-installation-and-runbook.md`

For any work in this repository specifically, also read:

- `../sals3-ecommerce/docs/Wiki/wiki/ADR-014-admin-portal-platform-governance-and-global-controls.md`
- `../sals3-ecommerce/docs/Wiki/wiki/ADR-015-commercial-pricing-governance-category-product-and-fx-adjustments.md`
- `../sals3-ecommerce/docs/Wiki/wiki/ADR-003-international-availability-shipping-and-pricing.md`
- `../sals3-ecommerce/docs/Wiki/wiki/ADR-010-catalog-decision-governance-and-shadow-enforcement.md`
- `../sals3-ecommerce/docs/Wiki/wiki/sals3-session-2026-08-11-part32-admin-portal-control-tower-direction.md`

`nextjs-component-security-code-rules.md` is the strict source of truth for Next.js component architecture, server-side security checks, validation commands, and completion reporting. Do not mark code work complete when required lint, format, typecheck, build, test, E2E, or high-severity audit checks fail unless the failure is reported as a blocker.

Package manager is `npm` with `package-lock.json` as the lockfile. Run `npm run verify` before reporting code work complete.

Do not deploy, publish, push, or commit unless the owner explicitly asks.

## Rules specific to Admin Portal

This application is the platform control plane. Its capability is global; a human's authority is not.

1. **Deny by default.** Every server read and mutation checks employee identity, permission, and scope. A hidden button is never the authorization check. Seller identities must never reach an Admin capability.
2. **This is not a seller workspace.** Never copy a `sals3-portal` seller route, seller-scoped authorization, or tenant-owned commercial setting into this repository. ADR-015 assigns merchant margins, product prices, category PIC assignments, and merchant FX adjustments to Seller Portal — Admin Portal must not become a hidden cross-tenant pricing editor.
3. **No fabricated data, ever.** A capability without an authoritative backing service renders `UnavailableNotice`, not a plausible number, a sample seller count, or a green "live" pill. See `src/components/admin/UnavailableNotice.tsx`.
4. **Separate database.** Admin Portal owns its own database. It does not read or write `sals3-portal` tables directly. Policy reaches Portal as versioned, published state over a secret-protected server endpoint, and the consuming service enforces it on its own protected path.
5. **Country policy is two policies.** Seller operating-country eligibility and buyer destination-country eligibility are independently versioned. Never collapse them into one `marketCode`, and never infer one from the other, from supplier stock origin, or from currency/locale/timezone.
6. **Immutable audit.** Every consequential action records actor, reason, scope, before/after, correlation ID, and time. Rollback republishes a prior valid version; it never rewrites history.
7. **No secrets to the client.** Seller passwords, provider tokens, payment credentials, webhook secrets, and database credentials are server-only, and never appear in UI, URLs, or logs.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
