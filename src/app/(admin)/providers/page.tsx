import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Supplier providers | Sals3 Admin Portal' };

export default function ProvidersPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Supplier provider governance"
        description="Global enablement and incident controls for approved provider integrations."
      />

      <UnavailableNotice title="Provider controls" reason="NOT_CONNECTED">
        Provider records and seller-owned supplier connections live in the
        sals3-portal database. Global enablement and the audited incident kill
        switch would reach them as published control-plane state that Portal
        enforces on its own protected path - that boundary is not built.
        Supplier credentials are server-only in the owning service and must
        never be exposed to an Admin Portal client, in any form.
      </UnavailableNotice>
    </div>
  );
}
