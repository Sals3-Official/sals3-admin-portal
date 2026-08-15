import { describe, expect, it, vi } from 'vitest';

// `record-decision.ts` (via `taxonomy.ts`) is `server-only`, which throws on
// import outside a Server Component. Stood down here the same way
// `sals3-portal`'s equivalent tests do, since this exercises pure logic.
vi.mock('server-only', () => ({}));

/* eslint-disable import/first */
import { recordCategoryMappingDecision } from './record-decision';
/* eslint-enable import/first */

const DECIDED_BY = { employeeId: 'emp-1', label: 'reviewer@sals3.com' };

/** A real Sals3 Taxonomy v1 code/path, so validation genuinely resolves it. */
const REAL_CODE = 'CAT-GGL-1';
const REAL_PATH = 'Animals & Pet Supplies';

type Row = Record<string, unknown>;

/**
 * A fake transaction whose `select().from().where().limit()` chain returns
 * whatever `existingRows` holds, and which records every insert/update it
 * receives - matching `record.test.ts`'s `fakeExecutor` idiom, extended for
 * a transaction with a select-then-write shape.
 */
function fakeDb(existingRows: Row[] = []) {
  const writes: { table: unknown; op: 'insert' | 'update'; values: Row }[] = [];
  let insertedId = 0;

  const tx = {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(() => Promise.resolve(existingRows)),
      };
      return builder;
    }),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((values: Row) => {
        insertedId += 1;
        writes.push({ table, op: 'insert', values });
        return {
          returning: vi.fn(() =>
            Promise.resolve([{ id: `decision-${insertedId}` }]),
          ),
        };
      }),
    })),
    update: vi.fn((table: unknown) => ({
      set: vi.fn((values: Row) => {
        writes.push({ table, op: 'update', values });
        return { where: vi.fn(() => Promise.resolve(undefined)) };
      }),
    })),
  };

  const db = {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(tx),
    ),
  };

  return { db: db as never, writes };
}

describe('recordCategoryMappingDecision', () => {
  it('refuses a code that does not resolve in Sals3 Taxonomy v1', async () => {
    const { db, writes } = fakeDb();

    const result = await recordCategoryMappingDecision(db, {
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      observedCategoryName: "Men's Jackets",
      sals3CategoryCode: 'NOT-A-REAL-CODE',
      reason: 'Testing an unresolvable code.',
      decidedBy: DECIDED_BY,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: 'UNKNOWN_SALS3_CATEGORY',
    });
    // Refused before any write - an unresolvable code must not reach the table.
    expect(writes).toHaveLength(0);
  });

  it('records a first decision with no prior mapping to supersede', async () => {
    const { db, writes } = fakeDb([]);

    const result = await recordCategoryMappingDecision(db, {
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      observedCategoryName: "Men's Jackets",
      sals3CategoryCode: REAL_CODE,
      reason: 'First curated decision for this supplier category.',
      decidedBy: DECIDED_BY,
    });

    expect(result).toMatchObject({ ok: true });

    const insertWrite = writes.find(
      (write) => write.op === 'insert' && 'sals3CategoryCode' in write.values,
    );
    expect(insertWrite?.values).toMatchObject({
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      sals3CategoryCode: REAL_CODE,
      sals3CategoryPath: REAL_PATH,
      supersedesId: null,
      decidedByEmployeeId: 'emp-1',
    });
    // Nothing existed to supersede, so no update was issued.
    expect(writes.some((write) => write.op === 'update')).toBe(false);
  });

  /**
   * The regression this covers: `sals3CategoryPath` must come from the
   * server's own lookup of the code, never from anything the caller passed
   * in - the input type does not even accept a path.
   */
  it('derives the stored path from the code, never trusting a client-supplied one', async () => {
    const { db, writes } = fakeDb([]);

    await recordCategoryMappingDecision(db, {
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      observedCategoryName: "Men's Jackets",
      sals3CategoryCode: REAL_CODE,
      reason: 'because',
      decidedBy: DECIDED_BY,
    });

    const insertWrite = writes.find(
      (write) => write.op === 'insert' && 'sals3CategoryCode' in write.values,
    );
    expect(insertWrite?.values.sals3CategoryPath).toBe(REAL_PATH);
  });

  it('supersedes the prior active decision rather than overwriting it', async () => {
    const { db, writes } = fakeDb([{ id: 'decision-old' }]);

    const result = await recordCategoryMappingDecision(db, {
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      observedCategoryName: "Men's Jackets",
      sals3CategoryCode: REAL_CODE,
      reason: 'Correcting the earlier decision.',
      decidedBy: DECIDED_BY,
    });

    expect(result).toMatchObject({ ok: true });

    const updateWrite = writes.find((write) => write.op === 'update');
    expect(updateWrite?.values).toMatchObject({ status: 'SUPERSEDED' });

    const insertWrite = writes.find(
      (write) => write.op === 'insert' && 'sals3CategoryCode' in write.values,
    );
    expect(insertWrite?.values.supersedesId).toBe('decision-old');
  });

  it('records both a decided and a superseded audit event when replacing a mapping', async () => {
    const { db, writes } = fakeDb([{ id: 'decision-old' }]);
    // Audit events land through the same fake transaction's insert(), on a
    // different table object - captured generically by `writes` already.

    await recordCategoryMappingDecision(db, {
      provider: 'CJ_DROPSHIPPING',
      externalCategoryId: 'cj-cat-1',
      observedCategoryName: "Men's Jackets",
      sals3CategoryCode: REAL_CODE,
      reason: 'Correcting the earlier decision.',
      decidedBy: DECIDED_BY,
    });

    const auditInserts = writes.filter(
      (write) => write.op === 'insert' && 'action' in write.values,
    );
    expect(auditInserts.map((write) => write.values.action)).toEqual([
      'CATEGORY_MAPPING_SUPERSEDED',
      'CATEGORY_MAPPING_DECIDED',
    ]);
  });
});
