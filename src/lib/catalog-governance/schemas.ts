import { z } from 'zod';

/**
 * The client sends a category *code* and the facts a reviewer looked up, but
 * never the resolved path: `record-decision.ts` re-derives the path from
 * `findSals3CategoryV1ByCode` and refuses a code that does not resolve. A
 * crafted payload therefore cannot record a fabricated path alongside a real
 * code - matching `sals3-portal`'s own "the client sends names, never
 * structure" rule for its option mappings.
 */
export const recordCategoryMappingDecisionSchema = z.object({
  provider: z.literal('CJ_DROPSHIPPING'),
  externalCategoryId: z.string().trim().min(1),
  observedCategoryName: z.string().trim().min(1),
  sals3CategoryCode: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

export type RecordCategoryMappingDecisionFormInput = z.infer<
  typeof recordCategoryMappingDecisionSchema
>;
