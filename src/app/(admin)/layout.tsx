import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import AdminShellProvider from '@/components/admin/shell/AdminShellProvider';
import AdminSidebar from '@/components/admin/shell/AdminSidebar';
import AdminTopbar from '@/components/admin/shell/AdminTopbar';
import { SidebarInset } from '@/components/ui/sidebar';
import { getSessionEmployee } from '@/lib/auth/session';

type AdminLayoutProps = Readonly<{ children: ReactNode }>;

/**
 * The deny-by-default gate for every route in this group. A Server
 * Component: it re-resolves the session cookie to a live, unexpired row on
 * every render rather than trusting the cookie's mere presence, and no
 * session means no shell and no children - a redirect to the sign-in gate.
 *
 * Placing the check in the layout rather than in each page is a convenience,
 * not the security boundary: a Next.js layout does not re-run on every
 * client-side navigation within the group, so any route that performs a
 * consequential read or mutation must still check authorization itself.
 * Today none do - every page below renders a static notice.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const employee = await getSessionEmployee();

  if (employee === null) {
    redirect('/');
  }

  return (
    <AdminShellProvider>
      {/* The rail is a long list of links before the content in tab order;
          a skip link is what keeps a keyboard user from tabbing through all
          of it on every navigation. */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-90 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to main content
      </a>
      <AdminSidebar />
      {/* `min-w-0` matters: a flex child defaults to `min-width: auto`, so a
          wide table would push this column past the viewport and scroll the
          whole page sideways instead of scrolling inside its own container. */}
      {/* `SidebarInset` is itself the page's <main>; the content column
          inside it is a plain div so the document never nests two. */}
      <SidebarInset className="min-w-0">
        <AdminTopbar email={employee.email} />
        <div
          id="admin-main"
          className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6"
        >
          {children}
        </div>
      </SidebarInset>
    </AdminShellProvider>
  );
}
