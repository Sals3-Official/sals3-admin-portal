import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Platform pricing | Sals3 Admin Portal' };

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Commercial pricing governance"
        description="Platform-owned reference FX, Sals3 fees and real platform costs, and safety guardrails."
      />

      <UnavailableNotice
        title="Platform pricing configuration"
        reason="NOT_IMPLEMENTED"
      >
        ADR-015 draws the boundary this page must respect: Admin Portal owns
        only platform reference-FX configuration, Sals3 commissions and real
        platform-borne costs, enabled capabilities, and legal guardrails.
        Merchant margins, merchant product prices, category PIC assignments, and
        merchant FX adjustments are tenant-owned Seller Portal concerns - this
        must never become a cross-tenant pricing editor (AGENTS.md rule 2). No
        configuration store exists yet.
      </UnavailableNotice>
    </div>
  );
}
