import CategoryMappingDecisionTable from '@/components/catalog-governance/CategoryMappingDecisionTable';
import RecordCategoryMappingForm from '@/components/catalog-governance/RecordCategoryMappingForm';
import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';
import { listCategoryMappingDecisions } from '@/lib/catalog-governance/queries';
import { listSals3CategoryV1Options } from '@/lib/catalog-governance/taxonomy';
import { recordCategoryMappingDecisionAction } from './actions';

export const metadata = { title: 'Category mapping | Sals3 Admin Portal' };

/**
 * ADR-014 category governance: deciding which real Sals3 Taxonomy v1
 * category a CJ supplier category means. Platform-wide by design - one
 * decision here reclassifies every product any seller sources under that
 * supplier category in `sals3-portal`, which is exactly why this lives here
 * and not in a seller-facing product editor (`sals3-portal`'s own
 * `authorizeCategoryGovernance()` denies every role today, matching this).
 *
 * Reverses `sals3-portal`'s 2026-08-14 "the supplier's own category IS the
 * Sals3 category" auto-mirror decision: the owner decided on 2026-08-15 that
 * every product should carry a real, curated category instead.
 *
 * Two honest gaps, stated rather than hidden:
 *
 * - No live queue of "CJ categories awaiting review" exists: that needs a
 *   read endpoint into `sals3-portal` that has not been built. A reviewer
 *   records a decision by typing in what they already know today.
 * - A decision recorded here does not yet reach `sals3-portal` at all - the
 *   publish/consume pipe between the two applications' databases (Gate 0)
 *   is not built. Recording is real and durable; it is inert until that
 *   pipe exists.
 *
 * No session check here: `(admin)/layout.tsx` already denies an
 * unauthenticated request before this component ever renders. This page's
 * own boundary is the mutation, not the render - the layout's own comment
 * says as much ("a layout does not re-run on client-side navigation, so any
 * route that performs a consequential mutation must still check
 * authorization itself") - which is why `recordCategoryMappingDecisionAction`
 * re-checks `getSessionEmployee()` itself rather than trusting this render.
 */
export default async function CategoryMappingPage() {
  const decisionsResult = await listCategoryMappingDecisions();

  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Category mapping"
        description="Curated CJ-supplier-category to Sals3-Taxonomy-v1 decisions. Platform-wide - never a seller's own choice."
      />

      <UnavailableNotice
        title="Categories awaiting review"
        reason="NOT_CONNECTED"
      >
        A live queue of CJ categories still on the auto-mirror, ranked by how
        many products they affect, needs a read endpoint into
        <code className="mx-1 rounded bg-muted px-1 py-0.5">sals3-portal</code>
        that does not exist yet. Until it does, a reviewer records a decision
        below using what they already observed there directly.
      </UnavailableNotice>

      <RecordCategoryMappingForm
        sals3CategoryOptions={listSals3CategoryV1Options()}
        recordDecision={recordCategoryMappingDecisionAction}
      />

      <UnavailableNotice
        title="Publishing a decision to sals3-portal"
        reason="NOT_IMPLEMENTED"
      >
        A decision recorded here is stored in this application&apos;s own
        database only. It does not yet reclassify any product - the
        publish/consume channel into{' '}
        <code className="mx-1 rounded bg-muted px-1 py-0.5">sals3-portal</code>
        (Gate 0) is a separate, not-yet-built piece of infrastructure.
      </UnavailableNotice>

      {decisionsResult.status === 'UNAVAILABLE' ? (
        <UnavailableNotice title="Recorded decisions" reason="NOT_CONNECTED">
          This deployment has no database configured, so recorded decisions
          cannot be read.
        </UnavailableNotice>
      ) : (
        <CategoryMappingDecisionTable decisions={decisionsResult.decisions} />
      )}
    </div>
  );
}
