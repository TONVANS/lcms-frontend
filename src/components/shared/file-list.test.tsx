import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
import { FileList } from './file-list';

describe('FileList', () => {
  it('labels actions per file and clamps negative sizes', () => {
    render(
      <FileList files={[{ id: '1', name: 'a.pdf', size: -5 }]} onDownload={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByRole('button', { name: lo.dropzone.downloadFile('a.pdf') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.dropzone.deleteFile('a.pdf') })).toBeInTheDocument();
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });

  it('renders type tile and calls onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const files = [{ id: 'f-1', name: 'ppa-contract.pdf', size: 1024 * 500, uploadedAt: '2026-03-01' }];
    render(<FileList files={files} onDelete={onDelete} />);
    expect(screen.getByText('PDF')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: lo.dropzone.deleteFile('ppa-contract.pdf') }));
    expect(onDelete).toHaveBeenCalledWith(files[0]);
  });
});
