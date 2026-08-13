import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/lib/admin/navigation';
import NavIcon from './NavIcon';
import AdminSidebarFlyout from './AdminSidebarFlyout';

function isCurrent(href: string, pathname: string): boolean {
  return !href.includes('?') && href === pathname;
}

export function groupIsCurrent(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isCurrent(item.href, pathname));
}

export function isSoloGroup(group: NavGroup): boolean {
  return group.solo === true;
}

/** The 3px accent bleeding off the rail's left edge - the "you are here" signal alongside the label itself. */
function ActiveEdge({ active, inset }: { active: boolean; inset: number }) {
  if (!active) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute left-[-6px] w-[3px] rounded-r-[3px] bg-sidebar-primary"
      style={{ top: inset, bottom: inset }}
    />
  );
}

function RowIcon({ icon }: { icon: NavItem['icon'] }) {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center">
      <NavIcon name={icon} />
    </span>
  );
}

/** Top-level row with no children - a plain link, no chevron. */
function SoloRow({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active = isCurrent(item.href, pathname);
  const link = (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative mx-1.5 my-0.5 flex h-10 items-center gap-3 rounded-md px-2 text-[13px] font-medium transition-colors hover:bg-sidebar-accent hover:text-white',
        active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground',
      )}
    >
      <ActiveEdge active={active} inset={8} />
      <RowIcon icon={item.icon} />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;

  return (
    // Scanning down the rail shouldn't pop a tooltip per icon - a longer
    // open delay than the app-wide `TooltipProvider` default makes it
    // deliberate.
    <TooltipProvider delay={450}>
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Child row (52px indent) - never rendered while the rail is compact. */
function ChildRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isCurrent(item.href, pathname);

  return (
    <Link
      href={item.href}
      prefetch={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative mx-1.5 my-px flex h-[34px] items-center gap-2 rounded-md pr-2 pl-[52px] text-[12.5px] whitespace-nowrap transition-colors hover:bg-sidebar-accent hover:text-white',
        active
          ? 'bg-sidebar-accent text-white'
          : 'text-sidebar-foreground/[.82]',
      )}
    >
      <ActiveEdge active={active} inset={6} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/** Expanded-rail parent row: the group label is itself the menu item, with a chevron disclosing its children below. */
function ExpandedParentRow({
  group,
  open,
  onToggle,
  active,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="relative mx-1.5 my-0.5 flex h-10 w-[calc(100%-12px)] cursor-pointer items-center gap-3 rounded-md px-2 text-left text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white"
    >
      <ActiveEdge active={active} inset={8} />
      <RowIcon icon={group.icon} />
      <span className="truncate">{group.label}</span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          'ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 transition-transform duration-200 ease-in-out',
          open ? '' : '-rotate-90',
        )}
      />
    </button>
  );
}

type NavGroupRowProps = {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onForceOpen: () => void;
};

/** One group's row(s): a flat solo link, a collapsed-rail flyout trigger, or an expanded parent row plus its children. */
export default function NavGroupRow({
  group,
  pathname,
  collapsed,
  open,
  onToggle,
  onForceOpen,
}: NavGroupRowProps) {
  if (isSoloGroup(group)) {
    return (
      <SoloRow
        item={group.items[0]}
        pathname={pathname}
        collapsed={collapsed}
      />
    );
  }

  const active = groupIsCurrent(group, pathname);

  if (collapsed) {
    return (
      <AdminSidebarFlyout
        group={group}
        onExpandGroup={onForceOpen}
        triggerIcon={<RowIcon icon={group.icon} />}
      />
    );
  }

  return (
    <>
      <ExpandedParentRow
        group={group}
        open={open}
        onToggle={onToggle}
        active={active}
      />
      {open ? (
        <div className="flex flex-col">
          {group.items.map((item) => (
            <ChildRow key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </>
  );
}
