import UnavailableNotice from '@/components/admin/UnavailableNotice';

/**
 * Bootstrap landing page.
 *
 * This is deliberately not a dashboard. Gate 0 established that only three
 * ecosystem domains have an authoritative backing service today (country
 * policy, seller-account lifecycle, supplier/provider control), and none of
 * them is wired to this repository yet. Rendering tiles, totals, or a "live"
 * status here would be exactly the fabricated console ADR-014 prohibits.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-section px-gutter py-section">
      <header>
        <p className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
          Sals3 Admin Portal
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold">
          Platform control plane
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Internal employee surface. Repository bootstrap only — no employee
          authentication, permission model, policy publication, or ecosystem
          data is implemented in this build.
        </p>
      </header>

      <UnavailableNotice title="Employee sign-in" reason="NOT_IMPLEMENTED">
        Employee identity, deny-by-default authorization, and step-up
        authentication are the next approved slice. Until they exist this
        application grants no access to anything, because there is nothing
        behind it to reach.
      </UnavailableNotice>

      <UnavailableNotice title="Market governance" reason="NOT_IMPLEMENTED">
        Versioned seller-operating and buyer-destination country policy is the
        confirmed first end-to-end domain. Publication, approval, audit, and
        rollback are not built yet.
      </UnavailableNotice>

      <UnavailableNotice
        title="Global orders, finance, and listings"
        reason="NO_AUTHORITATIVE_SOURCE"
      >
        No Product, Variant, Offer, order, checkout, payment, or ledger model
        exists anywhere in the Sals3 ecosystem. Any total shown here would be
        invented, so these domains stay unavailable until their source of truth
        is built and agreed.
      </UnavailableNotice>
    </main>
  );
}
