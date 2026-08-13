import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Buyer destinations | Sals3 Admin Portal' };

export default function BuyerCountriesPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Buyer destination countries"
        description="Where customers may purchase and receive delivery."
      />

      <UnavailableNotice
        title="Buyer-destination policy"
        reason="NOT_IMPLEMENTED"
      >
        A separate policy from seller operating countries, with its own version,
        effective period, reason, and audit trail - the two must never collapse
        into one ambiguous market code (ADR-014). Enabling a destination only
        permits evaluation for that country; a product or offer still requires
        destination-specific freight, restrictions, compliance, and other
        evidence before it is sellable (ADR-003). Publication, approval, and
        rollback are not built yet.
      </UnavailableNotice>
    </div>
  );
}
