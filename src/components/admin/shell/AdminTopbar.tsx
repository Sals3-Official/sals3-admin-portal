import { SidebarTrigger } from '@/components/ui/sidebar';
import SignOutButton from '@/components/admin/SignOutButton';
import AdminTopbarSection from './AdminTopbarSection';

type AdminTopbarProps = {
  email: string;
};

/**
 * Sticky top bar. Shows the signed-in employee, so a person can see which
 * identity an action would be recorded against.
 *
 * No role line yet, deliberately: sals3-portal prints the signed-in role
 * here, but this application has no employee permission model, and printing
 * an invented role like "Administrator" would claim an authority level
 * nothing grants or enforces.
 *
 * On desktop the rail's own logo is the sole open/close control - no trigger
 * here. Mobile is different: the rail becomes an off-screen drawer with
 * nothing visible to click until it opens, hence `md:hidden` rather than
 * removing the trigger outright.
 */
export default function AdminTopbar({ email }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      <SidebarTrigger className="cursor-pointer md:hidden" />
      <AdminTopbarSection />
      <div className="ml-auto text-right">
        <p className="text-sm leading-tight font-medium">{email}</p>
        <p className="text-xs leading-tight text-muted-foreground">Employee</p>
      </div>
      <SignOutButton />
    </header>
  );
}
