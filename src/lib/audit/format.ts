/**
 * Formats an audit timestamp as `YYYY-MM-DD HH:MM:SS UTC`.
 *
 * UTC, always, and computed from the Date's own UTC accessors rather than
 * `toLocaleString`. Two reasons, both real:
 *
 * 1. A server-rendered local time and a client-rehydrated local time can
 *    disagree, which React reports as a hydration mismatch. This function is
 *    deterministic on any machine.
 * 2. An audit trail read by people in different places must not show each of
 *    them a different wall-clock string for the same event. "When did this
 *    happen" has one answer, and the suffix says which zone it is in rather
 *    than leaving the reader to assume.
 */
export function formatAuditTimestamp(value: Date): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');

  const date = [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
  ].join('-');

  const time = [
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
  ].join(':');

  return `${date} ${time} UTC`;
}

/** First segment of a UUID - enough to correlate by eye, short enough to scan. */
export function shortCorrelationId(correlationId: string): string {
  return correlationId.split('-')[0] ?? correlationId;
}

/**
 * Pretty-prints a before/after value for the disclosure panel. Returns null
 * when there is nothing recorded, so callers can omit the panel rather than
 * render an empty box that looks like missing data.
 */
export function formatStateJson(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  return JSON.stringify(value, null, 2);
}
