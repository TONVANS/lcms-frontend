import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileDropzone } from './file-dropzone';
import { lo } from '@/lib/i18n/lo';

describe('FileDropzone & FileList', () => {
  it('renders dropzone prompt', () => {
    render(<FileDropzone onFilesSelected={() => {}} maxSizeMb={50} />);
    expect(screen.getByText(/ຄລິກເພື່ອເລືອກໄຟລ໌/)).toBeInTheDocument();
  });

  it('has a single focusable control and no nested interactive', () => {
    render(<FileDropzone onFilesSelected={vi.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(document.querySelectorAll('input[type=file]')).toHaveLength(1);
  });

  it('rejects oversize and wrong-type files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(<FileDropzone maxSizeMb={1} onFilesSelected={onFiles} onReject={onReject} />);
    const big = new File([new Uint8Array(2 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    const exe = new File(['x'], 'a.exe');
    await user.upload(screen.getByLabelText(lo.dropzone.prompt), [big, exe]);
    expect(onFiles).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith([lo.dropzone.tooLarge('big.pdf', 1), lo.dropzone.badType('a.exe')]);
  });

  it('passes valid files and reports only the rejected ones', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(<FileDropzone onFilesSelected={onFiles} onReject={onReject} />);
    const ok = new File(['x'], 'ok.pdf', { type: 'application/pdf' });
    const exe = new File(['x'], 'a.exe');
    await user.upload(screen.getByLabelText(lo.dropzone.prompt), [ok, exe]);
    expect(onFiles).toHaveBeenCalledWith([ok]);
    expect(onReject).toHaveBeenCalledWith([lo.dropzone.badType('a.exe')]);
  });

  it('derives the hint from accept and links it to the input', () => {
    const { rerender } = render(<FileDropzone onFilesSelected={vi.fn()} maxSizeMb={5} />);
    const hint = screen.getByText(lo.dropzone.hint('PDF, DOC, DOCX, JPG, JPEG, PNG', 5));
    expect(screen.getByLabelText(lo.dropzone.prompt)).toHaveAttribute('aria-describedby', hint.id);
    rerender(<FileDropzone onFilesSelected={vi.fn()} maxSizeMb={5} accept=".xlsx,.csv" />);
    expect(screen.getByText(lo.dropzone.hint('XLSX, CSV', 5))).toBeInTheDocument();
  });

  it('ignores drops while disabled but still prevents default navigation', () => {
    const onFiles = vi.fn();
    const { container } = render(<FileDropzone onFilesSelected={onFiles} disabled />);
    const label = container.querySelector('label') as HTMLElement;
    const file = new File(['x'], 'ok.pdf', { type: 'application/pdf' });
    const ev = createEvent.drop(label, { dataTransfer: { files: [file] } });
    fireEvent(label, ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(onFiles).not.toHaveBeenCalled();
  });
});
