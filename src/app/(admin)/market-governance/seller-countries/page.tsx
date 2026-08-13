import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Seller countries | Sals3 Admin Portal' };

export default function SellerCountriesPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Seller operating countries"
        description="Where a seller or business may be registered, verified, and authorized to operate on Sals3."
      />

      <UnavailableNotice title="Seller-country policy" reason="NOT_IMPLEMENTED">
        This policy is versioned independently of buyer destinations and must
        never be inferred from them, from supplier stock origin, or from
        currency, locale, or timezone (ADR-014). Australia is the owner-stated
        current business and seller operating country; that does not enable AU
        or any other buyer destination. No versioned policy record, effective
        period, approval, or audit trail is built yet, so this page shows no
        allowlist rather than a placeholder one.
      </UnavailableNotice>
    </div>
  );
}
