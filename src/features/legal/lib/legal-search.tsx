'use client';

import { useEffect, useRef, useState } from 'react';
import { SearchInput } from '@/components/shared/search-input';

const SEARCH_DEBOUNCE_MS = 300;

export interface LegalSearchProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

/**
 * Search box that owns its text. It commits to the store/callback after a debounce
 * and follows value when that changes from outside unless the user is mid-typing.
 */
export function LegalSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = 'w-full sm:w-72',
}: LegalSearchProps) {
  const [text, setText] = useState(value ?? '');
  const [prevValue, setPrevValue] = useState(value);
  const [editing, setEditing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    if (!editing && text.trim() !== (value ?? '')) setText(value ?? '');
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleChange = (nextVal: string) => {
    setText(nextVal);
    setEditing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setEditing(false);
      const next = nextVal.trim();
      if (next !== (value ?? '')) {
        onChange(next || undefined);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <SearchInput
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  );
}
