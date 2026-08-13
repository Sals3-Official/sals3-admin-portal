'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '@/components/ui/sidebar';
import type { NavGroup } from '@/lib/admin/navigation';

/**
 * Long enough that crossing the gap between the icon and the panel never
 * dismisses it, short enough that moving on to the next icon doesn't leave
 * a stale panel hanging.
 */
const CLOSE_DELAY_MS = 220;

type AdminSidebarFlyoutProps = {
  group: NavGroup;
  triggerIcon: ReactNode;
  /** Reveals the group in the open rail instead of the flyout - fired on click. */
  onExpandGroup: () => void;
};

/**
 * Collapsed-rail hover flyout for a parent with children. Two bugs the
 * sals3-portal design explicitly calls out, and which this implementation
 * exists to avoid: (1) positioning from `offsetTop` lands ~64px off because
 * the rail's padding box and the overlay's containing block differ - fixed
 * here by reading `getBoundingClientRect()` on open and portaling straight
 * to `document.body`, which also escapes `SidebarContent`'s
 * `overflow-hidden` (only set while the rail is icon-only) that would
 * otherwise clip an `absolute`-positioned panel. (2) a CSS-only `:hover`
 * panel drops the instant the pointer crosses the icon-to-panel gap - fixed
 * here with real state and a shared close timer either surface can cancel.
 */
export default function AdminSidebarFlyout({
  group,
  triggerIcon,
  onExpandGroup,
}: AdminSidebarFlyoutProps) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const [open, setOpenState] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openNow = () => {
    clearCloseTimer();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect !== undefined) {
      setPosition({ left: rect.right + 4, top: rect.top });
    }
    setOpenState(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenState(false), CLOSE_DELAY_MS);
  };

  // Unmounting mid-timer would otherwise fire `setOpenState` after the
  // component is gone.
  useEffect(() => clearCloseTimer, []);

  // A menu click navigates without remounting the rail (it lives in a
  // persistent layout), so the panel must close itself on route change.
  // Adjusting state during render (React's documented pattern for this)
  // instead of an effect, which would fire a redundant extra render.
  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    setOpenState(false);
  }

  const onTriggerClick = () => {
    setOpenState(false);
    onExpandGroup();
    setOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onTriggerClick}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
        onFocus={openNow}
        onBlur={scheduleClose}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={group.label}
        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white"
      >
        {triggerIcon}
      </button>
      {open && position !== null
        ? createPortal(
            <div
              role="menu"
              tabIndex={-1}
              aria-label={group.label}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              style={{ left: position.left, top: position.top }}
              className="fixed z-80 min-w-[236px] rounded-lg border border-border bg-popover py-1.5 shadow-[0_12px_32px_rgba(72,25,33,.22)]"
            >
              <p className="border-b border-muted px-3.5 pt-1.5 pb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  role="menuitem"
                  className="flex min-h-[34px] items-center gap-2.5 px-3.5 text-[12.5px] whitespace-nowrap text-foreground transition-colors hover:bg-muted"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
