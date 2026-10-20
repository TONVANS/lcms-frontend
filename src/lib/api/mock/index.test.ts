import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { installMocks } from './index';

describe('installMocks', () => {
  it('404s unmatched requests', async () => {
    const instance = axios.create();
    installMocks(instance);
    await expect(instance.get('/nope')).rejects.toMatchObject({ response: { status: 404 } });
  });
});
