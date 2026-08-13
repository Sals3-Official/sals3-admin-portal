import { NextResponse } from 'next/server';
import { employeeScope } from '@/lib/audit/actions';
import { recordAuditEvent } from '@/lib/audit/record';
import { destroySession, getSessionEmployee } from '@/lib/auth/session';
import getDb from '@/lib/db/client';

export async function POST() {
  // Resolved before the session is destroyed - afterwards there is no
  // identity left to attribute the event to.
  const employee = await getSessionEmployee();

  await destroySession();

  if (employee !== null) {
    await recordAuditEvent(getDb(), {
      actor: {
        type: 'EMPLOYEE',
        employeeId: employee.id,
        label: employee.email,
      },
      action: 'EMPLOYEE_SIGNED_OUT',
      scope: employeeScope(employee.id),
      reason: 'Employee signed out; session revoked server-side.',
    });
  }

  return NextResponse.json({ ok: true });
}
