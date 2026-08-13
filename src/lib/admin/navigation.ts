export type NavIconName =
  | 'layout-dashboard'
  | 'globe'
  | 'plane-takeoff'
  | 'store'
  | 'megaphone'
  | 'plug'
  | 'scroll-text'
  | 'history'
  | 'coins';

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Shown as the tooltip on the collapsed rail - what this screen is for, for staff who did not build it. */
  description?: string;
};

export type NavGroup = {
  label: string;
  /** Icon for the group's own parent row. */
  icon: NavIconName;
  items: NavItem[];
  /**
   * True when this group's one item *is* the group - it renders as one flat
   * 40px link with no separate parent row and no chevron. Stated per group
   * rather than inferred from item count, matching sals3-portal, where
   * Settings has a single child but still discloses it behind a chevron.
   */
  solo?: boolean;
};

/**
 * The six capability domains ADR-014 names for this application, plus an
 * Overview. These are the approved scope of the control plane - not an
 * invented menu.
 *
 * Deliberately no badge/count field anywhere. sals3-portal carries counts
 * only where a real query backs them and omits them entirely where it does
 * not, because a missing figure is never a zero. Nothing in this repository
 * has an authoritative backing service yet, so no row may carry a number.
 *
 * Every destination below is a real route that renders an honest
 * `UnavailableNotice`. Navigating to a page that states plainly what is not
 * built is not a fabricated console; rendering a plausible total there
 * would be (ADR-014, AGENTS.md rule 3).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    icon: 'layout-dashboard',
    solo: true,
    items: [
      {
        href: '/dashboard',
        label: 'Overview',
        icon: 'layout-dashboard',
      },
    ],
  },
  {
    label: 'Market governance',
    icon: 'globe',
    items: [
      {
        href: '/market-governance/seller-countries',
        label: 'Seller countries',
        icon: 'globe',
        description:
          'Where a seller/business may be registered, verified, and authorized to operate. Versioned independently of buyer destinations - never inferred from one another.',
      },
      {
        href: '/market-governance/buyer-countries',
        label: 'Buyer destinations',
        icon: 'plane-takeoff',
        description:
          'Where customers may purchase and receive delivery. Enabling one only permits evaluation; a product still needs destination-specific evidence.',
      },
    ],
  },
  {
    label: 'Seller accounts',
    icon: 'store',
    solo: true,
    items: [
      {
        href: '/seller-accounts',
        label: 'Seller accounts',
        icon: 'store',
        description:
          'Review, suspend, disable, and restore a seller account through explicit lifecycle states, each with a reason, scope, actor, and recovery path.',
      },
    ],
  },
  {
    label: 'Marketing',
    icon: 'megaphone',
    solo: true,
    items: [
      {
        href: '/marketing',
        label: 'Campaigns',
        icon: 'megaphone',
        description:
          'Versioned, scheduled platform campaigns, banners, and announcements, with editorial content kept separate from targeting and approval.',
      },
    ],
  },
  {
    label: 'Providers',
    icon: 'plug',
    solo: true,
    items: [
      {
        href: '/providers',
        label: 'Supplier providers',
        icon: 'plug',
        description:
          'Enable or disable an approved provider integration globally, with an audited incident kill switch at the smallest affected scope.',
      },
    ],
  },
  {
    label: 'Policy',
    icon: 'scroll-text',
    items: [
      {
        href: '/policy/publications',
        label: 'Publications',
        icon: 'scroll-text',
        description:
          'Versioned policy records published to consuming services, rather than silently changed code constants. Rollback republishes a prior valid version.',
      },
      {
        href: '/policy/audit',
        label: 'Audit trail',
        icon: 'history',
        description:
          'Immutable record of every consequential action: actor, reason, scope, before/after, correlation ID, and time.',
      },
    ],
  },
  {
    label: 'Pricing',
    icon: 'coins',
    solo: true,
    items: [
      {
        href: '/pricing',
        label: 'Platform pricing',
        icon: 'coins',
        description:
          'Platform-owned reference FX, Sals3 fees, and guardrails only. Merchant margins, product prices, and merchant FX adjustments are Seller Portal concerns (ADR-015).',
      },
    ],
  },
];

/** Flat list of every routable destination - used to name the current section. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
