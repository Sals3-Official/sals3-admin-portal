import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Audit trail | Sals3 Admin Portal' };

export default function PolicyAuditPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Audit trail"
        description="Immutable record of every consequential action taken in this control plane."
      />

      <UnavailableNotice title="Audit events" reason="NOT_IMPLEMENTED">
        Every consequential action must record actor, reason, scope,
        before/after, correlation ID, and time, append-only (AGENTS.md rule 6).
        No such table exists yet - and until one does, no action in this
        application may be consequential. An empty list is not shown here on
        purpose: nothing has been recorded because nothing can be, and an empty
        audit view would imply a working recorder.
      </UnavailableNotice>
    </div>
  );
}
