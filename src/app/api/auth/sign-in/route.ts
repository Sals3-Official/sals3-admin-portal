import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
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
    return invalidCredentials();
  }

  await createSession(employee.id);

  return NextResponse.json({ ok: true });
}
