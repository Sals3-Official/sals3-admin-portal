import {
  AUDIT_ACTION_IS_NOTABLE,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
} from '@/lib/audit/actions';
import {
  formatAuditTimestamp,
  formatStateJson,
  shortCorrelationId,
} from '@/lib/audit/format';
import { isKnownAction, type AuditEventRow } from '@/lib/audit/queries';
import { cn } from '@/lib/utils';

const ACTOR_TYPE_LABELS = {
  EMPLOYEE: 'Employee',
  ANONYMOUS: 'Unauthenticated',
  CLI: 'Local script',
} as const;

function actionLabel(action: string): string {
  return isKnownAction(action, AUDIT_ACTIONS)
    ? AUDIT_ACTION_LABELS[action]
    : action;
}

function isNotable(action: string): boolean {
  return isKnownAction(action, AUDIT_ACTIONS)
    ? AUDIT_ACTION_IS_NOTABLE[action]
    : false;
}

/**
 * One event's before/after, behind a native `<details>`.
 *
 * Native rather than a custom collapsible: it is keyboard-operable, exposed
 * to assistive technology, and searchable by the browser's own find-in-page
 * without any JavaScript - which matters for a page whose entire job is
 * letting someone find something later.
 */
function StateDisclosure({ event }: { event: AuditEventRow }) {
  const before = formatStateJson(event.beforeState);
  const after = formatStateJson(event.afterState);

  if (before === null && after === null) {
    // Most events change no state (a sign-in records that it happened, not a
    // diff). An empty disclosure would imply data went missing.
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <details className="group/state">
      <summary className="inline-flex cursor-pointer list-none items-center rounded-sm text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="group-open/state:hidden">Show change</span>
        <span className="hidden group-open/state:inline">Hide change</span>
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        {before === null ? null : (
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Before
            </p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
              {before}
            </pre>
          </div>
        )}
        {after === null ? null : (
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              After
            </p>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-[11px] leading-relaxed">
              {after}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

type AuditEventTableProps = {
  events: AuditEventRow[];
};

export default function AuditEventTable({ events }: AuditEventTableProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-gutter">
        <h2 className="font-heading text-base font-semibold">
          No events recorded yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The recorder is live - this database simply has nothing in it yet.
          Signing in, signing out, a rejected credential, and provisioning an
          employee each append an event. This is an empty trail, not a missing
          one.
        </p>
      </div>
    );
  }

  return (
    // Wide content scrolls inside its own container; the page body must never
    // scroll sideways.
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[64rem] border-collapse text-sm">
        <caption className="sr-only">
          Audit events, newest first. Each row records when an action happened,
          who it is attributable to, what it touched, and why.
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            {[
              'When',
              'Actor',
              'Action',
              'Scope',
              'Reason',
              'Change',
              'Ref',
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-b border-border align-top last:border-b-0 hover:bg-muted/60"
            >
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                {formatAuditTimestamp(event.occurredAt)}
              </td>
              <td className="px-3 py-2.5">
                <span className="block break-all">{event.actorLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {ACTOR_TYPE_LABELS[event.actorType]}
                </span>
              </td>
              <td className="px-3 py-2.5">
                {/* The written label is the signal; the weight change is
                    secondary, never the only cue. */}
                <span
                  className={cn(
                    'whitespace-nowrap',
                    isNotable(event.action) && 'font-semibold text-destructive',
                  )}
                >
                  {actionLabel(event.action)}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs break-all">
                {event.scope}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {event.reason}
              </td>
              <td className="px-3 py-2.5">
                <StateDisclosure event={event} />
              </td>
              <td className="px-3 py-2.5">
                <span
                  className="font-mono text-xs text-muted-foreground"
                  title={event.correlationId}
                >
                  {shortCorrelationId(event.correlationId)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
