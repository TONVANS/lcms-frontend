import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlassCard } from './glass-card';

describe('GlassCard', () => {
  it('spreads props onto the element', () => {
    render(
      <GlassCard as="a" href="/x" id="c" aria-label="card">
        hi
      </GlassCard>,
    );
    const el = screen.getByLabelText('card');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '/x');
    expect(el).toHaveAttribute('id', 'c');
  });
});
