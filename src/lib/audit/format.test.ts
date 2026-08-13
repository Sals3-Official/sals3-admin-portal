import { describe, expect, it } from 'vitest';
import {
  formatAuditTimestamp,
  formatStateJson,
  shortCorrelationId,
} from './format';

describe('formatAuditTimestamp', () => {
  it('renders UTC in a fixed, sortable shape', () => {
    expect(formatAuditTimestamp(new Date('2026-08-14T01:52:33.000Z'))).toBe(
      '2026-08-14 01:52:33 UTC',
    );
  });

  it('zero-pads every component', () => {
    expect(formatAuditTimestamp(new Date('2026-01-02T03:04:05.000Z'))).toBe(
      '2026-01-02 03:04:05 UTC',
    );
  });

  /**
   * The regression this guards: switching to `toLocaleString` would render a
   * different string on a machine in a different zone, which is both a
   * hydration mismatch and two readers disagreeing about when something
   * happened.
   */
  it('ignores the host timezone', () => {
    const instant = new Date('2026-08-14T23:30:00.000Z');
    const original = process.env.TZ;

    try {
      process.env.TZ = 'Asia/Manila';
      const manila = formatAuditTimestamp(instant);
      process.env.TZ = 'UTC';
      const utc = formatAuditTimestamp(instant);

      expect(manila).toBe(utc);
      expect(manila).toBe('2026-08-14 23:30:00 UTC');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('shortCorrelationId', () => {
  it('keeps the first segment of a UUID', () => {
    expect(shortCorrelationId('1702fb04-e65f-4ae7-8396-67bb26184a26')).toBe(
      '1702fb04',
    );
  });

  it('returns the input unchanged when it has no segments', () => {
    expect(shortCorrelationId('abc')).toBe('abc');
  });
});

describe('formatStateJson', () => {
  it('returns null for nothing recorded, so the caller can omit the panel', () => {
    expect(formatStateJson(null)).toBeNull();
    expect(formatStateJson(undefined)).toBeNull();
  });

  it('pretty-prints a recorded object', () => {
    expect(formatStateJson({ email: 'employee@sals3.com' })).toBe(
      '{\n  "email": "employee@sals3.com"\n}',
    );
  });

  it('does not treat a falsy-but-real value as absent', () => {
    expect(formatStateJson(false)).toBe('false');
    expect(formatStateJson(0)).toBe('0');
  });
});
