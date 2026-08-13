import AuditEventTable from '@/components/admin/AuditEventTable';
import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';
import { AUDIT_PAGE_SIZE, listRecentAuditEvents } from '@/lib/audit/queries';

export const metadata = { title: 'Audit trail | Sals3 Admin Portal' };

/**
 * The audit trail, reading real events.
 *
 * This page previously rendered an `UnavailableNotice` arguing that an empty
 * audit view would imply a working recorder. That argument was correct then
 * and is spent now: a recorder exists, `audit_events` is append-only at the
 * database, and sign-in, sign-out, a rejected credential, and employee
 * provisioning each append to it. An empty table here now means the honest
 * thing - nothing has happened yet.
 *
 * A missing database is still a different fact from an empty trail, so it
 * keeps its own notice rather than rendering as zero rows.
 */
export default async function PolicyAuditPage() {
  const result = await listRecentAuditEvents();

  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Audit trail"
        description="Immutable record of every consequential action taken in this control plane. Append-only: entries are never edited or deleted."
      />

      {result.status === 'UNAVAILABLE' ? (
        <UnavailableNotice title="Audit events" reason="NOT_CONNECTED">
          This deployment has no database configured, so the trail cannot be
          read. This is not an empty trail - it is an unreadable one, and the
          difference matters when the question is whether something happened.
        </UnavailableNotice>
      ) : (
        <>
          <AuditEventTable events={result.events} />
          {result.truncated ? (
            <p className="text-sm text-muted-foreground">
              Showing the most recent {AUDIT_PAGE_SIZE} events. Older entries
              exist and are not shown - filtering by actor, action, scope, and
              time range is not built yet, so this view must not be read as the
              whole record.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
