import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="ຢືນຢັນການລຶບ"
        description="ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ?"
        onConfirm={() => {}}
      />,
    );

    expect(screen.getByText('ຢືນຢັນການລຶບ')).toBeInTheDocument();
    expect(screen.getByText('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="ຢືນຢັນການລຶບ"
        confirmLabel="ລຶບເລີຍ"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'ລຶບເລີຍ' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('disables confirm while pending and closes on resolve', async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: lo.confirm.confirm }));
    expect(screen.getByRole('button', { name: lo.confirm.confirm })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: lo.confirm.confirm }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('stays open when onConfirm rejects', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        onConfirm={() => Promise.reject(new Error('x'))}
      />,
    );
    await user.click(screen.getByRole('button', { name: lo.confirm.confirm }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: lo.confirm.confirm })).toBeEnabled(),
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('close control is labelled in Lao', () => {
    render(<ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: lo.common.close })).toBeInTheDocument();
  });

  it('panel uses the gradient as background-image', () => {
    render(<ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('dialog')).toHaveClass('bg-(image:--surface-modal)');
  });
});
