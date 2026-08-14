import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { employeeScope, GLOBAL_SCOPE } from '@/lib/audit/actions';
import { recordAuditEvent } from '@/lib/audit/record';
import { createSession } from '@/lib/auth/session';
import { getDummyPasswordHash, verifyPassword } from '@/lib/auth/password';
import { signInSchema } from '@/lib/auth/schemas';
import getDb from '@/lib/db/client';
import { employees } from '@/lib/db/schema';

/**
 * Every credential failure returns this same response - unknown email, wrong
 * password - so a caller cannot tell which one happened. Matches the
 * sals3-ecommerce login pattern (ADR-009).
 */
function invalidCredentials() {
  return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    // Nothing usable to attribute a record to - a malformed body has no
    // attempted address to name, and inventing one would be worse than the
    // gap. The generic 401 still stands.
    return invalidCredentials();
  }

  const db = getDb();
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, parsed.data.email))
    .limit(1);

  // Always verify against *some* hash, even for an unknown email, so a
  // missing account and a wrong password take the same amount of work -
  // response timing must not disclose which addresses are registered.
  const passwordHash = employee?.passwordHash ?? (await getDummyPasswordHash());
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    passwordHash,
  );

  if (employee === undefined || !passwordMatches) {
    // Recorded as ANONYMOUS with the attempted address: the request proved
    // no identity, so naming an employee would assert one it never
    // established. The reason deliberately does not say whether the address
    // exists - the trail is readable by anyone who can sign in, and it must
    // not become the account-enumeration oracle the 401 refuses to be.
    await recordAuditEvent(db, {
      actor: { type: 'ANONYMOUS', label: parsed.data.email },
      action: 'EMPLOYEE_SIGN_IN_FAILED',
      scope: GLOBAL_SCOPE,
      reason: 'Credential rejected at the sign-in endpoint.',
    });

    return invalidCredentials();
  }

  await createSession(employee.id);

  await recordAuditEvent(db, {
    actor: {
      type: 'EMPLOYEE',
      employeeId: employee.id,
      label: employee.email,
    },
    action: 'EMPLOYEE_SIGNED_IN',
    scope: employeeScope(employee.id),
    reason: 'Employee authenticated with email and password.',
  });

  return NextResponse.json({ ok: true });
}
