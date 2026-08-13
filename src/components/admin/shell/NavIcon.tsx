import {
  Coins,
  Globe,
  History,
  LayoutDashboard,
  Megaphone,
  PlaneTakeoff,
  Plug,
  ScrollText,
  Store,
} from 'lucide-react';
import type { NavIconName } from '@/lib/admin/navigation';

const ICONS = {
  'layout-dashboard': LayoutDashboard,
  globe: Globe,
  'plane-takeoff': PlaneTakeoff,
  store: Store,
  megaphone: Megaphone,
  plug: Plug,
  'scroll-text': ScrollText,
  history: History,
  coins: Coins,
} as const;

type NavIconProps = {
  name: NavIconName;
};

/** Lucide SVG icons only. Icons are decorative; the label carries the name. */
export default function NavIcon({ name }: NavIconProps) {
  const Glyph = ICONS[name];

  return <Glyph aria-hidden="true" className="size-4 shrink-0" />;
}
