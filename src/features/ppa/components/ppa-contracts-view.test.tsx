import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { lo } from '@/lib/i18n/lo';
import { PpaContractsView } from './ppa-contracts-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ppa/contracts',
}));

describe('PpaContractsView', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });

  it('renders contracts list view and filters', async () => {
    render(<PpaContractsView />);
    expect(screen.getByText(lo.ppa.title)).toBeInTheDocument();
    expect(await screen.findByText('PPA-EDL-2010-001')).toBeInTheDocument();
  });
});
