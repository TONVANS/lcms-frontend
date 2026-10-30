import { describe, expect, it } from 'vitest';
import { createMockDb } from './mock-db';

interface TestUser extends Record<string, unknown> {
  id: string;
  name: string;
}

describe('mock-db', () => {
  it('supports basic CRUD operations and reset', () => {
    const seed = () => [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const db = createMockDb<TestUser>(seed, (r) => r.id);

    expect(db.all()).toHaveLength(2);
    expect(db.get('1')?.name).toBe('Alice');

    db.insert({ id: '3', name: 'Charlie' });
    expect(db.all()).toHaveLength(3);
    expect(db.get('3')?.name).toBe('Charlie');

    db.update('1', { name: 'Alicia' });
    expect(db.get('1')?.name).toBe('Alicia');

    expect(db.remove('2')).toBe(true);
    expect(db.get('2')).toBeUndefined();
    expect(db.all()).toHaveLength(2);

    db.reset(new Date());
    expect(db.all()).toHaveLength(2);
    expect(db.get('1')?.name).toBe('Alice');
  });
});
