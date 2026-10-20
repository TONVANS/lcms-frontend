import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FadeIn } from './fade-in';

describe('FadeIn', () => {
  it('applies variant class and stagger index', () => {
    render(
      <FadeIn variant="up" index={3}>
        x
      </FadeIn>,
    );
    const el = screen.getByText('x');
    expect(el).toHaveClass('animate-fade-in-up', 'stagger');
    expect(el.style.getPropertyValue('--i')).toBe('3');
  });

  it('omits stagger when no index', () => {
    render(<FadeIn variant="scale">y</FadeIn>);
    expect(screen.getByText('y')).not.toHaveClass('stagger');
  });
});
