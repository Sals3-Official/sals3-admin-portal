import { redirect } from 'next/navigation';
import EmployeeSignInForm from '@/components/admin/EmployeeSignInForm';
import { getSessionEmployee } from '@/lib/auth/session';

/**
 * Sign-in gate. Mirrors sals3-portal's own root route: "/" is the sign-in
 * screen, not a dashboard. The shell (card, spacing, field layout) is forked
 * from sals3-portal's AuthShell/LoginForm so the two products share one
 * login pattern; only the color layer differs (see globals.css).
 *
 * A live session redirects straight to /dashboard rather than re-showing the
 * form - the deny-by-default check that gates /dashboard itself is what
 * actually matters; this redirect is just not making an already-signed-in
 * employee look at a login screen again.
 */
export default async function HomePage() {
  const employee = await getSessionEmployee();

  if (employee !== null) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-5">
          <p className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
            Sals3 Admin Portal
          </p>
          <h1 className="mt-1 font-heading text-xl font-semibold tracking-normal">
            Employee sign-in
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Use your Sals3 employee email and password.
          </p>
        </div>
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <EmployeeSignInForm />
        </section>
      </div>
    </main>
  );
}
