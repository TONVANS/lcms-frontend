import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentsService } from '@/features/documents';
import { uploadStaged } from './upload-staged';

const file = (name: string) => new File(['x'], name, { type: 'application/pdf' });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('uploadStaged', () => {
  it('uploads each file with the given entityType and id', async () => {
    const upload = vi.spyOn(documentsService, 'upload').mockResolvedValue({} as never);
    const a = file('a.pdf');
    const b = file('b.pdf');
    const res = await uploadStaged([a, b], 'legal-regulation', 'reg-1');
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenCalledWith(a, 'legal-regulation', 'reg-1');
    expect(upload).toHaveBeenCalledWith(b, 'legal-regulation', 'reg-1');
    expect(res.failed).toEqual([]);
  });

  it('returns failed files only', async () => {
    const a = file('a.pdf');
    const b = file('b.pdf');
    const c = file('c.pdf');
    vi.spyOn(documentsService, 'upload').mockImplementation((f) =>
      f === b ? Promise.reject(new Error('boom')) : Promise.resolve({} as never),
    );
    const res = await uploadStaged([a, b, c], 'legal-regulation', 'reg-1');
    expect(res.failed).toEqual([b]);
  });
});
