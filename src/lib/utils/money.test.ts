import { expect, it } from 'vitest';
import { formatMoney } from './money';

it('formats money with currency code', () => {
  expect(formatMoney({ amount: 1200000, currency: 'USD' })).toBe('1,200,000 USD');
  expect(formatMoney({ amount: 386000, currency: 'LAK' })).toBe('386,000 LAK');
});
