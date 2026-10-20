import { expect, it } from 'vitest';
import { formatCountdown, getCountdownTone } from './countdown';

it('maps days to tone', () => {
  expect([-3, 0, 7].map(getCountdownTone)).toEqual(['urgent', 'urgent', 'urgent']);
  expect([8, 30].map(getCountdownTone)).toEqual(['warning', 'warning']);
  expect([31, 90].map(getCountdownTone)).toEqual(['planning', 'planning']);
  expect(getCountdownTone(91)).toBeNull();
});
it('formats countdown labels', () => {
  expect(formatCountdown(5)).toBe('ອີກ 5 ມື້');
  expect(formatCountdown(0)).toBe('ມື້ນີ້');
  expect(formatCountdown(-3)).toBe('ກາຍກຳນົດ 3 ມື້');
});
