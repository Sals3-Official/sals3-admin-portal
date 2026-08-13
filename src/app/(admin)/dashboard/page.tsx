import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';
import { getSessionEmployee } from '@/lib/auth/session';

export const metadata = { title: 'Overview | Sals3 Admin Portal' };

/**
 * Overview. Deliberately not a dashboard of tiles and totals.
 *
 * Employee identity now exists, so this page can name who is signed in -
 * that is a real fact about this request. Nothing else here is: no Product,
 * order, seller-count, or policy-version service backs this application yet,
 * so every capability below states what it is and what is missing instead of
 * rendering a plausible number (ADR-014, AGENTS.md rule 3).
 */
export default async function OverviewPage() {
  const employee = await getSessionEmployee();

  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Overview"
        description={
          employee === null
            ? undefined
            : `Signed in as ${employee.email}. This build grants no capability beyond sign-in.`
        }
      />

      <UnavailableNotice
        title="Platform activity"
        reason="NO_AUTHORITATIVE_SOURCE"
      >
        An overview would summarise sellers, orders, published policy versions,
        and open exceptions. None of those has an authoritative backing service
        in the Sals3 ecosystem yet, so any figure shown here would be invented.
      </UnavailableNotice>

      <UnavailableNotice
        title="Employee permissions and step-up"
        reason="NOT_IMPLEMENTED"
      >
        Sign-in proves identity only. There is no permission model, no role, and
        no step-up authentication yet, so this application deliberately grants
        no capability beyond reaching these pages. Nothing here can read or
        mutate seller, policy, or provider state.
      </UnavailableNotice>
    </div>
  );
}
