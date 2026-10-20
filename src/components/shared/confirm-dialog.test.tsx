import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
