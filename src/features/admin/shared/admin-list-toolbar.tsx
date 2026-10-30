'use client';

import { useEffect, useState } from 'react';
import { FilterChips } from '@/components/shared/filter-chips';
import { SearchInput } from '@/components/shared/search-input';

export type ActiveFilter = 'all' | 'active' | 'inactive';

export function activeFilterToBool(f: ActiveFilter): boolean | undefined {
  return f === 'all' ? undefined : f === 'active';
}

const DEBOUNCE_MS = 300;

export interface AdminListToolbarLabels {
  searchLabel: string;
  searchPlaceholder: string;
  filterActive: string;
  all: string;
  active: string;
  inactive: string;
}

interface Props {
  labels: AdminListToolbarLabels;
  /** Committed (debounced) search text. */
  onSearch: (q: string) => void;
  activeFilter: ActiveFilter;
  onActiveFilter: (f: ActiveFilter) => void;
}

export function AdminListToolbar({ labels, onSearch, activeFilter, onActiveFilter }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    const t = setTimeout(() => onSearch(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [text, onSearch]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={text}
        onChange={setText}
        aria-label={labels.searchLabel}
        placeholder={labels.searchPlaceholder}
        className="w-full sm:w-72"
      />
      <FilterChips
        ariaLabel={labels.filterActive}
        value={activeFilter}
        onChange={(v) => onActiveFilter(v as ActiveFilter)}
        options={[
          { value: 'all', label: labels.all },
          { value: 'active', label: labels.active },
          { value: 'inactive', label: labels.inactive },
        ]}
      />
    </div>
  );
}
