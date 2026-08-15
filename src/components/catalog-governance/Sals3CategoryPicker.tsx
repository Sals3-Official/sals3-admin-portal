'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type Sals3CategoryOption = { code: string; path: string };

type Sals3CategoryPickerProps = {
  /** The full Sals3 Taxonomy v1 tree, as `{ code, path }` pairs. */
  options: Sals3CategoryOption[];
  value: string | null;
  onChange: (code: string | null) => void;
  id?: string;
};

/**
 * Search-first, not a flat dropdown: 5,595 rows across 21 departments and up
 * to 5 levels each makes a plain `<select>` unusable, and a full drill-down
 * tree is more UI than this first pass needs. Filters the whole tree by
 * substring match on its denormalized `path` (e.g. "Jackets" matches
 * "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets" at any
 * depth), capped so the list stays scannable.
 */
const MAX_RESULTS = 20;

export default function Sals3CategoryPicker({
  options,
  value,
  onChange,
  id,
}: Sals3CategoryPickerProps) {
  const [query, setQuery] = useState('');
  const selected = useMemo(
    () => options.find((option) => option.code === value) ?? null,
    [options, value],
  );

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (trimmed === '') return [];

    return options
      .filter((option) => option.path.toLowerCase().includes(trimmed))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  if (selected !== null) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Sals3 category (v1)</Label>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-input px-2.5 py-1.5 text-sm">
          <span>{selected.path}</span>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => onChange(null)}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Sals3 category (v1)</Label>
      <Input
        id={id}
        type="search"
        placeholder="Search the Sals3 v1 taxonomy, e.g. Jackets"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim() === '' ? null : (
        <ul className="max-h-64 overflow-y-auto rounded-lg border border-border">
          {matches.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">
              No category matches &quot;{query}&quot;.
            </li>
          ) : (
            matches.map((option) => (
              <li key={option.code}>
                <button
                  type="button"
                  className="block w-full px-2.5 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onChange(option.code);
                    setQuery('');
                  }}
                >
                  {option.path}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
