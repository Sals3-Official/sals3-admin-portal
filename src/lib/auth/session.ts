import 'server-only';

import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import getDb from '@/lib/db/client';
import { employees, employeeSessions } from '@/lib/db/schema';

const SESSION_COOKIE = 'sals3_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type SessionEmployee = {
  id: string;
  email: string;
};

/**
 * Mints a server-side session row and sets its opaque id as an httpOnly
 * cookie. Opaque and DB-backed rather than a self-verifying signed token, so
 * `destroySession` actually revokes access instead of only asking the
 * browser to forget a cookie that would otherwise stay valid until expiry.
 */
export async function createSession(employeeId: string): Promise<void> {
  const db = getDb();
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(employeeSessions).values({ id, employeeId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * The deny-by-default check: resolves the current request's cookie to a
 * live, unexpired session row and the employee it belongs to, or `null`.
 * Every protected server read/render calls this rather than trusting the
 * cookie's mere presence.
 */
export async function getSessionEmployee(): Promise<SessionEmployee | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId === undefined) {
    return null;
  }

  const db = getDb();
  const [row] = await db
    .select({
      employeeId: employees.id,
      email: employees.email,
      expiresAt: employeeSessions.expiresAt,
    })
    .from(employeeSessions)
    .innerJoin(employees, eq(employeeSessions.employeeId, employees.id))
    .where(eq(employeeSessions.id, sessionId))
    .limit(1);

  if (row === undefined || row.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return { id: row.employeeId, email: row.email };
}

/** Deletes the session row (real revocation) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId !== undefined) {
    const db = getDb();
    await db.delete(employeeSessions).where(eq(employeeSessions.id, sessionId));
  }

  cookieStore.delete(SESSION_COOKIE);
}
