import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The honest "this does not exist yet" primitive.
 *
 * ADR-014 and the owner's control-tower direction both forbid a fabricated
 * global dashboard: a capability with no authoritative backing service must
 * say so plainly rather than render a plausible number. This component is the
 * single place that wording lives, so no screen can invent its own softer
 * phrasing - or worse, a placeholder total.
 *
 * The three reasons are genuinely different problems with different owners,
 * which is why this is a union rather than one generic "empty" state:
 *
 *   NOT_IMPLEMENTED         - the backing domain exists in an approved plan
 *                             but no code implements it yet. Engineering work.
 *   NOT_CONNECTED           - the code exists but this deployment has no
 *                             configured connection to it. Operations work.
 *   NO_AUTHORITATIVE_SOURCE - nothing in the ecosystem is authoritative for
 *                             this data yet, so any figure shown would be
 *                             invented. Requires a product/architecture
 *                             decision, not a bug fix.
 */
export const UNAVAILABLE_REASONS = [
  'NOT_IMPLEMENTED',
  'NOT_CONNECTED',
  'NO_AUTHORITATIVE_SOURCE',
] as const;

export type UnavailableReason = (typeof UNAVAILABLE_REASONS)[number];

export const UNAVAILABLE_REASON_LABELS: Record<UnavailableReason, string> = {
  NOT_IMPLEMENTED: 'Not implemented',
  NOT_CONNECTED: 'Not connected',
  NO_AUTHORITATIVE_SOURCE: 'No authoritative data source',
};

type UnavailableNoticeProps = {
  /** What the operator was looking for, e.g. "Global order search". */
  title: string;
  reason: UnavailableReason;
  /** Plain-language explanation of why, and what would unblock it. */
  children: ReactNode;
  className?: string;
};

export default function UnavailableNotice({
  title,
  reason,
  children,
  className,
}: UnavailableNoticeProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-card p-gutter text-card-foreground',
        className,
      )}
    >
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {/*
        The status is a written label, never colour alone - the reason text
        below is the accessible signal, and it is readable with styles off.
      */}
      <p className="mt-1 text-sm font-medium text-muted-foreground">
        {UNAVAILABLE_REASON_LABELS[reason]}
      </p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}
