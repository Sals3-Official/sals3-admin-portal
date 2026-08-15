'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RecordCategoryMappingDecisionActionResult } from '@/app/(admin)/catalog/category-mapping/actions';
import Sals3CategoryPicker, {
  type Sals3CategoryOption,
} from './Sals3CategoryPicker';

type RecordCategoryMappingFormProps = {
  sals3CategoryOptions: Sals3CategoryOption[];
  recordDecision: (
    input: unknown,
  ) => Promise<RecordCategoryMappingDecisionActionResult>;
};

const PROVIDER = 'CJ_DROPSHIPPING' as const;

/**
 * Manual entry rather than a picked-from-a-list queue, because the live feed
 * of "CJ categories awaiting review" needs a read endpoint into
 * `sals3-portal` that does not exist yet. A reviewer today already knows
 * which supplier category id and observed name they are deciding - this form
 * lets them record that decision honestly without a fabricated queue.
 */
export default function RecordCategoryMappingForm({
  sals3CategoryOptions,
  recordDecision,
}: RecordCategoryMappingFormProps) {
  const [externalCategoryId, setExternalCategoryId] = useState('');
  const [observedCategoryName, setObservedCategoryName] = useState('');
  const [sals3CategoryCode, setSals3CategoryCode] = useState<string | null>(
    null,
  );
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    externalCategoryId.trim() !== '' &&
    observedCategoryName.trim() !== '' &&
    sals3CategoryCode !== null &&
    reason.trim() !== '';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await recordDecision({
        provider: PROVIDER,
        externalCategoryId,
        observedCategoryName,
        sals3CategoryCode,
        reason,
      });

      if (result.ok) {
        setSuccess(true);
        setExternalCategoryId('');
        setObservedCategoryName('');
        setSals3CategoryCode(null);
        setReason('');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-gutter"
    >
      <h2 className="font-heading text-base font-semibold">
        Decide a category mapping
      </h2>

      <div className="flex flex-col gap-2">
        <Label htmlFor="external-category-id">CJ external category ID</Label>
        <Input
          id="external-category-id"
          value={externalCategoryId}
          onChange={(event) => setExternalCategoryId(event.target.value)}
          placeholder="e.g. 2409230540351618000"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="observed-category-name">
          Observed CJ category name
        </Label>
        <Input
          id="observed-category-name"
          value={observedCategoryName}
          onChange={(event) => setObservedCategoryName(event.target.value)}
          placeholder="As seen in Product Catalogue or Add Product"
        />
      </div>

      <Sals3CategoryPicker
        id="sals3-category"
        options={sals3CategoryOptions}
        value={sals3CategoryCode}
        onChange={setSals3CategoryCode}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why this category, for the trail"
        />
      </div>

      {error === null ? null : (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      {!success ? null : (
        <p className="text-sm font-medium text-primary">Decision recorded.</p>
      )}

      <Button type="submit" disabled={!canSubmit || isPending}>
        {isPending ? 'Recording…' : 'Record decision'}
      </Button>
    </form>
  );
}
