import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { installMocks } from '@/lib/api/mock';
import { lo } from '@/lib/i18n/lo';
import { PpaWizardView } from './ppa-wizard-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/ppa/new',
}));

describe('PpaWizardView', () => {
  beforeEach(() => {
    installMocks(api, { delay: 0 });
  });

  it('renders wizard with first step active and live summary', () => {
    render(<PpaWizardView />);
    expect(screen.getByText('ສ້າງສັນຍາຊື້-ຂາຍພະລັງງານແບບລະອຽດ')).toBeInTheDocument();
    expect(screen.getByText(lo.ppa.wizard.summaryTitle)).toBeInTheDocument();
  });
});
