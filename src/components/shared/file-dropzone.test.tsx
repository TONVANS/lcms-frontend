import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileDropzone } from './file-dropzone';
import { FileList } from './file-list';

describe('FileDropzone & FileList', () => {
  it('renders dropzone prompt', () => {
    render(<FileDropzone onFilesSelected={() => {}} maxSizeMb={50} />);
    expect(screen.getByText(/ຄລິກເພື່ອເລືອກໄຟລ໌/)).toBeInTheDocument();
  });

  it('renders files in FileList and handles delete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const files = [
      { id: 'f-1', name: 'ppa-contract.pdf', size: 1024 * 500, uploadedAt: '2026-03-01' },
    ];

    render(<FileList files={files} onDelete={onDelete} />);
    expect(screen.getByText('ppa-contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: 'ລຶບອອກ' });
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(files[0]);
  });
});
