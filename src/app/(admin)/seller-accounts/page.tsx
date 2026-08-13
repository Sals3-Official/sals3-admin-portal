import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Seller accounts | Sals3 Admin Portal' };

export default function SellerAccountsPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Seller accounts"
        description="Lifecycle governance for seller accounts: review, suspend, disable, restore."
      />

      <UnavailableNotice
        title="Seller-account governance"
        reason="NOT_CONNECTED"
      >
        Seller accounts live in the sals3-portal database, which this
        application does not read or write directly (AGENTS.md rule 4). The
        server-to-server boundary that would carry a lifecycle command, and the
        endpoint in Portal that would enforce it on its own protected path, are
        not built yet. No seller identity or credential may ever appear here.
      </UnavailableNotice>
    </div>
  );
}
