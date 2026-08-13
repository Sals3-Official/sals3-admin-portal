import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Campaigns | Sals3 Admin Portal' };

export default function MarketingPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Global marketing and communications"
        description="Versioned, scheduled platform campaigns, banners, announcements, and seller messages."
      />

      <UnavailableNotice title="Campaign publication" reason="NOT_IMPLEMENTED">
        Editorial content, targeting, eligibility, placement, schedule, and
        approval are separate concerns and no store for any of them exists yet.
        ADR-014 also fixes a hard limit on what this surface may ever publish:
        never a fabricated price, discount, scarcity claim, sale, review, or
        qualification claim - and the ecosystem currently has no genuine
        promotion or sale-period concept to draw one from.
      </UnavailableNotice>
    </div>
  );
}
