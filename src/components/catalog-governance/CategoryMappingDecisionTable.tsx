import type { CategoryMappingDecisionRow } from '@/lib/catalog-governance/queries';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS: Record<string, string> = {
  CJ_DROPSHIPPING: 'CJdropshipping',
};

function formatDecidedAt(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(value);
}

type CategoryMappingDecisionTableProps = {
  decisions: CategoryMappingDecisionRow[];
};

export default function CategoryMappingDecisionTable({
  decisions,
}: CategoryMappingDecisionTableProps) {
  if (decisions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-gutter">
        <h2 className="font-heading text-base font-semibold">
          No decisions recorded yet
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Recording is live - this database simply has nothing in it yet.
          Deciding a mapping below appends a row here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <caption className="sr-only">
          Category mapping decisions, newest first.
        </caption>
        <thead>
          <tr className="border-b border-border text-left">
            {[
              'Supplier category',
              'Sals3 category (v1)',
              'Status',
              'Decided',
              'Reason',
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-3 py-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision) => (
            <tr
              key={decision.id}
              className="border-b border-border align-top last:border-b-0 hover:bg-muted/60"
            >
              <td className="px-3 py-2.5">
                <span className="block">{decision.observedCategoryName}</span>
                <span className="text-xs text-muted-foreground">
                  {PROVIDER_LABELS[decision.provider] ?? decision.provider} ·{' '}
                  {decision.externalCategoryId}
                </span>
              </td>
              <td className="px-3 py-2.5">{decision.sals3CategoryPath}</td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    'font-semibold',
                    decision.status === 'SUPERSEDED' &&
                      'text-muted-foreground line-through',
                  )}
                >
                  {decision.status === 'ACTIVE' ? 'Active' : 'Superseded'}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                {formatDecidedAt(decision.decidedAt)}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {decision.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
