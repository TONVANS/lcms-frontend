import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { supportService } from '@/features/support';
import { SupportCard } from './support-card';

beforeEach(() => {
  useAuthStore.setState({
    user: MOCK_USERS.find((u) => u.username === 'gc.viewer')!,
    status: 'authenticated',
  });
});

describe('SupportCard', () => {
  it('exposes tel and mailto links with fallback contacts', () => {
    render(<SupportCard />);
    expect(screen.getByRole('link', { name: /\+856 21 000 000/ })).toHaveAttribute(
      'href',
      'tel:+85621000000',
    );
    expect(screen.getByRole('link', { name: /support@lcms\.example/ })).toHaveAttribute(
      'href',
      'mailto:support@lcms.example',
    );
  });

  it('renders channels from the API when available', async () => {
    const spy = vi.spyOn(supportService, 'contacts').mockResolvedValueOnce([
      { id: '1', channelName: 'Line', contactInfo: '+856 20 9999 8888', description: null, sortOrder: 1, isActive: true },
      { id: '2', channelName: 'Office', contactInfo: 'Floor 3', description: null, sortOrder: 2, isActive: true },
    ]);
    render(<SupportCard />);
    expect(await screen.findByText('Line')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+856 20 9999 8888' })).toHaveAttribute('href', 'tel:+8562099998888');
    expect(screen.getByText('Floor 3')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /support@lcms\.example/ })).toBeNull();
    spy.mockRestore();
  });
});

