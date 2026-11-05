import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DocumentPreviewDialog, type DocumentPreviewItem } from './document-preview-dialog';

describe('DocumentPreviewDialog', () => {
  const samplePdf: DocumentPreviewItem = {
    id: 'doc-1',
    name: 'contract-draft.pdf',
    url: 'blob:http://localhost/pdf-blob',
    kind: 'pdf',
    fileSize: 1024 * 1024 * 2.5,
    uploadedAt: '2026-11-01T10:00:00Z',
  };

  const sampleImage: DocumentPreviewItem = {
    id: 'doc-2',
    name: 'site-map.png',
    url: 'blob:http://localhost/image-blob',
    kind: 'image',
    fileSize: 1024 * 500,
  };

  const sampleOther: DocumentPreviewItem = {
    id: 'doc-3',
    name: 'financial-model.xlsx',
    url: 'blob:http://localhost/xlsx-blob',
    kind: 'other',
    fileSize: 1024 * 800,
  };

  it('renders nothing when closed or no preview item provided', () => {
    const { container } = render(
      <DocumentPreviewDialog
        open={false}
        onOpenChange={vi.fn()}
        preview={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders responsive PDF preview modal with iframe', () => {
    render(
      <DocumentPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        preview={samplePdf}
        canDownload={true}
        onDownload={vi.fn()}
      />,
    );

    expect(screen.getByText('contract-draft.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();

    const iframe = screen.getByTitle('ເບິ່ງເອກະສານ contract-draft.pdf');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'blob:http://localhost/pdf-blob');
  });

  it('toggles fullscreen responsive mode', () => {
    render(
      <DocumentPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        preview={samplePdf}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: 'ເຕັມຈໍ' });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: 'ອອກຈາກເຕັມຈໍ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ອອກຈາກເຕັມຈໍ' }));
    expect(screen.getByRole('button', { name: 'ເຕັມຈໍ' })).toBeInTheDocument();
  });

  it('renders image preview with zoom controls', () => {
    render(
      <DocumentPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        preview={sampleImage}
      />,
    );

    expect(screen.getByText('site-map.png')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    const zoomInBtn = screen.getByRole('button', { name: 'ຂະຫຍາຍ' });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    const img = screen.getByAltText('site-map.png');
    expect(img).toBeInTheDocument();
  });

  it('renders unsupported file preview with download button', () => {
    const handleDownload = vi.fn();
    render(
      <DocumentPreviewDialog
        open={true}
        onOpenChange={vi.fn()}
        preview={sampleOther}
        canDownload={true}
        onDownload={handleDownload}
      />,
    );

    expect(screen.getAllByText('financial-model.xlsx')).toHaveLength(2);
    expect(
      screen.getByText('ບໍ່ສາມາດສະແດງຕົວຢ່າງໄຟລ໌ປະເພດນີ້ໄດ້ ກະລຸນາດາວໂຫຼດເພື່ອເບິ່ງ'),
    ).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole('button', { name: 'ດາວໂຫຼດ' });
    expect(downloadButtons.length).toBeGreaterThan(0);
    fireEvent.click(downloadButtons[0]);
    expect(handleDownload).toHaveBeenCalled();
  });

  it('calls onOpenChange with false when clicking close button', () => {
    const handleOpenChange = vi.fn();
    render(
      <DocumentPreviewDialog
        open={true}
        onOpenChange={handleOpenChange}
        preview={samplePdf}
      />,
    );

    const closeBtn = screen.getByRole('button', { name: 'ປິດ' });
    fireEvent.click(closeBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
