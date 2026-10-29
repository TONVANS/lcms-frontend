import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContractStatusBadge } from './status-badge';

describe('ContractStatusBadge', () => {
  it('renders label and an aria-hidden dot', () => {
    const { container } = render(<ContractStatusBadge status="EXPIRING_SOON" />);
    expect(screen.getByText('ໃກ້ໝົດອາຍຸ')).toBeVisible();
    expect(container.querySelector('[data-slot="dot"]')).toHaveAttribute('aria-hidden', 'true');
  });
});
