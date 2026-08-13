import PageHeader from '@/components/admin/shell/PageHeader';
import UnavailableNotice from '@/components/admin/UnavailableNotice';

export const metadata = { title: 'Publications | Sals3 Admin Portal' };

export default function PolicyPublicationsPage() {
  return (
    <div className="flex flex-col gap-section">
      <PageHeader
        title="Policy publications"
        description="Versioned policy records published to consuming services."
      />

      <UnavailableNotice title="Publication pipeline" reason="NOT_IMPLEMENTED">
        Policy is meant to travel to Portal as versioned, published state over a
        secret-protected server endpoint, with the consuming service enforcing
        it on its own protected path - never as a silently changed code
        constant. Rollback republishes a prior valid version and never rewrites
        history. The publication store, the endpoint, and its shared secret do
        not exist yet; `ADMIN_POLICY_PUBLICATION_TOKEN` is a named placeholder
        that nothing reads.
      </UnavailableNotice>
    </div>
  );
}
