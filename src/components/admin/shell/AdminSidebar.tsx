'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { NAV_GROUPS, type NavGroup } from '@/lib/admin/navigation';
import NavGroupRow from './AdminSidebarRows';

/** Every group starts open; the user can still collapse one, and that choice survives client-side navigation because this component stays mounted across it. */
function useGroupOpenState(groups: NavGroup[]) {
  return useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.label, true])),
  );
}

/**
 * The rail's own logo is the open/close control, matching sals3-portal.
 * A lettermark rather than an image: this repository ships no brand asset,
 * and inventing one would be a fabricated artifact.
 */
function SidebarToggleButton() {
  const { state, isMobile, openMobile, toggleSidebar } = useSidebar();
  // On mobile the rail is a Sheet that ignores `state` (the desktop
  // icon/expanded concept) entirely and renders full content regardless -
  // `openMobile` is the real "is it open" answer there.
  const isOpen = isMobile ? openMobile : state !== 'collapsed';
  const label = isOpen ? 'Close sidebar' : 'Open sidebar';

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-expanded={isOpen}
      aria-label={label}
      title={label}
      className="ml-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-sidebar-primary font-display text-[13px] font-bold text-sidebar-primary-foreground transition-colors hover:bg-sidebar-accent hover:text-white"
    >
      S3
    </button>
  );
}

/**
 * Navigation rail. A client component because it reads the current route to
 * mark the active link.
 *
 * Unlike sals3-portal's rail this takes no permission-filtered group list and
 * carries no badges: no employee permission model and no authoritative
 * counting service exist yet, and a rail that filtered by a permission
 * nothing enforces, or showed a count nothing backs, would be theatre.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const [openByLabel, setOpenByLabel] = useGroupOpenState(NAV_GROUPS);

  const rows: ReactNode[] = NAV_GROUPS.map((group, index) => {
    const boundary =
      collapsed && index > 0 ? (
        <div
          key={`${group.label}-boundary`}
          className="mx-3 my-1 h-px bg-sidebar-border"
        />
      ) : null;

    return (
      <div key={group.label}>
        {boundary}
        <NavGroupRow
          group={group}
          pathname={pathname}
          collapsed={collapsed}
          open={openByLabel[group.label] ?? true}
          onToggle={() =>
            setOpenByLabel((current) => ({
              ...current,
              [group.label]: !(current[group.label] ?? true),
            }))
          }
          onForceOpen={() =>
            setOpenByLabel((current) => ({ ...current, [group.label]: true }))
          }
        />
      </div>
    );
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center gap-0 overflow-hidden border-b border-sidebar-border px-0 pl-1.5">
        <SidebarToggleButton />
        <span className="ml-3 font-display text-[15px] font-semibold whitespace-nowrap text-white transition-opacity duration-[180ms] ease-in-out group-data-[collapsible=icon]:opacity-0">
          Sals3 Admin
        </span>
      </SidebarHeader>
      <SidebarContent className="px-0 py-2">
        <nav aria-label="Admin sections">{rows}</nav>
      </SidebarContent>
    </Sidebar>
  );
}
