import { describe, expect, it } from 'vitest';
import { toAttachment } from './documents-mapper';

describe('toAttachment', () => {
  it('maps the canonical backend shape', () => {
    expect(
      toAttachment({
        id: 'a1',
        originalName: 'x.pdf',
        mimeType: 'application/pdf',
        fileSize: '1500',
        createdAt: '2026-01-15T10:00:00.000Z',
        uploadedBy: { fullName: 'Somchai' },
      }),
    ).toEqual({
      id: 'a1',
      fileName: 'x.pdf',
      mimeType: 'application/pdf',
      fileSize: 1500,
      createdAt: '2026-01-15T10:00:00.000Z',
      uploadedBy: 'Somchai',
    });
  });

  it('accepts alternative field names', () => {
    expect(
      toAttachment({
        id: 7,
        filename: 'y.png',
        contentType: 'image/png',
        size: 20,
        uploadedAt: '2026-02-01',
        uploadedByName: 'Nok',
      }),
    ).toEqual({
      id: '7',
      fileName: 'y.png',
      mimeType: 'image/png',
      fileSize: 20,
      createdAt: '2026-02-01',
      uploadedBy: 'Nok',
    });
    expect(toAttachment({ id: 'a', fileName: 'z', fileType: 'image/gif', uploadedBy: 'bob' })).toMatchObject({
      fileName: 'z',
      mimeType: 'image/gif',
      uploadedBy: 'bob',
    });
    expect(toAttachment({ id: 'a', name: 'n', mimetype: 'application/pdf' })).toMatchObject({
      fileName: 'n',
      mimeType: 'application/pdf',
    });
  });

  it('is null-safe', () => {
    expect(toAttachment(null)).toEqual({
      id: '',
      fileName: '',
      mimeType: '',
      fileSize: 0,
      createdAt: '',
      uploadedBy: null,
    });
    expect(toAttachment({ id: 'a', uploadedBy: null, fileSize: 'abc' })).toMatchObject({
      uploadedBy: null,
      fileSize: 0,
    });
  });
});
