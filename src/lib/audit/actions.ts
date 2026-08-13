/**
 * The audit vocabulary.
 *
 * A closed union rather than a free-text string, because a trail whose
 * `action` values drift (`SIGNED_IN`, `signin`, `employee.login`) cannot be
 * filtered, counted, or reasoned about later - and the point of recording is
 * to be able to answer questions afterwards.
 *
 * Every value here corresponds to something this application can actually
 * do today. Adding a value before the action exists would be the same
 * fabrication `UnavailableNotice` guards against, one layer down.
 */
export const AUDIT_ACTIONS = [
  'EMPLOYEE_SIGNED_IN',
  'EMPLOYEE_SIGN_IN_FAILED',
  'EMPLOYEE_SIGNED_OUT',
  'EMPLOYEE_PROVISIONED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Plain-language label for the trail. Never colour alone, per AGENTS.md. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  EMPLOYEE_SIGNED_IN: 'Employee signed in',
  EMPLOYEE_SIGN_IN_FAILED: 'Sign-in failed',
  EMPLOYEE_SIGNED_OUT: 'Employee signed out',
  EMPLOYEE_PROVISIONED: 'Employee provisioned',
};

/**
 * Whether an action is a security signal worth visually separating from
 * ordinary activity. A failed sign-in is not an error the system made, so it
 * is not `destructive`; it is something a reader should notice.
 */
export const AUDIT_ACTION_IS_NOTABLE: Record<AuditAction, boolean> = {
  EMPLOYEE_SIGNED_IN: false,
  EMPLOYEE_SIGN_IN_FAILED: true,
  EMPLOYEE_SIGNED_OUT: false,
  EMPLOYEE_PROVISIONED: true,
};

/** `employee:<uuid>`, `global`, and so on - what the action touched. */
export function employeeScope(employeeId: string): string {
  return `employee:${employeeId}`;
}

export const GLOBAL_SCOPE = 'global';
