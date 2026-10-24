import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { LegalNewView } from './legal-new-view';

const mockUseSearchParams = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('LegalNewView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chooser when kind query param is not provided', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(''));
    render(<LegalNewView />);

    expect(screen.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeInTheDocument();
    const regLink = screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseRegulation) });
    expect(regLink).toHaveAttribute('href', '/legal/new?kind=regulation');
    const caseLink = screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseCase) });
    expect(caseLink).toHaveAttribute('href', '/legal/new?kind=case');
  });

  it('renders chooser when kind query param is unknown or bogus', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('kind=bogus'));
    render(<LegalNewView />);

    expect(screen.getByRole('heading', { level: 1, name: lo.legal.wizard.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(lo.legal.wizard.chooseRegulation) })).toBeInTheDocument();
  });

  it('renders case wizard when kind is case', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('kind=case'));
    render(<LegalNewView />);

    expect(
      screen.getByRole('heading', { level: 1, name: lo.legal.wizard.cases.title }),
    ).toBeInTheDocument();
  });

  it('renders regulation wizard when kind is regulation', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('kind=regulation'));
    render(<LegalNewView />);

    expect(
      screen.getByRole('heading', { level: 1, name: lo.legal.wizard.regulations.title }),
    ).toBeInTheDocument();
  });
});
