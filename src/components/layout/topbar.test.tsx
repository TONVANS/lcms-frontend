import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Topbar } from './topbar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('Topbar', () => {
  it('home variant overrides the focus ring with gold on navy', () => {
    const { container } = render(<Topbar variant="home" unreadCount={0} />);
    expect(container.querySelector('header')).toHaveClass('[--focus-ring:#d4b37a]');
  });
  it('module variant keeps the default ring', () => {
    const { container } = render(<Topbar variant="module" unreadCount={0} />);
    expect(container.querySelector('header')).not.toHaveClass('[--focus-ring:#d4b37a]');
  });
});
