import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountdownBadge } from './countdown-badge';

describe('CountdownBadge', () => {
  it('is urgent at 5 days', () => {
    render(<CountdownBadge days={5} />);
    expect(screen.getByText('ອີກ 5 ມື້').closest('[data-tone]')).toHaveAttribute('data-tone', 'urgent');
  });
  it('is planning at 45 days', () => {
    render(<CountdownBadge days={45} />);
    expect(screen.getByText('ອີກ 45 ມື້').closest('[data-tone]')).toHaveAttribute('data-tone', 'planning');
  });
  it('renders nothing beyond 90 days', () => {
    const { container } = render(<CountdownBadge days={120} />);
    expect(container).toBeEmptyDOMElement();
  });
});
