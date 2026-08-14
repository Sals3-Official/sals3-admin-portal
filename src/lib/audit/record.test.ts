import { describe, expect, it, vi } from 'vitest';
import { recordAuditEvent } from './record';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, employeeScope } from './actions';

/** Minimal stand-in for a Drizzle executor: captures what was inserted. */
function fakeExecutor() {
  const values = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockReturnValue({ values });

  return { executor: { insert } as never, insert, values };
}

describe('recordAuditEvent', () => {
  it('attributes an employee event to that employee row', async () => {
    const { executor, values } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'EMPLOYEE', employeeId: 'emp-1', label: 'a@sals3.com' },
      action: 'EMPLOYEE_SIGNED_IN',
      scope: employeeScope('emp-1'),
      reason: 'Employee authenticated with email and password.',
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'EMPLOYEE',
        actorEmployeeId: 'emp-1',
        actorLabel: 'a@sals3.com',
        action: 'EMPLOYEE_SIGNED_IN',
        scope: 'employee:emp-1',
      }),
    );
  });

  /**
   * The regression this guards: a failed sign-in proved no identity. Linking
   * it to an employee row would assert the request established one, which
   * would make the trail claim something that did not happen.
   */
  it('never links a non-employee actor to an employee row', async () => {
    const { executor, values } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'ANONYMOUS', label: 'someone@sals3.com' },
      action: 'EMPLOYEE_SIGN_IN_FAILED',
      scope: 'global',
      reason: 'Credential rejected at the sign-in endpoint.',
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'ANONYMOUS',
        actorEmployeeId: null,
      }),
    );
  });

  it('records CLI events without an employee row', async () => {
    const { executor, values } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'CLI', label: 'cli:create-employee' },
      action: 'EMPLOYEE_PROVISIONED',
      scope: employeeScope('emp-2'),
      reason: 'Employee account created by the local provisioning script.',
      after: { email: 'new@sals3.com' },
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'CLI',
        actorEmployeeId: null,
        afterState: { email: 'new@sals3.com' },
      }),
    );
  });

  it('mints a correlation id when none is supplied, and returns it', async () => {
    const { executor, values } = fakeExecutor();

    const correlationId = await recordAuditEvent(executor, {
      actor: { type: 'CLI', label: 'cli' },
      action: 'EMPLOYEE_PROVISIONED',
      scope: 'global',
      reason: 'because',
    });

    expect(correlationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId }),
    );
  });

  it('reuses a supplied correlation id so one operation stays one story', async () => {
    const { executor, values } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'CLI', label: 'cli' },
      action: 'EMPLOYEE_PROVISIONED',
      scope: 'global',
      reason: 'because',
      correlationId: 'fixed-id',
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'fixed-id' }),
    );
  });

  it('writes through the executor it was given, never a global connection', async () => {
    // The point of the parameter: an audit record must be able to join the
    // caller's transaction, so it cannot commit when the change it describes
    // was rolled back.
    const { executor, insert } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'CLI', label: 'cli' },
      action: 'EMPLOYEE_PROVISIONED',
      scope: 'global',
      reason: 'because',
    });

    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('stores nothing for before/after when the action changed no state', async () => {
    const { executor, values } = fakeExecutor();

    await recordAuditEvent(executor, {
      actor: { type: 'EMPLOYEE', employeeId: 'emp-1', label: 'a@sals3.com' },
      action: 'EMPLOYEE_SIGNED_OUT',
      scope: employeeScope('emp-1'),
      reason: 'Employee signed out; session revoked server-side.',
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ beforeState: null, afterState: null }),
    );
  });
});

describe('audit vocabulary', () => {
  it('gives every action a plain-language label', () => {
    AUDIT_ACTIONS.forEach((action) => {
      expect(AUDIT_ACTION_LABELS[action]).toBeTruthy();
    });
  });

  it('has no duplicate action values', () => {
    expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length);
  });
});
